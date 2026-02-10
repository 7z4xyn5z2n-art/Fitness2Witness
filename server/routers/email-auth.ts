import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sdk } from "../_core/sdk";
import { COOKIE_NAME } from "../../shared/const";

// Password hashing utilities
async function hashPassword(password: string): Promise<string> {
  // Use Node.js crypto for password hashing
  const crypto = await import("crypto");
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const crypto = await import("crypto");
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === verifyHash;
}

function generateResetToken(): string {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
}

export const emailAuthRouter = router({
  /**
   * Register a new user with email and password
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8, "Password must be at least 8 characters"),
        name: z.string().min(1, "Name is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { email, password, name } = input;

      // Check if user already exists
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const existingUser = existingUsers.length > 0 ? existingUsers[0] : undefined;

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user with default "user" role
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          passwordHash,
          name,
          loginMethod: "email",
          role: "user", // All new users are "user" role by default
          lastSignedIn: new Date(),
        })
        .returning();

      if (!newUser) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user",
        });
      }

      // Create session
      const sessionToken = await sdk.createSessionToken(newUser.id.toString(), { name: newUser.name || "", expiresInMs: 30 * 24 * 60 * 60 * 1000 }); // 30 days

      // Set cookie
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: ctx.req.protocol === "https",
        sameSite: ctx.req.protocol === "https" ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      });

      return {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      };
    }),

  /**
   * Login with email and password
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;

      // Find user by email
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const userResults = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const user = userResults.length > 0 ? userResults[0] : undefined;

      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);

      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Update last signed in
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      // Create session
      const sessionToken = await sdk.createSessionToken(user.id.toString(), { name: user.name || "", expiresInMs: 30 * 24 * 60 * 60 * 1000 }); // 30 days
      // Original line: const sessionToken = await createSessionToken(user);

      // Set cookie
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: ctx.req.protocol === "https",
        sameSite: ctx.req.protocol === "https" ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }),

  /**
   * Request password reset - generates a reset token
   */
  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const { email } = input;

      const db = await getDb();
      if (!db) {
        return { success: true, message: "If an account exists, a reset link will be sent" };
      }

      const userResults = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const user = userResults.length > 0 ? userResults[0] : undefined;

      // Always return success to prevent email enumeration
      if (!user) {
        return { success: true, message: "If an account exists, a reset link will be sent" };
      }

      // Generate reset token (valid for 1 hour)
      const resetToken = generateResetToken();
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      await db
        .update(users)
        .set({
          resetToken,
          resetTokenExpiry,
        })
        .where(eq(users.id, user.id));

      // TODO: Send email with reset link containing the token
      // For now, just return the token (in production, send via email)
      console.log(`Password reset token for ${email}: ${resetToken}`);

      return {
        success: true,
        message: "If an account exists, a reset link will be sent",
        // Remove this in production - only for testing
        resetToken,
      };
    }),

  /**
   * Reset password using token
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const { token, newPassword } = input;

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const userResults = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);
      const user = userResults.length > 0 ? userResults[0] : undefined;

      if (!user || !user.resetTokenExpiry) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token",
        });
      }

      // Check if token is expired
      if (new Date() > user.resetTokenExpiry) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Reset token has expired",
        });
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update password and clear reset token
      await db
        .update(users)
        .set({
          passwordHash,
          resetToken: null,
          resetTokenExpiry: null,
        })
        .where(eq(users.id, user.id));

      return {
        success: true,
        message: "Password has been reset successfully",
      };
    }),
});
