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

## 14) Create Post Camera Support and Base64 Fix (Section 7)
- [x] Replace imageUri state with image object containing uri and base64
- [x] Update pickImage to store base64 explicitly
- [x] Add takePhoto function for camera capture with base64
- [x] Fix submit payload to use image?.base64 instead of uri.split
- [x] Update all preview usage to use image?.uri
- [x] Add Take Photo button next to Select Photo button
- [x] Verify 0 TypeScript errors

## 15) Admin Calendar Modal for Day Editing (Section 6)
- [x] Remove invalid useState calls inside handleEditCheckIn function
- [x] Add modal state variables (showEditModal, editUserName, editNutrition, etc.)
- [x] Add openEdit function to populate modal state from existing check-in
- [x] Replace check-in display with TouchableOpacity calling openEdit
- [x] Add modal overlay with 4 toggles, notes input, Cancel/Save buttons
- [x] Close modal after Save and refetch data
- [x] Verify 0 TypeScript errors

## 16) Idle Timeout Fixes - 8 Minutes + Web/Native Battery Optimization (Section T1-T2)
- [x] T1: Change default timeout from 3 minutes to 8 minutes (480000ms) in lib/idle.ts
- [x] T2A: Add AppState import to idle-timeout.tsx
- [x] T2B: Add appStateRef to track foreground/background state
- [x] T2C: Remove inactivity logout console log
- [x] T2D: Force timeout to 8 minutes and persist to storage
- [x] T2E: Replace web-only block to allow interval to run on both web and native
- [x] T2F: Add background/visibility handling (AppState for native, visibilitychange for web)
- [x] T2F: Change interval from 500ms to 1000ms to reduce battery usage
- [x] T2G: Reset logoutTriggeredRef on route change to prevent stuck state
- [x] T2H: Update cleanup to remove all listeners (web events, visibility, AppState)
- [x] Verify 0 TypeScript errors

## 17) Check-In Web Date Picker Fix
- [x] Add Modal to react-native imports
- [x] Add webDateText state for web date input
- [x] Initialize webDateText when opening date picker on web
- [x] Replace DateTimePicker with platform-specific rendering (native DateTimePicker, web Modal with text input)
- [x] Add date validation (YYYY-MM-DD format, valid date, not future)
- [x] Verify 0 TypeScript errors

## 18) Admin Calendar Undefined Fixes
- [x] Fix undefined user.name with optional chaining (checkIn.user?.name ?? "Unknown User")
- [x] Add filter(Boolean) to users map in Add Check-In section
- [x] Add filter(Boolean) to users map in Attendance section
- [x] Verify 0 TypeScript errors

## 19) Section 11: Admin Calendar Modal with Life Group Toggle
- [x] A1: Add deleteAttendanceByUserIdAndWeek function to server/db.ts
- [x] B1: Fix getAttendanceByDate to use Monday week start calculation
- [x] B2: Fix addUserAttendance to use Monday week start + add upsert logic (delete+create)
- [x] B3: Add removeUserAttendance mutation to server/routers.ts
- [x] C1: Add Modal to react-native imports in admin-calendar.tsx
- [x] C3: Add modal state variables (showAddModal, modalUserId, modalUserName, 5 toggles, mNotes)
- [x] C4: Add removeAttendanceMutation hook
- [x] C5: Add openUserCheckinModal function to prefill existing check-in + attendance
- [x] C6: Change Add Check-In list to call openUserCheckinModal instead of handleQuickAddCheckIn
- [x] C7: Add modal UI with 5 toggle tiles (Nutrition, Hydration, Movement, Scripture, Life Group) + Submit logic
- [x] Verify 0 TypeScript errors

## 20) Section P1-P3: Leaderboard Auto-Refresh
- [x] P1: Add leaderboard invalidation after check-in submit in checkin.tsx (week + overall)
- [x] P2: Add utils.metrics.getGroupLeaderboard.invalidate in admin-calendar.tsx after upsertCheckInMutation success
- [x] P3A: Add useCallback and useFocusEffect imports to leaderboard.tsx
- [x] P3B: Add useFocusEffect hook to refetch leaderboard when tab is focused
- [x] Verify 0 TypeScript errors
