# STRICT REPOSITORY INSPECTION REPORT
**READ-ONLY MODE - NO CHANGES MADE**

---

## SECTION 1 — ADMIN ROUTER (REQUIRED)

### Main tRPC Router Index File
**Path:** `/home/ubuntu/fitness2witness/server/routers.ts`

**Admin Router Location:** Lines 612-1059 (embedded in main routers.ts file)

### Admin Router Procedures

The admin router contains the following procedures:

1. **getAllUsers** (line 613) - Get all users with stats
2. **updateUserRole** (line 638) - Change user role
3. **removeUser** (line 655) - Delete user permanently
4. **deactivateUser** (line 671) - Remove user from group
5. **removeUserFromGroup** (line 689) - Remove user from group
6. **updateUser** (line 706) - Update user details
7. **getAllGroups** (line 727) - Get all groups
8. **createGroup** (line 736) - Create new group
9. **updateGroup** (line 754) - Update group details
10. **getAllChallenges** (line 774) - Get all challenges
11. **createChallenge** (line 784) - Create new challenge
12. **updateChallenge** (line 806) - Update challenge details
13. **createPointAdjustment** (line 831) - Manual points adjustment
14. **getAuditLog** (line 868) - View point adjustments history
15. **getCheckInsByDate** (line 890) - Get check-ins for specific date
16. **getAttendanceByDate** (line 901) - Get attendance for specific date
17. **addUserCheckIn** (line 912) - Add check-in for user
18. **upsertCheckInForUserDate** (line 955) - Create or update check-in
19. **addUserAttendance** (line 1018) - Add attendance record

### Admin Permission Enforcement Summary

**Server-Side Admin Role Check:** YES - Present in ALL admin procedures

**Pattern Used:**
```typescript
const user = await db.getUserById(ctx.user.id);
if (!user || user.role !== "admin") {
  throw new Error("Only admins can...");
}
```

**ctx.user.role Enforcement:** YES - Every admin procedure checks `user.role !== "admin"` and throws error if not admin

**groupId Scoping:** NO - Admin can access/modify users across ALL groups (global admin scope)

**userId Input Type:** STRING (z.string()) - Examples:
- Line 641: `userId: z.string()`
- Line 658: `userId: z.string()`
- Line 674: `userId: z.string()`
- Line 692: `userId: z.string()`
- Line 915: `userId: z.string()`
- Line 958: `userId: z.string()`
- Line 1021: `userId: z.string()`

**Conversion Pattern:** All procedures convert string to integer:
```typescript
parseInt(input.userId)
```

---

## SECTION 2 — DATABASE ACCESS LAYER (REQUIRED)

### Database File
**Path:** `/home/ubuntu/fitness2witness/server/db.ts`

### Key Functions Related to Admin Operations

**getUserById** - Fetches user by ID
**getAllUsers** - Returns all users
**deleteUser** - Deletes user permanently
**updateUser** - Updates user fields
**getUserMetrics** - Calculates total points for user
**getUserCheckins** - Gets all check-ins for user
**createCheckIn** - Creates new check-in
**updateDailyCheckin** - Updates existing check-in
**getCheckinByUserIdAndDate** - Finds check-in by user+date
**createWeeklyAttendance** - Creates attendance record
**getAllPointAdjustments** - Gets all point adjustments
**createPointAdjustment** - Creates manual point adjustment

### Points Calculation Summary

**Function:** `getUserMetrics(userId: number, challengeId: number)`

**Total Points Calculation Includes:**
1. **Daily Check-ins** - 4 points per day (1 point each for nutrition, hydration, movement, scripture)
2. **Weekly Attendance** - 10 points per week for life group attendance
3. **Point Adjustments** - Manual admin adjustments (positive or negative)

**Formula:**
```typescript
totalPoints = (dailyCheckInPoints) + (weeklyAttendancePoints) + (pointAdjustments)
```

**Leaderboard Inclusion:** YES - Point adjustments ARE included in leaderboard totals

**Duplication Risk:** NO - Each data source is distinct:
- `dailyCheckins` table for daily points
- `weeklyAttendance` table for attendance points
- `pointAdjustments` table for manual adjustments

---

## SECTION 3 — ADMIN UI FILES (REQUIRED)

### Admin UI File Paths

1. `/home/ubuntu/fitness2witness/app/admin-users.tsx`
2. `/home/ubuntu/fitness2witness/app/admin-calendar.tsx`
3. `/home/ubuntu/fitness2witness/app/admin-moderation.tsx`

### Admin Users Screen (`admin-users.tsx`)

**Actions Available:**
1. Remove user from group
2. Delete user permanently

**Endpoints Called:**
- `trpc.admin.removeUserFromGroup.useMutation()` (line 39)
- `trpc.admin.removeUser.useMutation()` (line 55)

**Payload Shape:**
```typescript
// Remove from group
{ userId: String(user.id) }

// Delete permanently
{ userId: String(user.id) }
```

