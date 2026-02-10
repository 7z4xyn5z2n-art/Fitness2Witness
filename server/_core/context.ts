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
    // Parse cookies from request
    const cookieHeader = opts.req.headers.cookie;
    if (!cookieHeader) {
      return { req: opts.req, res: opts.res, user: null };
    }

    const cookies = parseCookieHeader(cookieHeader);
    const sessionToken = cookies[COOKIE_NAME];

    if (!sessionToken) {
      return { req: opts.req, res: opts.res, user: null };
    }

    // Verify JWT token
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET);
    const userId = payload.userId as number;

    if (!userId) {
      return { req: opts.req, res: opts.res, user: null };
    }

    // Get user from database
    user = await db.getUserById(userId) ?? null;
  } catch (error) {
    // Authentication is optional for public procedures
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
