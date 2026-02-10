import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const adminPhone = "+18134641475";

async function setAdmin() {
  const client = postgres(DATABASE_URL as string, { ssl: 'require' });
  const db = drizzle(client);

  try {
    console.log(`Setting ${adminPhone} as admin...`);
    
    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.phoneNumber, adminPhone))
      .limit(1);

    if (existingUser.length > 0) {
      // Update existing user to admin
      await db
        .update(users)
        .set({ role: "admin" })
        .where(eq(users.phoneNumber, adminPhone));
      
      console.log("✅ User updated to admin role");
    } else {
      // Create new admin user
      await db.insert(users).values({
        phoneNumber: adminPhone,
        name: "Admin",
        role: "admin",
        groupId: null,
      });
      
      console.log("✅ Admin user created");
    }

    console.log(`\n🎉 ${adminPhone} is now an admin!`);
    console.log("\nYou can now:");
    console.log("- Add other admins and leaders");
    console.log("- Update scoring rules");
    console.log("- Manage all users");
    
  } catch (error) {
    console.error("Error setting admin:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setAdmin();
