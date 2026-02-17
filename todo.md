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

## 16) Date Normalization & Feature Enhancements
- [x] Backend: Add date helper functions (startOfAppDayLocal, endOfAppDayLocal, startOfAppWeekLocal, endOfAppWeekLocal)
- [x] Backend: Update getCheckinByUserIdAndDate to use day-window range query
- [x] Backend: Update getCheckinsByDate to use day-window range query
- [x] Backend: Add deleteDailyCheckinById function
- [x] Backend: Add upsertDailyCheckinForDate function with delete-if-empty logic
- [x] Backend: Update checkins.submit to use upsert logic (allow updates)
- [x] Backend: Add checkins.getByDate query
- [x] Backend: Add admin.getCheckInForUserDate query
- [x] Backend: Add admin.upsertCheckInForUserDate mutation
- [x] Frontend: Update checkin.tsx to load existing data when date changes
- [x] Frontend: Add useEffect to populate UI states from existingForDate
- [x] Frontend: Change selected tile style to grey (bg-muted)
- [ ] Frontend: Fix admin-calendar.tsx invalid hooks (move useState to component level)
- [ ] Frontend: Add modal for admin calendar editing
- [ ] Frontend: Add admin.getCheckInForUserDate and admin.upsertCheckInForUserDate hooks
- [ ] Frontend: Add Edit button to user rows in admin calendar
- [ ] Frontend: Update create-post.tsx to use image object with base64
- [ ] Frontend: Add takePhoto function with camera permissions
- [ ] Frontend: Update submit payload to use image?.base64
- [ ] Frontend: Add "Take Photo" button next to "Choose Photo"
- [ ] Frontend: Add Share import to community.tsx
- [ ] Frontend: Add sharePost function
- [ ] Frontend: Add Share button to post cards
- [x] Backend: Update getUserMetrics to compute dayTotal with 12:01 window
- [ ] Backend: Add weekend bonus logic (+1 for Sat/Sun if any category done)
- [x] Backend: Update getGroupLeaderboard to accept period: "day" | "week" | "overall"
- [ ] Frontend: Update leaderboard.tsx Period type to include "day"
- [ ] Frontend: Add 3-tab segmented control (Day/Week/Overall)
- [ ] Frontend: Update logout in use-auth.ts to clear token and reset cache
