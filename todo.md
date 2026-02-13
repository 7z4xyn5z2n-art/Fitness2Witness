# Fitness2Witness - Critical Fixes

## 1) Admin Fix (400 Bad Request)
- [x] admin-calendar.tsx: userId → String(), dateISO → toISOString() (lines 111, 139)
- [x] admin-users.tsx: userId → String() (lines 49, 65)
- [x] admin-moderation.tsx: postId → Number() (line 37)
- [x] Add console.log before each mutate showing payload types

## 2) Admin Calendar Web Date Picker
- [x] Already implemented: <input type="date"> for web (lines 174-195)
- [x] DateTimePicker for iOS/Android (lines 196-220)
- [x] selectedDate defaults to new Date() (line 11)

## 3) Logout Fix (Token Removal)
- [x] Removed window.location.reload() from logout (line 69 removed)
- [x] localStorage.removeItem("auth_token") always executes (line 47)
- [x] Added double-check for token removal (lines 50-56)
- [x] Clear query cache and navigate to /auth (lines 69, 74)

## 4) Idle Timeout (5 minutes web)
- [x] Created useIdleTimeout hook (hooks/use-idle-timeout.ts)
- [x] Reset timer on mousemove, keydown, click, scroll, touchstart (line 49)
- [x] After 5 minutes idle, clear token and navigate to /auth (lines 19-28)
- [x] Added hook to root layout (app/_layout.tsx line 33)

## 5) Share My Stats (Web)
- [x] shareText summary already exists (profile.tsx lines 211-216)
- [x] Try navigator.share if available (lines 220-226)
- [x] Fallback to clipboard + Alert("Copied") (lines 234-235)
- [x] Keep native Share API for mobile (lines 238-241)

## 6) Bonus Points System
- [x] Add category field to pointAdjustments table schema
- [x] Create database migration to add category column
- [x] Update admin.createPointAdjustment to accept category field
- [x] Create admin UI for awarding bonus points with category selection
- [x] Test bonus points appear in leaderboard calculations
- [x] Verify audit log shows category information

## 7) Admin Command Center
- [x] Create app/admin-console.tsx with centralized admin hub
- [x] User selection with search filter
- [x] Date selection (web: input type=date, native: existing approach)
- [x] Daily check-in panel with 4 toggles + notes
- [x] Weekly attendance panel with toggle + save button
- [x] Points/Bonus panel with manual adjustment + quick bonus buttons
- [x] Posts moderation panel with delete functionality
- [x] Audit feed panel with filters (user, category)
- [x] Add navigation link from admin-users.tsx

## 8) Admin Posts Moderation - All Groups Support
- [x] Add admin.getPosts procedure to server/routers.ts
- [x] Support optional groupId parameter to filter by group
- [x] Return posts from all groups when no groupId provided
- [x] Update admin-console.tsx to use admin.getPosts instead of community.getPosts
- [x] Add group filter UI to Posts Moderation panel
- [x] Update delete invalidation to use admin.getPosts query key

## 9) 3-Minute Inactivity Timeout
- [x] Create components/idle-timeout.tsx component
- [x] Implement activity detection (mousemove, keydown, click, scroll, touchstart)
- [x] Add route change detection as activity
- [x] Implement logout after 3 minutes (180,000ms) of inactivity
- [x] Disable timeout on auth screens (login/register)
- [x] Disable timeout when no auth token exists
- [x] Wire IdleTimeout into root layout (app/_layout.tsx)

## 10) Posts Moderation Enhancements
- [x] Add Post Detail Modal with full post content view
- [x] Add Delete button in Post Detail Modal
- [x] Implement Bulk Select mode with checkboxes
- [x] Add Select All and Clear buttons for bulk selection
- [x] Implement Bulk Delete with sequential deletion
- [x] Fix query invalidation to respect groupId filter
- [x] Show success/failure summary after bulk delete

## 11) Idle Timeout Upgrades
- [x] Create centralized idle timer state module (lib/idle.ts)
- [x] Add warning modal 30 seconds before logout
- [x] Add "Stay Logged In" button to reset timer
- [x] Add "Log Out Now" button for immediate logout
- [x] Add countdown display showing remaining seconds
- [x] Add configurable timeout duration (3/5/10 minutes)
- [x] Add admin security settings UI in Admin Command Center
- [x] Persist timeout duration setting in localStorage/SecureStore
- [x] Reset timer on API calls (tRPC requests)
- [x] Load saved timeout duration on app start

## 12) Remove Participant Functionality in Admin Console
- [x] Add tRPC mutation hooks for removeUser, removeUserFromGroup, deactivateUser
- [x] Add "Remove / Manage" button per user card
- [x] Create "Manage Participant" modal with three actions
- [x] Add confirmation step for each action before execution
- [x] Implement Remove from Group action with proper payload and logging
- [x] Implement Deactivate User action with proper payload and logging
- [x] Implement Delete Permanently action with proper payload and logging
- [x] Invalidate admin.getAllUsers after each successful action
- [x] Show success/error alerts with proper error logging
- [x] Keep Award Bonus Points modal unchanged