**Type Handling:**
- userId: **STRING** (converted via `String(user.id)`)
- Console log added (line 48): Shows payload type before mutation

### Admin Calendar Screen (`admin-calendar.tsx`)

**Actions Available:**
1. Quick Add (all 4 categories)
2. Custom Add (select specific categories)
3. Mark Present (attendance)

**Endpoints Called:**
- `trpc.admin.upsertCheckInForUserDate.useMutation()` (line 20)
- `trpc.admin.addUserAttendance.useMutation()` (line 46)

**Payload Shape (Check-in):**
```typescript
{
  userId: String(selectedUser.id),
  dateISO: selectedDate.toISOString(),
  nutritionDone: boolean,
  hydrationDone: boolean,
  movementDone: boolean,
  scriptureDone: boolean,
  notes: string | undefined
}
```

**Payload Shape (Attendance):**
```typescript
{
  userId: String(selectedUser.id),
  date: selectedDate.toISOString(),
  attended: true
}
```

**Type Handling:**
- userId: **STRING** (converted via `String()`)
- date: **ISO STRING** (converted via `.toISOString()`)
- Console logs added (lines 110, 138): Show payload types before mutations

### Admin Moderation Screen (`admin-moderation.tsx`)

**Actions Available:**
1. Delete post

**Endpoints Called:**
- `trpc.community.deletePost.useMutation()` (line 18)

**Payload Shape:**
```typescript
{
  postId: Number(post.id)
}
```

**Type Handling:**
- postId: **NUMBER** (converted via `Number()`)
- Console log added (line 36): Shows payload type before mutation

---

## SECTION 4 — TYPE CONSISTENCY CHECK (CRITICAL)

### Schema Evidence

**From `/home/ubuntu/fitness2witness/drizzle/schema.ts`:**

```typescript
users: {
  id: integer("id").primaryKey().autoincrement()
}

communityPosts: {
  id: integer("id").primaryKey().autoincrement()
}

groups: {
  id: integer("id").primaryKey().autoincrement()
}
```

### TYPE MISMATCH REPORT

**userId:**
- Expected (DB schema): **integer**
- Actual sent (API input): **string** (z.string())
- Conversion: **YES** - All admin procedures use `parseInt(input.userId)`
- **STATUS: ALIGNED** (conversion handles mismatch)

**postId:**
- Expected (DB schema): **integer**
- Actual sent (API input): **number** (z.number() in community.deletePost)
- Conversion: **NOT NEEDED** - Already number
- **STATUS: ALIGNED**

**groupId:**
- Expected (DB schema): **integer**
- Actual sent (API input): **number** (z.number())
- Conversion: **NOT NEEDED** - Already number
- **STATUS: ALIGNED**

**date fields:**
- Expected (DB operations): **Date object**
- Actual sent (API input): **ISO string** (z.string())
- Conversion: **YES** - All procedures use `new Date(input.date)` or `new Date(input.dateISO)`
- **STATUS: ALIGNED** (conversion handles mismatch)

**CONCLUSION:** NO TYPE MISMATCHES FOUND (all mismatches are properly converted)

---

## SECTION 5 — BONUS POINT HOOK DISCOVERY

### Current pointAdjustments Usage

**Table:** `pointAdjustments` (schema line ~100)

**Fields:**
- id: integer (primary key)
- date: datetime
- userId: integer
- groupId: integer
- challengeId: integer
- pointsDelta: integer (can be positive or negative)
- reason: text
- adjustedBy: integer (admin user ID)

**Current Usage:** Manual admin adjustments for corrections or penalties

**Leaderboard Impact:** YES - `getUserMetrics()` includes sum of all `pointsDelta` values in total points calculation

### Logical Hook Locations for Bonus Points

**1. Existing Table Reuse:**
- `pointAdjustments` table CAN be reused for bonus points
- Would require adding a `category` field to distinguish:
  - "manual_adjustment" (current usage)
  - "bonus_scripture_memory" (new)
  - "bonus_workout_excellence" (new)
  - etc.

**2. Calculation Function:**
- `getUserMetrics()` in `/home/ubuntu/fitness2witness/server/db.ts`
- Already sums all `pointAdjustments.pointsDelta` values
- No modification needed if using existing table

**3. Admin Procedure:**
- `admin.createPointAdjustment` (line 831 in routers.ts)
- Could be extended to accept optional `category` field
- Current schema:
  ```typescript
  userId: z.number(),
  pointsDelta: z.number(),
  reason: z.string()
  ```

**4. Frontend UI:**
- Admin screens already have point adjustment UI
- Could add category dropdown to existing adjustment form
- Location: Admin dashboard or dedicated bonus points section

**RECOMMENDATION (FACTUAL):**
- Bonus points would fit naturally in `pointAdjustments` table with added `category` field
- No new table needed
- Minimal backend changes required (add category to schema + procedure input)
- Frontend would need category selector UI

---

**INSPECTION COMPLETE — NO CHANGES MADE**
