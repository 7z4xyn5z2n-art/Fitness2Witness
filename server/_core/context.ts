import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME } from "../../shared/const";
import * as db from "../db";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-change-in-production");

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    let sessionToken: string | undefined;

    // Try to get token from Authorization header first (for token-based auth)
    const authHeader = opts.req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7);
      console.log('[Auth Debug] Token from Authorization header');
    }

    // Fallback to cookie-based auth if no Authorization header
    if (!sessionToken) {
      const cookieHeader = opts.req.headers.cookie;
      console.log('[Auth Debug] Cookie header:', cookieHeader ? 'present' : 'missing');
      
      if (cookieHeader) {
        const cookies = parseCookieHeader(cookieHeader);
        sessionToken = cookies[COOKIE_NAME];
        console.log('[Auth Debug] Session token from cookie:', sessionToken ? 'found' : 'missing');
      }
    }

    if (!sessionToken) {
      console.log('[Auth Debug] No session token found');
      return { req: opts.req, res: opts.res, user: null };
    }

    // Verify JWT token
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
    const userId = payload.userId as number;

    if (!userId) {
      console.log('[Auth Debug] No userId in token payload');
      return { req: opts.req, res: opts.res, user: null };
    }

    // Get user from database
    user = await db.getUserById(userId) ?? null;
    console.log('[Auth Debug] User loaded:', user ? `${user.name} (ID: ${user.id})` : 'not found');
  } catch (error) {
    // Authentication is optional for public procedures
    console.log('[Auth Debug] Error:', error instanceof Error ? error.message : 'Unknown error');
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
