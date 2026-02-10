/**
 * Seed script to create default challenge, group, and test users
 * Run with: tsx scripts/seed-data.ts
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { challenges, groups, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
  });
  const db = drizzle(pool);

  console.log("🌱 Seeding database...");

  // Create default challenge
  const challengeResult = await db.insert(challenges).values({
    name: "Fitness2Witness – 12 Week Challenge",
    startDate: new Date("2026-02-08"),
    endDate: new Date("2026-05-02"), // 12 weeks later
    active: true,
  }).returning();

  const challengeId = challengeResult[0].id;
  console.log(`✅ Created challenge (ID: ${challengeId})`);

  // Create pilot group
  const groupResult = await db.insert(groups).values({
    groupName: "Pilot Group",
    challengeId,
  }).returning();

  const groupId = groupResult[0].id;
  console.log(`✅ Created group (ID: ${groupId})`);

  // Create test users
  const testUsers = [
    { name: "John Leader", email: "john@example.com", role: "leader" as const },
    { name: "Sarah Smith", email: "sarah@example.com", role: "user" as const },
    { name: "Mike Johnson", email: "mike@example.com", role: "user" as const },
    { name: "Emily Davis", email: "emily@example.com", role: "user" as const },
    { name: "David Wilson", email: "david@example.com", role: "user" as const },
    { name: "Lisa Brown", email: "lisa@example.com", role: "user" as const },
    { name: "Tom Anderson", email: "tom@example.com", role: "user" as const },
    { name: "Jessica Taylor", email: "jessica@example.com", role: "user" as const },
    { name: "Chris Martin", email: "chris@example.com", role: "user" as const },
    { name: "Amanda White", email: "amanda@example.com", role: "user" as const },
  ];

  let leaderId: number | null = null;

  for (const user of testUsers) {
    const userResult = await db.insert(users).values({
      phoneNumber: user.email.replace('@', '').replace(/\D/g, '').slice(0, 10).padEnd(10, '0'),
      name: user.name,
      role: user.role,
      groupId,
    }).returning();

    const userId = userResult[0].id;
    console.log(`✅ Created user: ${user.name} (ID: ${userId}, Role: ${user.role})`);

    if (user.role === "leader" && !leaderId) {
      leaderId = userId;
    }
  }

  // Update group with leader
  if (leaderId) {
    await db.update(groups).set({ leaderUserId: leaderId }).where(eq(groups.id, groupId));
    console.log(`✅ Assigned leader (ID: ${leaderId}) to group`);
  }

  console.log("🎉 Seeding complete!");
  await pool.end();
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
