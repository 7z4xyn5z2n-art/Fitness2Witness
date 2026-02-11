# Fitness2Witness Launch Checklist

## A) Community Feed Public Access
- [x] Change community.getPosts to publicProcedure
- [x] Change community.getComments to publicProcedure
- [x] Ensure safe fields only (no phone/email)
- [x] Keep createPost/addComment/deletePost as protectedProcedure
- [x] Verify logged-out users can view /community without 401
- [x] Verify posting requires login

## B) Admin Tools Must Work Reliably
- [x] Admin calendar: click user, select date, add/fix missed day entry
- [x] Admin can remove user from group OR deactivate user
- [x] Admin can delete community post (moderation)
- [x] Fix any 400 errors by matching frontend payload to backend schema

## C) Submit Confirmation + Navigation
- [x] Daily log submit: disable button while pending, show "Submitting..."
- [x] Daily log success: navigate to /community
- [x] Create post success: navigate to /leaderboard
- [x] Verify clear confirmation on all submit actions

## D) Logout Must Be Bulletproof
- [x] Logout clears auth_token from storage
- [x] Logout clears query cache/state
- [x] Logout navigates to /auth
- [x] Verify no auto-relogin after logout
- [x] Verify protected API calls return 401 after logout
- [x] Verify UI shows no private views after logout

## E) Export / Share Stats
- [x] Generate share text (points, streak, categories)
- [x] Web Share API for mobile (fallback to clipboard)
- [x] Success toast on copy
- [x] Download CSV export for weekly stats

## Browser Verification Checklist
- [ ] /community works logged out
- [ ] Posting requires login
- [ ] Admin calendar fix works
- [ ] Admin delete post works
- [ ] Admin remove user works
- [ ] Logout works 100%
- [ ] Share/copy works
- [ ] CSV export works (if implemented)
