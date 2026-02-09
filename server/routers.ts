import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";

// Helper function to analyze workout text using AI
async function analyzeWorkout(workoutText: string): Promise<string> {
  const { invokeLLM } = await import("./_core/llm.js");

  const prompt = `Analyze this workout description and extract key metrics. Respond ONLY with a JSON object:

{
  "exerciseTypes": ["strength", "cardio", "flexibility"],
  "duration": number (minutes),
  "intensity": "low" | "moderate" | "high",
  "exercises": ["exercise name"],
  "estimatedCalories": number,
  "summary": "brief summary"
}

Workout: ${workoutText}`;

  const result = await invokeLLM({
    messages: [{ role: "user", content: prompt }],
  });

  const messageContent = result.choices[0]?.message?.content;
  return typeof messageContent === "string" ? messageContent : "{}";
}

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Daily Check-ins
  checkins: router({
    getTodayCheckin: protectedProcedure.query(async ({ ctx }) => {
      return db.getDailyCheckin(ctx.user.id, new Date());
    }),

    getMyCheckins: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserCheckins(ctx.user.id);
    }),

    submit: protectedProcedure
      .input(
        z.object({
          date: z.string(),
          nutritionDone: z.boolean(),
          hydrationDone: z.boolean(),
          movementDone: z.boolean(),
          scriptureDone: z.boolean(),
          notes: z.string().optional(),
          proofPhotoBase64: z.string().optional(),
          workoutLog: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || !user.groupId) {
          throw new Error("User must be assigned to a group");
        }

        const group = await db.getGroupById(user.groupId);
        if (!group || !group.challengeId) {
          throw new Error("Group must be assigned to a challenge");
        }

        const date = new Date(input.date);
        const existing = await db.getDailyCheckin(ctx.user.id, date);

        if (existing) {
          throw new Error("Check-in already exists for this date");
        }

        let proofPhotoUrl: string | undefined;
        if (input.proofPhotoBase64) {
          const buffer = Buffer.from(input.proofPhotoBase64, "base64");
          const filename = `checkins/${ctx.user.id}/${Date.now()}.jpg`;
          const result = await storagePut(filename, buffer, "image/jpeg");
          proofPhotoUrl = result.url;
        }

        const checkinId = await db.createDailyCheckin({
          date,
          userId: ctx.user.id,
          groupId: user.groupId,
          challengeId: group.challengeId,
          nutritionDone: input.nutritionDone,
          hydrationDone: input.hydrationDone,
          movementDone: input.movementDone,
          scriptureDone: input.scriptureDone,
          notes: input.notes,
          proofPhotoUrl,
          workoutLog: input.workoutLog,
          workoutAnalysis: input.workoutLog ? await analyzeWorkout(input.workoutLog) : undefined,
        });

        return { success: true, checkinId };
      }),
  }),

  // Metrics & Leaderboard
  metrics: router({
    getMyMetrics: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || !user.groupId) {
        throw new Error("User must be assigned to a group");
      }

      const group = await db.getGroupById(user.groupId);
      if (!group || !group.challengeId) {
        throw new Error("Group must be assigned to a challenge");
      }

      return db.getUserMetrics(ctx.user.id, group.challengeId);
    }),

    getGroupLeaderboard: protectedProcedure
      .input(z.object({ period: z.enum(["week", "overall"]) }))
      .query(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || !user.groupId) {
          throw new Error("User must be assigned to a group");
        }

        const group = await db.getGroupById(user.groupId);
        if (!group || !group.challengeId) {
          throw new Error("Group must be assigned to a challenge");
        }

        const groupUsers = await db.getUsersByGroupId(user.groupId);
        const leaderboard = await Promise.all(
          groupUsers.map(async (u) => {
            const metrics = await db.getUserMetrics(u.id, group.challengeId!);
            return {
              userId: u.id,
              name: u.name || "Unknown",
              points: input.period === "week" ? metrics.thisWeekTotal : metrics.totalPoints,
              maxPoints: input.period === "week" ? 38 : 456,
            };
          })
        );

        leaderboard.sort((a, b) => b.points - a.points);
        return leaderboard;
      }),

    getWeeklyProgress: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || !user.groupId) {
        throw new Error("User must be assigned to a group");
      }

      const group = await db.getGroupById(user.groupId);
      if (!group || !group.challengeId) {
        throw new Error("Group must be assigned to a challenge");
      }

      const challenge = await db.getChallengeById(group.challengeId);
      if (!challenge) {
        throw new Error("Challenge not found");
      }

      // Get all check-ins for this user in the challenge
      const checkins = await db.getUserCheckins(ctx.user.id);
      
      // Group by week and calculate weekly totals
      const weeklyData: { week: number; points: number }[] = [];
      const challengeStart = new Date(challenge.startDate);
      
      for (let week = 1; week <= 12; week++) {
        const weekStart = new Date(challengeStart);
        weekStart.setDate(challengeStart.getDate() + (week - 1) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        
        const weekCheckins = checkins.filter(c => {
          const checkinDate = new Date(c.date);
          return checkinDate >= weekStart && checkinDate < weekEnd;
        });
        
        const weekPoints = weekCheckins.reduce((sum, c) => {
          return sum + [c.nutritionDone, c.hydrationDone, c.movementDone, c.scriptureDone].filter(Boolean).length;
        }, 0);
        
        weeklyData.push({ week, points: weekPoints });
      }
      
      return weeklyData;
    }),

    getCategoryConsistency: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || !user.groupId) {
        throw new Error("User must be assigned to a group");
      }

      const checkins = await db.getUserCheckins(ctx.user.id);
      
      const total = checkins.length;
      if (total === 0) {
        return [
          { category: "Nutrition", percentage: 0 },
          { category: "Hydration", percentage: 0 },
          { category: "Movement", percentage: 0 },
          { category: "Scripture", percentage: 0 },
        ];
      }
      
      const nutritionCount = checkins.filter(c => c.nutritionDone).length;
      const hydrationCount = checkins.filter(c => c.hydrationDone).length;
      const movementCount = checkins.filter(c => c.movementDone).length;
      const scriptureCount = checkins.filter(c => c.scriptureDone).length;
      
      return [
        { category: "Nutrition", percentage: Math.round((nutritionCount / total) * 100) },
        { category: "Hydration", percentage: Math.round((hydrationCount / total) * 100) },
        { category: "Movement", percentage: Math.round((movementCount / total) * 100) },
        { category: "Scripture", percentage: Math.round((scriptureCount / total) * 100) },
      ];
    }),
  }),

  // Weekly Attendance
  attendance: router({
    getGroupMembers: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || !user.groupId) {
        throw new Error("User must be assigned to a group");
      }

      // Only admins and leaders can access this
      if (ctx.user.role !== "admin" && ctx.user.role !== "leader") {
        throw new Error("Only admins and leaders can view group members");
      }

      return db.getGroupMembers(user.groupId);
    }),

    getThisWeekAttendance: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || !user.groupId) {
        throw new Error("User must be assigned to a group");
      }

      const group = await db.getGroupById(user.groupId);
      if (!group || !group.challengeId) {
        throw new Error("Group must be assigned to a challenge");
      }

      // Get start of current week (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + diff);
      weekStart.setHours(0, 0, 0, 0);

      return db.getWeeklyAttendanceForGroup(user.groupId, weekStart);
    }),

    markAttendance: protectedProcedure
      .input(z.object({ userIds: z.array(z.number()), date: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || !user.groupId) {
          throw new Error("User must be assigned to a group");
        }

        // Only admins and leaders can mark attendance
        if (ctx.user.role !== "admin" && ctx.user.role !== "leader") {
          throw new Error("Only admins and leaders can mark attendance");
        }

        const group = await db.getGroupById(user.groupId);
        if (!group || !group.challengeId) {
          throw new Error("Group must be assigned to a challenge");
        }

        // Get start of current week (Monday)
        const now = new Date(input.date);
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() + diff);
        weekStart.setHours(0, 0, 0, 0);

        // Mark attendance for each selected user
        for (const userId of input.userIds) {
          const existing = await db.getWeeklyAttendance(userId, weekStart);

          if (existing) {
            await db.updateWeeklyAttendance(existing.id, { attendedWednesday: true });
          } else {
            await db.createWeeklyAttendance({
              weekStartDate: weekStart,
              userId,
              groupId: user.groupId,
              challengeId: group.challengeId,
              attendedWednesday: true,
            });
          }
        }

        return { success: true };
      }),
  }),

  // Community Feed
  community: router({
    getPosts: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || !user.groupId) {
        throw new Error("User must be assigned to a group");
      }

      const posts = await db.getGroupPosts(user.groupId);
      const postsWithUsers = await Promise.all(
        posts.map(async (post) => {
          const author = await db.getUserById(post.userId);
          return {
            ...post,
            authorName: author?.name || "Unknown",
          };
        })
      );

      return postsWithUsers;
    }),

    getPostById: protectedProcedure.input(z.object({ postId: z.number() })).query(async ({ input }) => {
      const post = await db.getPostById(input.postId);
      if (!post) return null;

      const author = await db.getUserById(post.userId);
      return {
        ...post,
        authorName: author?.name || "Unknown",
      };
    }),

    createPost: protectedProcedure
      .input(
        z.object({
          postType: z.enum(["Encouragement", "Testimony", "Photo", "Video", "Announcement"]),
          postText: z.string().optional(),
          postImageBase64: z.string().optional(),
          postVideoUrl: z.string().optional(),
          visibility: z.enum(["GroupOnly", "LeadersOnly"]).default("GroupOnly"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || !user.groupId) {
          throw new Error("User must be assigned to a group");
        }

        let postImageUrl: string | undefined;
        if (input.postImageBase64) {
          const buffer = Buffer.from(input.postImageBase64, "base64");
          const filename = `posts/${ctx.user.id}/${Date.now()}.jpg`;
          const result = await storagePut(filename, buffer, "image/jpeg");
          postImageUrl = result.url;
        }

        const postId = await db.createPost({
          userId: ctx.user.id,
          groupId: user.groupId,
          postType: input.postType,
          postText: input.postText,
          postImageUrl,
          postVideoUrl: input.postVideoUrl,
          visibility: input.visibility,
        });

        return { success: true, postId };
      }),

    pinPost: protectedProcedure
      .input(z.object({ postId: z.number(), pinned: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || (user.role !== "leader" && user.role !== "admin")) {
          throw new Error("Only leaders and admins can pin posts");
        }

        await db.updatePost(input.postId, { isPinned: input.pinned });
        return { success: true };
      }),

    deletePost: protectedProcedure.input(z.object({ postId: z.number() })).mutation(async ({ ctx, input }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || user.role !== "admin") {
        throw new Error("Only admins can delete posts");
      }

      await db.deletePost(input.postId);
      return { success: true };
    }),

    getComments: protectedProcedure.input(z.object({ postId: z.number() })).query(async ({ input }) => {
      const comments = await db.getPostComments(input.postId);
      const commentsWithUsers = await Promise.all(
        comments.map(async (comment) => {
          const author = await db.getUserById(comment.userId);
          return {
            ...comment,
            authorName: author?.name || "Unknown",
          };
        })
      );

      return commentsWithUsers;
    }),

    addComment: protectedProcedure
      .input(z.object({ postId: z.number(), commentText: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const commentId = await db.createComment({
          postId: input.postId,
          userId: ctx.user.id,
          commentText: input.commentText,
        });

        return { success: true, commentId };
      }),
  }),

  // Group Chat
  chat: router({
    getMessages: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || !user.groupId) {
        throw new Error("User must be assigned to a group");
      }

      const messages = await db.getGroupMessages(user.groupId);
      const messagesWithUsers = await Promise.all(
        messages.map(async (message) => {
          const author = await db.getUserById(message.userId);
          return {
            ...message,
            authorName: author?.name || "Unknown",
          };
        })
      );

      return messagesWithUsers;
    }),

    sendMessage: protectedProcedure
      .input(z.object({ messageText: z.string().optional(), messageImageBase64: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || !user.groupId) {
          throw new Error("User must be assigned to a group");
        }

        let messageImageUrl: string | undefined;
        if (input.messageImageBase64) {
          const buffer = Buffer.from(input.messageImageBase64, "base64");
          const filename = `chat/${ctx.user.id}/${Date.now()}.jpg`;
          const result = await storagePut(filename, buffer, "image/jpeg");
          messageImageUrl = result.url;
        }

        const messageId = await db.createMessage({
          userId: ctx.user.id,
          groupId: user.groupId,
          messageText: input.messageText,
          messageImageUrl,
        });

        return { success: true, messageId };
      }),
  }),

  // Leader Dashboard
  leader: router({
    getParticipationToday: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || (user.role !== "leader" && user.role !== "admin")) {
        throw new Error("Only leaders and admins can access this");
      }
      if (!user.groupId) {
        throw new Error("Leader must be assigned to a group");
      }

      const today = new Date();
      const checkins = await db.getGroupCheckinsForDate(user.groupId, today);
      const groupUsers = await db.getUsersByGroupId(user.groupId);

      return {
        checkedIn: checkins.length,
        total: groupUsers.length,
      };
    }),

    getNeedsFollowUp: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || (user.role !== "leader" && user.role !== "admin")) {
        throw new Error("Only leaders and admins can access this");
      }
      if (!user.groupId) {
        throw new Error("Leader must be assigned to a group");
      }

      const group = await db.getGroupById(user.groupId);
      if (!group || !group.challengeId) {
        throw new Error("Group must be assigned to a challenge");
      }

      const groupUsers = await db.getUsersByGroupId(user.groupId);
      const needsFollowUp = await Promise.all(
        groupUsers.map(async (u) => {
          const metrics = await db.getUserMetrics(u.id, group.challengeId!);
          return {
            userId: u.id,
            name: u.name || "Unknown",
            weeklyPercent: metrics.weeklyPercent,
          };
        })
      );

      return needsFollowUp.filter((u) => u.weeklyPercent < 50);
    }),
  }),

  // Admin Console
  admin: router({
    getAllUsers: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || user.role !== "admin") {
        throw new Error("Only admins can access this");
      }

      return db.getAllUsers();
    }),

    updateUser: protectedProcedure
      .input(
        z.object({
          userId: z.number(),
          name: z.string().optional(),
          email: z.string().optional(),
          groupId: z.number().optional(),
          role: z.enum(["user", "leader", "admin"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || user.role !== "admin") {
          throw new Error("Only admins can update users");
        }

        const { userId, ...updateData } = input;
        await db.updateUser(userId, updateData);
        return { success: true };
      }),

    getAllGroups: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || user.role !== "admin") {
        throw new Error("Only admins can access this");
      }

      return db.getAllGroups();
    }),

    createGroup: protectedProcedure
      .input(
        z.object({
          groupName: z.string(),
          leaderUserId: z.number().optional(),
          challengeId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || user.role !== "admin") {
          throw new Error("Only admins can create groups");
        }

        const groupId = await db.createGroup(input);
        return { success: true, groupId };
      }),

    updateGroup: protectedProcedure
      .input(
        z.object({
          groupId: z.number(),
          groupName: z.string().optional(),
          leaderUserId: z.number().optional(),
          challengeId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || user.role !== "admin") {
          throw new Error("Only admins can update groups");
        }

        const { groupId, ...updateData } = input;
        await db.updateGroup(groupId, updateData);
        return { success: true };
      }),

    getAllChallenges: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || user.role !== "admin") {
        throw new Error("Only admins can access this");
      }

      return db.getAllChallenges();
    }),

    createChallenge: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          startDate: z.string(),
          endDate: z.string(),
          active: z.boolean().default(true),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || user.role !== "admin") {
          throw new Error("Only admins can create challenges");
        }

        const challengeId = await db.createChallenge({
          ...input,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
        });
        return { success: true, challengeId };
      }),

    updateChallenge: protectedProcedure
      .input(
        z.object({
          challengeId: z.number(),
          name: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          active: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || user.role !== "admin") {
          throw new Error("Only admins can update challenges");
        }

        const { challengeId, ...rest } = input;
        const updateData: any = { ...rest };
        if (rest.startDate) updateData.startDate = new Date(rest.startDate);
        if (rest.endDate) updateData.endDate = new Date(rest.endDate);

        await db.updateChallenge(challengeId, updateData);
        return { success: true };
      }),

    createPointAdjustment: protectedProcedure
      .input(
        z.object({
          userId: z.number(),
          pointsDelta: z.number(),
          reason: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const adminUser = await db.getUserById(ctx.user.id);
        if (!adminUser || adminUser.role !== "admin") {
          throw new Error("Only admins can create point adjustments");
        }

        const targetUser = await db.getUserById(input.userId);
        if (!targetUser || !targetUser.groupId) {
          throw new Error("Target user must be assigned to a group");
        }

        const group = await db.getGroupById(targetUser.groupId);
        if (!group || !group.challengeId) {
          throw new Error("Group must be assigned to a challenge");
        }

        const adjustmentId = await db.createPointAdjustment({
          date: new Date(),
          userId: input.userId,
          groupId: targetUser.groupId,
          challengeId: group.challengeId,
          pointsDelta: input.pointsDelta,
          reason: input.reason,
          adjustedBy: ctx.user.id,
        });

        return { success: true, adjustmentId };
      }),

    getAuditLog: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || user.role !== "admin") {
        throw new Error("Only admins can access audit log");
      }

      const adjustments = await db.getAllPointAdjustments();
      const adjustmentsWithUsers = await Promise.all(
        adjustments.map(async (adj) => {
          const targetUser = await db.getUserById(adj.userId);
          const adminUser = await db.getUserById(adj.adjustedBy);
          return {
            ...adj,
            targetUserName: targetUser?.name || "Unknown",
            adminName: adminUser?.name || "Unknown",
          };
        })
      );

      return adjustmentsWithUsers;
    }),

    getCheckInsByDate: protectedProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || user.role !== "admin") {
          throw new Error("Only admins can access this");
        }

        return db.getCheckInsByDate(new Date(input.date));
      }),

    getAttendanceByDate: protectedProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || user.role !== "admin") {
          throw new Error("Only admins can access this");
        }

        return db.getAttendanceByDate(new Date(input.date));
      }),

    addUserCheckIn: protectedProcedure
      .input(
        z.object({
          userId: z.string(),
          date: z.string(),
          nutritionDone: z.boolean(),
          hydrationDone: z.boolean(),
          movementDone: z.boolean(),
          scriptureDone: z.boolean(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const adminUser = await db.getUserById(ctx.user.id);
        if (!adminUser || adminUser.role !== "admin") {
          throw new Error("Only admins can add check-ins");
        }

        const targetUser = await db.getUserById(parseInt(input.userId));
        if (!targetUser || !targetUser.groupId) {
          throw new Error("User must be assigned to a group");
        }

        const group = await db.getGroupById(targetUser.groupId);
        if (!group || !group.challengeId) {
          throw new Error("Group must be assigned to a challenge");
        }

        await db.createCheckIn({
          date: new Date(input.date),
          userId: parseInt(input.userId),
          groupId: targetUser.groupId,
          challengeId: group.challengeId,
          nutritionDone: input.nutritionDone,
          hydrationDone: input.hydrationDone,
          movementDone: input.movementDone,
          scriptureDone: input.scriptureDone,
          notes: input.notes,
        });

        return { success: true };
      }),

    addUserAttendance: protectedProcedure
      .input(
        z.object({
          userId: z.string(),
          date: z.string(),
          attended: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const adminUser = await db.getUserById(ctx.user.id);
        if (!adminUser || adminUser.role !== "admin") {
          throw new Error("Only admins can add attendance");
        }

        const targetUser = await db.getUserById(parseInt(input.userId));
        if (!targetUser || !targetUser.groupId) {
          throw new Error("User must be assigned to a group");
        }

        const group = await db.getGroupById(targetUser.groupId);
        if (!group || !group.challengeId) {
          throw new Error("Group must be assigned to a challenge");
        }

        const date = new Date(input.date);
        const startOfWeek = new Date(date);
        startOfWeek.setHours(0, 0, 0, 0);
        const dayOfWeek = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - dayOfWeek;
        startOfWeek.setDate(diff);

        await db.createWeeklyAttendance({
          weekStartDate: startOfWeek,
          userId: parseInt(input.userId),
          groupId: targetUser.groupId,
          challengeId: group.challengeId,
          attendedWednesday: input.attended,
        });

        return { success: true };
      }),
  }),

  // Body Metrics
  bodyMetrics: router({
    getMyMetrics: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserBodyMetrics(ctx.user.id);
    }),

    getMetricsByDateRange: protectedProcedure
      .input(
        z.object({
          startDate: z.string(),
          endDate: z.string(),
        })
      )
      .query(async ({ ctx, input }) => {
        return db.getBodyMetricsByDateRange(ctx.user.id, new Date(input.startDate), new Date(input.endDate));
      }),

    create: protectedProcedure
      .input(
        z.object({
          date: z.string(),
          weight: z.number().optional(),
          bodyFatPercent: z.number().optional(),
          muscleMass: z.number().optional(),
          visceralFat: z.number().optional(),
          bmr: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user || !user.groupId) {
          throw new Error("User must be assigned to a group");
        }

        const activeChallenges = await db.getActiveChallenges();
        if (activeChallenges.length === 0) {
          throw new Error("No active challenge found");
        }

        const metricId = await db.createBodyMetric({
          userId: ctx.user.id,
          groupId: user.groupId,
          challengeId: activeChallenges[0].id,
          date: new Date(input.date),
          weight: input.weight,
          bodyFatPercent: input.bodyFatPercent,
          muscleMass: input.muscleMass,
          visceralFat: input.visceralFat,
          bmr: input.bmr,
          notes: input.notes,
        });

        return { id: metricId, success: true };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          weight: z.number().optional(),
          bodyFatPercent: z.number().optional(),
          muscleMass: z.number().optional(),
          visceralFat: z.number().optional(),
          bmr: z.number().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateBodyMetric(input.id, {
          weight: input.weight,
          bodyFatPercent: input.bodyFatPercent,
          muscleMass: input.muscleMass,
          visceralFat: input.visceralFat,
          bmr: input.bmr,
          notes: input.notes,
        });

        return { success: true };
      }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteBodyMetric(input.id);
      return { success: true };
    }),

    analyzeInBodyScan: protectedProcedure
      .input(z.object({ imageBase64: z.string() }))
      .mutation(async ({ input }) => {
        // Use AI to analyze InBody scan image
        const { invokeLLM } = await import("./_core/llm.js");

        const prompt = `You are analyzing an InBody body composition analysis scan. Extract the following metrics if visible:
- Weight (in pounds or kg)
- Body Fat Percentage (%)
- Muscle Mass (in pounds or kg)
- Visceral Fat Level
- BMR (Basal Metabolic Rate)

Respond ONLY with a JSON object in this exact format:
{
  "weight": number or null,
  "bodyFatPercent": number or null,
  "muscleMass": number or null,
  "visceralFat": number or null,
  "bmr": number or null
}

If a metric is not visible or cannot be determined, use null. Do not include any other text.`;

        const result = await invokeLLM({
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${input.imageBase64}`,
                  },
                },
              ],
            },
          ],
        });

        const messageContent = result.choices[0]?.message?.content;
        const responseText = typeof messageContent === "string" ? messageContent : "";

        try {
          const parsed = JSON.parse(responseText);
          return {
            weight: parsed.weight,
            bodyFatPercent: parsed.bodyFatPercent,
            muscleMass: parsed.muscleMass,
            visceralFat: parsed.visceralFat,
            bmr: parsed.bmr,
          };
        } catch (error) {
          throw new Error("Failed to parse InBody scan results. Please try again or enter manually.");
        }
      }),
  }),

  badges: router({
    getMyBadges: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserBadges(ctx.user.id);
    }),

    checkAndAward: protectedProcedure.mutation(async ({ ctx }) => {
      return db.checkAndAwardBadges(ctx.user.id);
    }),
  }),

  // Analytics (Leaders and Admins only)
  analytics: router({
    getGroupAnalytics: protectedProcedure.query(async ({ ctx }) => {
      // Only leaders and admins can access analytics
      if (ctx.user.role !== "leader" && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const user = await db.getUserById(ctx.user.id);
      if (!user || !user.groupId) {
        throw new Error("User not in a group");
      }

      // Get all group members
      const members = await db.getGroupMembers(user.groupId);
      const totalMembers = members.length;

      // Get current week start (Sunday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);

      // Count members who checked in this week
      let activeMembers = 0;
      let totalWeeklyPoints = 0;
      let totalOverallPoints = 0;
      const topPerformers: any[] = [];
      const needsFollowUp: any[] = [];

      for (const member of members) {
        // Get check-ins since week start
        const allMemberCheckins = await db.getUserCheckins(member.id);
        const weeklyCheckins = allMemberCheckins.filter((c: any) => new Date(c.date) >= weekStart);
        const weeklyPoints = weeklyCheckins.reduce((sum: number, c: any) => {
          let points = 0;
          if (c.nutrition) points++;
          if (c.hydration) points++;
          if (c.movement) points++;
          if (c.scripture) points++;
          return sum + points;
        }, 0);

        if (weeklyCheckins.length > 0) {
          activeMembers++;
        }

        totalWeeklyPoints += weeklyPoints;

        // Get overall points
        const allCheckins = await db.getUserCheckins(member.id);
        const overallPoints = allCheckins.reduce((sum: number, c: any) => {
          let points = 0;
          if (c.nutrition) points++;
          if (c.hydration) points++;
          if (c.movement) points++;
          if (c.scripture) points++;
          return sum + points;
        }, 0);
        totalOverallPoints += overallPoints;

        topPerformers.push({
          userId: member.id,
          userName: member.name || "Unknown",
          weeklyPoints,
        });

        // Check if needs follow-up (no check-ins in 3+ days or below 50%)
        const lastCheckin = allCheckins[0];
        const daysSinceLastCheckin = lastCheckin
          ? Math.floor((now.getTime() - new Date(lastCheckin.date).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        if (daysSinceLastCheckin >= 3) {
          needsFollowUp.push({
            userId: member.id,
            userName: member.name || "Unknown",
            reason: `No check-ins for ${daysSinceLastCheckin} days`,
          });
        } else if (weeklyPoints < 19) {
          // Below 50% of weekly max (38 points)
          needsFollowUp.push({
            userId: member.id,
            userName: member.name || "Unknown",
            reason: `Low weekly score: ${weeklyPoints}/38 points`,
          });
        }
      }

      // Sort top performers
      topPerformers.sort((a, b) => b.weeklyPoints - a.weeklyPoints);

      // Get attendance rate
      const weeklyAttendance = await db.getWeeklyAttendanceForGroup(user.groupId, weekStart);
      const attendanceRate = totalMembers > 0 ? (weeklyAttendance.length / totalMembers) * 100 : 0;

      // Get engagement metrics
      // Get posts since week start
      const allPosts = await db.getGroupPosts(user.groupId, 100);
      const postsThisWeek = allPosts.filter((p: any) => new Date(p.createdAt) >= weekStart);
      // Count workout loggers (simplified)
      let workoutLoggers = 0;
      for (const m of members) {
        const checkins = await db.getUserCheckins(m.id, 20);
        const weeklyCheckins = checkins.filter((c: any) => new Date(c.date) >= weekStart);
        if (weeklyCheckins.some((c: any) => c.workoutLog)) {
          workoutLoggers++;
        }
      }
      // Count metrics trackers (simplified)
      let metricsTrackers = 0;
      for (const m of members) {
        const metrics = await db.getUserBodyMetrics(m.id, 5);
        if (metrics.length > 0) {
          metricsTrackers++;
        }
      }

      return {
        totalMembers,
        activeMembers,
        participationRate: totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0,
        avgWeeklyPoints: totalMembers > 0 ? totalWeeklyPoints / totalMembers : 0,
        avgTotalPoints: totalMembers > 0 ? totalOverallPoints / totalMembers : 0,
        topPerformers: topPerformers.slice(0, 3),
        needsFollowUp: needsFollowUp.slice(0, 5),
        attendanceRate,
        postsThisWeek: postsThisWeek.length,
        workoutLoggers,
        metricsTrackers,
      };
    }),
  }),

  // Group Challenges
  groupChallenges: router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || !user.groupId) return [];
      return db.getGroupChallenges(user.groupId);
    }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          challengeType: z.enum(["running", "steps", "workouts", "custom"]),
          goalValue: z.number().optional(),
          goalUnit: z.string().optional(),
          startDate: z.string(),
          endDate: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Only leaders and admins can create challenges
        if (ctx.user.role !== "leader" && ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }

        const user = await db.getUserById(ctx.user.id);
        if (!user || !user.groupId) {
          throw new Error("User not in a group");
        }

        const challengeId = await db.createGroupChallenge({
          groupId: user.groupId,
          createdByUserId: ctx.user.id,
          title: input.title,
          description: input.description,
          challengeType: input.challengeType,
          goalValue: input.goalValue,
          goalUnit: input.goalUnit,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
        });

        return { success: true, challengeId };
      }),

    join: protectedProcedure
      .input(z.object({ challengeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.joinChallenge(input.challengeId, ctx.user.id);
        return { success: true };
      }),

    logProgress: protectedProcedure
      .input(
        z.object({
          challengeId: z.number(),
          currentValue: z.number(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.logChallengeProgress({
          challengeId: input.challengeId,
          userId: ctx.user.id,
          currentValue: input.currentValue,
          notes: input.notes,
        });
        return { success: true };
      }),

    getLeaderboard: protectedProcedure
      .input(z.object({ challengeId: z.number() }))
      .query(async ({ input }) => {
        return db.getChallengeLeaderboard(input.challengeId);
      }),

    getMyProgress: protectedProcedure
      .input(z.object({ challengeId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getChallengeProgress(input.challengeId, ctx.user.id);
      }),

    getComments: protectedProcedure
      .input(z.object({ challengeId: z.number() }))
      .query(async ({ input }) => {
        return db.getChallengeComments(input.challengeId);
      }),

    createComment: protectedProcedure
      .input(
        z.object({
          challengeId: z.number(),
          content: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const commentId = await db.createChallengeComment({
          challengeId: input.challengeId,
          userId: ctx.user.id,
          content: input.content,
        });
        return { success: true, commentId };
      }),

    deleteComment: protectedProcedure
      .input(z.object({ commentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const success = await db.deleteChallengeComment(input.commentId, ctx.user.id);
        if (!success) {
          throw new Error("Unauthorized or comment not found");
        }
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
