import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { users } from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { getSessionCookieOptions } from "../_core/cookies";
import { COOKIE_NAME } from "../../shared/const";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-change-in-production");

/**
 * Phone-based authentication router
 * Simple registration and login using phone numbers
 */
export const phoneAuthRouter = router({
  /**
   * Register a new user with name and phone number
   */
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        phoneNumber: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { name, phoneNumber } = input;

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Check if phone number already exists
      const existingUsers = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber)).limit(1);
      const existingUser = existingUsers.length > 0 ? existingUsers[0] : undefined;

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this phone number already exists",
        });
      }

      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          name,
          phoneNumber,
          role: "user",
          lastSignedIn: new Date(),
        })
        .returning();

      if (!newUser) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user",
        });
      }

      // Create session token
      const sessionToken = await new SignJWT({
        userId: newUser.id,
        phoneNumber: newUser.phoneNumber,
        name: newUser.name,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("30d")
        .sign(JWT_SECRET);

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      console.log('[Login] Setting cookie with options:', JSON.stringify(cookieOptions));
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
      console.log('[Login] Cookie set successfully');

      return {
        success: true,
        token: sessionToken,
        user: {
          id: newUser.id,
          name: newUser.name,
          phoneNumber: newUser.phoneNumber,
          role: newUser.role,
          groupId: newUser.groupId,
        },
      };
    }),

  /**
   * Login with phone number
   */
  login: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { phoneNumber } = input;

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Find user by phone number
      const existingUsers = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber)).limit(1);
      const user = existingUsers.length > 0 ? existingUsers[0] : undefined;

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No account found with this phone number",
        });
      }

      // Update last signed in
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      // Create session token
      const sessionToken = await new SignJWT({
        userId: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("30d")
        .sign(JWT_SECRET);

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      console.log('[Login] Setting cookie with options:', JSON.stringify(cookieOptions));
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
      console.log('[Login] Cookie set successfully');

      return {
        success: true,
        token: sessionToken,
        user: {
          id: user.id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          role: user.role,
          groupId: user.groupId,
        },
      };
    }),
});
