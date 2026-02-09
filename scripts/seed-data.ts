/**
 * Seed script to create default challenge, group, and test users
 * Run with: tsx scripts/seed-data.ts
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { challenges, groups, users } from "../drizzle/schema";

async function seed() {
  const db = drizzle(process.env.DATABASE_URL!);

  console.log("🌱 Seeding database...");

  // Create default challenge
  const challengeResult = await db.insert(challenges).values({
    name: "Fitness2Witness – 12 Week Challenge",
    startDate: new Date("2026-02-08"),
    endDate: new Date("2026-05-02"), // 12 weeks later
    active: true,
  });

  const challengeId = Number(challengeResult[0].insertId);
  console.log(`✅ Created challenge (ID: ${challengeId})`);

  // Create pilot group
  const groupResult = await db.insert(groups).values({
    groupName: "Pilot Group",
    challengeId,
  });

  const groupId = Number(groupResult[0].insertId);
  console.log(`✅ Created group (ID: ${groupId})`);

  // Update group with leader (we'll assign the first user as leader)
  // This will be updated after creating users

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
      openId: `test-${user.email}`,
      name: user.name,
      email: user.email,
      loginMethod: "test",
      role: user.role,
      groupId,
    });

    const userId = Number(userResult[0].insertId);
    console.log(`✅ Created user: ${user.name} (ID: ${userId}, Role: ${user.role})`);

    if (user.role === "leader" && !leaderId) {
      leaderId = userId;
    }
  }

  // Update group with leader
  if (leaderId) {
    await db.update(groups).set({ leaderUserId: leaderId }).where({ id: groupId } as any);
    console.log(`✅ Assigned leader (ID: ${leaderId}) to group`);
  }

  console.log("🎉 Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