## 13) Admin UI Fixes
- [x] Add deactivateUser option to admin-users.tsx handleRemoveUser Alert
- [x] Change admin-calendar.tsx upsertCheckInMutation.mutate to mutateAsync
- [x] Change admin-calendar.tsx addAttendanceMutation.mutate to mutateAsync

## 14) Admin Day Editor (Web-First Replacement for Calendar & Logs)
- [x] Backend: Add admin.getDaySnapshot procedure (userId, dateISO → check-in, attendance, day breakdown, dayTotal)
- [x] Backend: Add admin.createPointAdjustmentForDate procedure (userId, dateISO, pointsDelta, reason, category)
- [x] Backend: Add community.updatePost or admin.updatePost procedure (postId, postText, postType, visibility, isPinned)
- [x] Backend: Add admin.getPostsForModeration procedure with filters (groupId, userId, dateISO)
- [x] Frontend: Create /app/admin-day-editor.tsx with date + user selection
- [x] Frontend: CARD 1 - Daily Check-In with 4 toggles + save button (mutateAsync, loading, success/error alerts)
- [x] Frontend: CARD 1 - Day Points Adjustment section (Award Bonus Points style, allows negative, requires reason)
- [x] Frontend: CARD 2 - Life Group Attendance toggle + save (mutateAsync, loading, success/error alerts)
- [x] Frontend: CARD 2 - Quick adjustment button for attendance corrections
- [x] Frontend: CARD 3 - Posts Moderation with list, edit modal, and FULL DELETE
- [x] Frontend: All delete actions require confirmation before mutateAsync
- [x] Frontend: All actions show loading state + success/error alerts
- [x] Frontend: All actions log payload and types to console
- [x] Frontend: All actions refetch day snapshot + admin.getAllUsers after success
- [x] Navigation: Replace "Calendar & Logs" with "Day Editor" link to /admin-day-editor
- [x] Verify: No breaking changes to admin-console.tsx, admin-users.tsx, Award Bonus Points

## 15) Admin Day Editor - 95% Confidence Fixes
### Phase 1: Database Hardening
- [x] Convert dailyCheckins.date to day DATE column
- [x] Convert pointAdjustments.date to day DATE column
- [x] Convert weeklyAttendance.weekStartDate to weekStart DATE column
- [x] Add UNIQUE constraint: dailyCheckins(userId, challengeId, day)
- [x] Add UNIQUE constraint: weeklyAttendance(userId, challengeId, weekStart)
- [x] Add pointAdjustments.idempotencyKey varchar(80) NOT NULL
- [x] Add UNIQUE constraint: pointAdjustments(idempotencyKey)
- [x] Create adminAuditLog table with all required columns
- [x] Add indexes on adminAuditLog (performedBy, affectedUserId, day, weekStart)
- [x] Create and run migrations to backfill DATE columns

### Phase 2: API Contract Standardization
- [x] Update admin.getDaySnapshot to accept day:"YYYY-MM-DD" (complete, 0 TS errors)
- [x] Update admin.upsertDailyCheckin with day parameter and upsert logic
- [x] Update admin.setWeeklyAttendance with weekStart parameter and upsert logic
- [x] Update admin.createPointAdjustmentForDay with day + idempotencyKey (complete with generation)
- [x] Add console.log for all mutation payloads (existing in frontend)
- [x] Add console.log for all mutation results (existing in frontend)
- [x] Add adminAuditLog entry for every mutation (checkin, attendance, adjustment, post)
- [x] Verify all admin procedures enforce server-side admin role check

### Phase 3: Frontend Date + State Reliability
- [x] Change selectedDate to selectedDay storing "YYYY-MM-DD" string (using input type="date")
- [x] Remove any toISOString() conversions for day keys (using direct string values)
- [x] Add disabled={mutation.isPending} to all mutation buttons (already implemented)
- [x] Generate idempotencyKey for point adjustments (userId:day:points:reason:bucket)
- [x] Replace useState initializer with useEffect for snapshot state sync (using tRPC queries)
- [x] Verify destructive actions have confirmation dialogs (Alert.alert used throughout)

### Phase 4: Tests
- [ ] Integration test: upsert daily check-in twice => only 1 record
- [ ] Integration test: set attendance twice => only 1 record
- [ ] Integration test: create adjustment with same idempotencyKey => only 1 record
- [ ] Integration test: admin selects "2026-02-13" => DB day = '2026-02-13'
- [ ] Integration test: non-admin calling admin mutation => rejected
- [ ] E2E test: pick day + user, toggle checkin, save, reload, confirm persists
