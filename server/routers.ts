import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";

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
});

export type AppRouter = typeof appRouter;
