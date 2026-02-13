

VERIFY ONLY — STRICT READ-ONLY AUDIT MODE.Do NOT deploy, do NOT push, do NOT modify any files.Do NOT create diffs/patches. Do NOT refactor.Only locate and quote existing code verbatim and report FACTS.

GOAL:I need 95%+ confidence that ALL ADMIN OPERATIONS work and follow the SAME interaction pattern as the Award Bonus Points system:

- modal-based UI (or equivalent structured confirmation)

- confirm step for destructive actions

- mutateAsync call with correct payload types

- success + error handling shown to admin

- proper invalidation/refetch (so UI updates immediately)This must be true BOTH:A) inside the Admin Command Center (admin-console.tsx)B) outside the Command Center (admin-users.tsx, admin-calendar.tsx, admin-moderation.tsx)

# ====================================================CHECK 1 — FILES EXIST

Confirm these files exist and report their full paths:

- /home/ubuntu/fitness2witness/app/admin-console.tsx

- /home/ubuntu/fitness2witness/app/admin-users.tsx

- /home/ubuntu/fitness2witness/app/admin-calendar.tsx

- /home/ubuntu/fitness2witness/app/admin-moderation.tsx

- /home/ubuntu/fitness2witness/server/routers.ts

- /home/ubuntu/fitness2witness/server/db.ts

Result: PASS/FAIL

# ====================================================CHECK 2 — AWARD BONUS POINTS BASELINE (REFERENCE PATTERN)

In admin-console.tsx (and/or admin-users.tsx if the canonical modal lives there),quote the FULL Award Bonus Points modal code block and its handler:

- modal UI

- payload construction

- mutateAsync call

- success Alert handling

- error Alert handling

- invalidation/refetch callsThis is the “baseline pattern.”

Result: PASS/FAIL

# ====================================================CHECK 3 — COMMAND CENTER: ALL REQUIRED CAPABILITIES EXIST

In admin-console.tsx, verify each capability exists AND is wired to the correct mutation/query.

For each of the below, output:

1. PASS/FAIL

1. exact tRPC hook line(s)

1. exact handler code (payload + mutateAsync)

1. exact success/error handling

1. exact invalidation/refetch

A) Add/Subtract points (manual adjustments)

- must call: trpc.admin.createPointAdjustment

- must allow negative pointsDelta

- must require reason (string)

- category optional or defaulted

B) Edit check-in (and can deduct/add in same place)

- must call: trpc.admin.upsertCheckInForUserDate

- must also provide a manual +/- points adjustment section in the same modal OR a direct link to it

- verify payload types: userId STRING for upsert

C) Attendance edit

- must call: trpc.admin.addUserAttendance

- must also provide manual +/- points adjustment section in same modal OR direct link

D) Remove participant / manage user

- must include actions:
  - removeUserFromGroup
  - deactivateUser
  - removeUser (delete permanently)

- must follow Award Bonus Points pattern:
  - modal UI
  - confirm step for destructive actions
  - payload logs (payload + typeof)
  - mutateAsync
  - invalidation/refetch

E) Posts moderation

- must be able to delete post

- must call: trpc.community.deletePost (postId must be NUMBER)

- must have confirm step

- must invalidate/refetch posts list after delete

- if posts are group-scoped, UI must indicate the scope or support filtering

F) Audit log

- must call: trpc.admin.getAuditLog

- verify audit fields displayed match server response shape

Result: PASS/FAIL per capability + a final overall PASS/FAIL for command center.

# ====================================================CHECK 4 — OUTSIDE COMMAND CENTER: SAME LEVEL OF CONTROL

Verify admin functionality exists and operates at the same level OUTSIDE the command center:

A) admin-users.tsx

- Must include:
  - removeUserFromGroup / deactivateUser / removeUser
  - adjust points (+/-) OR a navigation link to command center adjustment modal
  - errors surfaced clearly (Alert) and console logs for payload types

- Quote handlers + hooks.

B) admin-calendar.tsx

- Must include:
  - upsertCheckInForUserDate
  - addUserAttendance
  - ensure web date picker compatibility if relevant

- Quote handlers + hooks and payload shape.

C) admin-moderation.tsx

- Must include:
  - delete post
  - confirm step
  - invalidate/refetch posts

- Quote handlers + hooks.

Result: PASS/FAIL per screen.

# ====================================================CHECK 5 — BACKEND PROCEDURES EXIST + INPUT SHAPES MATCH

In server/routers.ts, quote FULL code blocks for:

- admin.createPointAdjustment

- admin.getAuditLog

- admin.upsertCheckInForUserDate

- admin.addUserAttendance

- admin.removeUser

- admin.deactivateUser

- admin.removeUserFromGroup

- community.deletePost

For each, confirm:

- input schema (zod) matches the frontend payload types

- conversions are correct (parseInt where needed)

- admin role checks exist and are consistent

Result: PASS/FAIL

# ====================================================CHECK 6 — DB FUNCTIONS SUPPORT BEHAVIOR (NO SILENT FAILS)

In server/db.ts, quote FULL code for the DB functions used by the above procedures:

- createPointAdjustment

- getAllPointAdjustments

- getCheckinByUserIdAndDate

- updateDailyCheckin

- createCheckIn

- createWeeklyAttendance

- deleteUser

- updateUser

- deletePost

FACTS ONLY:

- Does deleteUser hard delete?

- Are dependent records left behind (checkins, attendance, posts, adjustments)?

- Could leftover records cause UI to still show user in getAllUsers?

Result: PASS/FAIL + risks flagged.

# ====================================================CHECK 7 — INVALIDATION/REFETCH RELIABILITY

For EVERY mutation in admin-console.tsx and admin-users.tsx:

- Verify it triggers correct invalidate/refetch so UI updates immediately.Quote the exact lines.

Result: PASS/FAIL

# ====================================================OUTPUT FORMAT (STRICT)

1. “PASS/FAIL” for each check section (1–7)

1. For each FAIL: explain why with exact evidence (file path + line numbers)

1. Quote verbatim code blocks with file path + line number ranges

1. Summarize risks (e.g., posts limited to first group, delete user leaves orphan rows, deactivate same as removeFromGroup)

1. End with:"READ-ONLY ADMIN VERIFICATION COMPLETE — NO FILES MODIFIED"



