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
