# Fitness2Witness TODO

## Database Schema
- [x] Create Users table with role field
- [x] Create Groups table with leader assignment
- [x] Create Challenges table with date ranges
- [x] Create DailyCheckins table with boolean fields and photo upload
- [x] Create WeeklyAttendance table
- [x] Create PointAdjustments table with audit trail
- [x] Create CommunityPosts table with media support
- [x] Create PostComments table
- [x] Create GroupChat table with real-time support

## Authentication & Authorization
- [x] Implement OAuth login system
- [x] Create role-based access control (user, leader, admin)
- [x] Set up user session management
- [ ] Create onboarding flow for new users

## Daily Check-In System
- [x] Build daily check-in screen with four toggle categories
- [x] Implement photo upload (camera + gallery)
- [x] Add notes field for check-ins
- [x] Create check-in submission logic
- [x] Prevent duplicate check-ins for same date
- [x] Display proof photo thumbnails

## Scoring & Metrics
- [ ] Implement daily points calculation (max 4/day)
- [ ] Implement weekly attendance bonus (10 points)
- [ ] Calculate week start date and week number
- [ ] Compute this week daily points
- [ ] Compute this week attendance points
- [ ] Compute this week adjustments
- [ ] Compute this week total
- [ ] Compute total daily points
- [ ] Compute total attendance points
- [ ] Compute total adjustments
- [ ] Compute overall total points
- [ ] Calculate weekly percentage (X / 38)
- [ ] Calculate overall percentage (X / 456)

## User Dashboard
- [x] Create dashboard layout with points summary
- [x] Add "Log Today's Check-In" button
- [ ] Implement weekly totals line chart (Week 1-12)
- [ ] Implement daily points bar chart (Mon-Sun)
- [ ] Display recent proof photos grid
- [ ] Show current week number
- [ ] Add pull-to-refresh

## Leaderboards
- [x] Create group leaderboard screen
- [x] Implement "This Week" leaderboard view
- [x] Implement "Overall" leaderboard view
- [x] Add segmented control to switch views
- [x] Display ranked user list with progress bars
- [ ] Highlight current user's position
- [ ] Add pull-to-refresh

## Community Feed
- [x] Create community feed screen
- [ ] Implement create post functionality
- [ ] Add post type selection (Encouragement, Testimony, Photo, Video, Announcement)
- [ ] Support image upload in posts
- [ ] Support video URL in posts
- [x] Display posts in reverse chronological order
- [x] Implement pinned posts (leader/admin only)
- [ ] Add visibility toggle (Group Only / Leaders Only)
- [ ] Implement post comments
- [ ] Add like functionality (optional)
- [ ] Create moderation tools for admin

## Group Chat
- [ ] Create group chat screen
- [ ] Implement real-time messaging
- [ ] Add message input field
- [ ] Support image attachments in messages
- [ ] Display user avatars and names
- [ ] Filter messages by GroupID
- [ ] Add timestamp display

## Leader Dashboard
- [ ] Create leader dashboard layout
- [ ] Show participation today card
- [ ] Display top 3 members this week
- [ ] Create "Needs Follow-Up" list (< 50% completion)
- [ ] Implement group weekly average chart
- [ ] Show Wednesday attendance overview
- [ ] Add community moderation view

## Admin Console
- [ ] Create admin console layout
- [ ] Build user manager (list, search, edit, add)
- [ ] Build group manager (list, edit, add)
- [ ] Build challenge manager (list, edit, add)
- [ ] Create point adjustments tool
- [ ] Implement audit log view
- [ ] Add community moderation (edit/remove posts)

## Profile & Settings
- [x] Create profile screen
- [ ] Add user avatar editing
- [x] Display user info (name, email, group, role)
- [ ] Add notifications toggle
- [ ] Add dark mode toggle
- [ ] Add privacy policy link
- [ ] Add terms of service link
- [x] Implement logout functionality

## Default Data Setup
- [x] Create default challenge "Fitness2Witness – 12 Week Challenge"
- [x] Create pilot group with 10-16 test users
- [x] Assign one leader to pilot group
- [x] Preload daily categories

## UI/UX Polish
- [x] Generate custom app logo (fitness + faith theme)
- [x] Update app.config.ts with branding
- [x] Implement haptic feedback on buttons
- [x] Add loading states for all async operations
- [x] Add error handling and user-friendly error messages
- [ ] Ensure all touch targets are minimum 44x44 points
- [ ] Test dark mode across all screens
- [x] Add empty states for lists
- [ ] Implement pull-to-refresh where appropriate

## Testing & Validation
- [ ] Test role-based access control
- [ ] Test daily check-in flow end-to-end
- [ ] Test leaderboard calculations
- [ ] Test community feed posting and commenting
- [ ] Test group chat messaging
- [ ] Test leader dashboard features
- [ ] Test admin console features
- [ ] Test point adjustments and audit log
- [ ] Verify all computed metrics are accurate
- [ ] Test photo upload from camera and gallery

## New Feature Requests (User Priority)
- [x] Make Quay Merida (meridabiz@gmail.com) admin
- [x] Build Wednesday Life Group attendance tracking (admin + leader access)
- [ ] Create progression charts (day-over-day and week-over-week)
- [x] Build interactive community feed with post creation
- [x] Add emoji and GIF support to community posts
- [ ] Add commenting functionality to posts
- [ ] Create separate Body Metrics section
- [ ] Implement InBody scan photo upload
- [ ] Build AI analysis to extract InBody metrics
- [ ] Track body composition metrics (weight, body fat %, muscle mass)
- [ ] Create week-over-week body composition charts
- [ ] Create month-over-month body composition charts

## New Features (Current Priority)
- [x] Create body metrics database table
- [x] Add body metrics API routes (create, get history)
- [x] Build body metrics tracking screen
- [x] Add weekly body metrics entry form (weight, body fat %, muscle mass)
- [ ] Create body composition progress charts
- [x] Add progression charts to dashboard (daily check-in trends)
- [ ] Add weekly totals chart to dashboard
- [x] Implement post commenting API
- [x] Add comment UI to community posts
- [x] Add comment input and display

## Latest Feature Requests
- [x] Add InBody scan photo upload to body metrics screen
- [x] Implement AI analysis to extract metrics from InBody scan photos
- [x] Auto-populate body metrics form with AI-extracted data
- [ ] Create line charts for body composition trends (12-week view)
- [ ] Add weekly check-in pattern charts to dashboard
- [x] Implement pull-to-refresh on dashboard
- [x] Implement pull-to-refresh on leaderboard
- [x] Implement pull-to-refresh on community feed

## Advanced Workout Logging
- [x] Add workout log text field to daily check-in
- [x] Create AI analysis endpoint to extract workout metrics
- [x] Display analyzed workout data (exercise types, duration, intensity, calories)
- [x] Show workout summary in check-in history
- [ ] Track training volume metrics over time

## Visual Progress Charts (Profile Section)
- [x] Install chart library for React Native
- [x] Create API endpoint for weekly points history
- [x] Create API endpoint for category consistency data
- [x] Build weekly points trend line chart
- [x] Build category consistency breakdown chart
- [x] Add body metrics progression chart
- [x] Integrate charts into profile screen

## Achievement Badges & Gamification
- [x] Create badges database table
- [x] Define badge types (7-Day Streak, Perfect Week, 10 lbs Lost, etc.)
- [x] Implement badge earning logic
- [x] Create badges display UI in profile
- [ ] Add badge notification when earned
- [ ] Show badge progress indicators

## Weekly Recap Notifications
- [x] Set up notification scheduling system
- [x] Create weekly recap data aggregation
- [x] Design recap notification content
- [ ] Schedule Sunday evening delivery
- [x] Include week performance, rank, and encouragement

## Progress Report Export
- [ ] Create PDF generation endpoint
- [ ] Include all charts in PDF
- [x] Add stats summary to PDF
- [ ] Include check-in history
- [x] Add export button to profile
- [ ] Generate downloadable PDF file

## Leader Analytics Dashboard
- [x] Create analytics API endpoints for participation metrics
- [x] Build analytics dashboard screen (leaders/admins only)
- [x] Add participation overview card
- [x] Show average points metrics
- [x] Display top performers list
- [x] Create members needing follow-up section
- [x] Add attendance tracking summary
- [x] Show engagement metrics
- [x] Add Analytics tab to navigation (leaders/admins only)

## Group Challenges
- [x] Create challenges database table
- [x] Create challenge participants table
- [x] Create challenge progress table
- [x] Build challenge creation API (leaders/admins)
- [x] Build challenge participation API (all users)
- [x] Create Challenges tab screen
- [x] Add create challenge form (leaders/admins)
- [x] Build challenge list view
- [x] Add join challenge functionality
- [x] Create progress logging UI
- [x] Build challenge leaderboard
- [x] Add challenge detail screen
- [x] Add Challenges tab to navigation (all users)

## Badge Notifications
- [x] Create badge notification modal component
- [x] Add celebratory animation when badge is earned
- [x] Trigger notification after check-in when new badge earned
- [x] Show badge icon, name, and description in notification
- [x] Add confetti or celebration effect
- [x] Implement dismiss functionality

## Challenge Comments
- [x] Create challenge_comments database table
- [x] Add challenge comments API endpoints (create, get, delete)
- [x] Build comment input UI on challenge detail screen
- [x] Display comments list with user names and timestamps
- [x] Add delete comment functionality (author or admin only)
- [x] Implement real-time comment refresh

## Bug Fixes
- [ ] Fix check-in submission not updating/calculating points
- [ ] Verify point calculation logic is working correctly
- [ ] Ensure dashboard metrics refresh after check-in

## OAuth Authentication Fix
- [ ] Configure OAuth to work with Expo Go redirect scheme
- [ ] Test sign-in flow in Expo Go app
- [ ] Verify users can successfully authenticate

## Admin Calendar & Backlog Features
- [x] Verify user has admin access
- [x] Add user ability to log past/missed days (backlog check-ins)
- [x] Create admin calendar view to see all user check-ins
- [x] Add admin ability to edit/add user daily check-ins
- [x] Add admin ability to edit/add weekly life group attendance
- [x] Implement date picker for selecting past dates
- [x] Add validation to prevent future date logging

## Admin Panel
- [x] Create admin panel main screen with navigation
- [x] Add Admin tab to bottom navigation (admin-only)
- [x] Build user management section
- [x] Add view all users in group functionality
- [x] Add role assignment interface (User/Leader/Admin)
- [x] Add remove user from group functionality
- [x] Show user activity stats in user list
- [x] Build group management section
- [x] Add edit group settings interface
- [x] Add group statistics dashboard
- [x] Build content moderation section
- [x] Add view/delete community posts functionality
- [x] Add view/delete challenge comments functionality
- [x] Create admin API endpoints for user management
- [x] Create admin API endpoints for content moderation

## Phone-Based Authentication Redesign (CURRENT PRIORITY)

### Backend Changes
- [x] Update database schema to use phone number as primary identifier
- [x] Remove email and password hash fields from users table
- [x] Create phone-based registration endpoint
- [x] Create phone-based login endpoint  
- [x] Remove OAuth dependencies from authentication middleware
- [x] Update session management to use phone number
- [x] Simplify context creation to skip OAuth checks

### Frontend Changes
- [x] Update registration screen to collect name + phone number only
- [x] Update login screen to only ask for phone number
- [x] Remove all password input fields
- [x] Update form validation for phone numbers (US format)
- [ ] Test registration flow end-to-end
- [ ] Test login flow end-to-end

### Deployment & Testing
- [ ] Deploy backend changes to Railway
- [ ] Deploy frontend changes to Netlify
- [ ] Test registration with real phone number
- [ ] Test login with existing phone number
- [ ] Verify user tracking works across all features
- [ ] Create first admin user account via phone registration

## Railway Crash Fix (URGENT)
- [x] Make phoneNumber column nullable in database
- [ ] Verify Railway deployment is running
- [ ] Test that registration endpoint works

## Fix Railway Migration Crash (CRITICAL)
- [x] Delete old migration files that reference NOT NULL phoneNumber
- [x] Generate fresh migration from current schema
- [x] Clear existing test users from database
- [x] Add phoneNumber column directly to database
- [x] Remove db:push from Railway start command
- [x] Delete all SQL migration files and meta snapshots from drizzle directory (AGAIN)
- [x] Connect to Railway database and add phoneNumber column manually
- [x] Create __drizzle_migrations table and mark migration as complete
- [ ] Push changes to GitHub and redeploy Railway
- [ ] Verify Railway deployment succeeds
- [ ] Test registration with phone number

## Remove Authentication Gate (IMMEDIATE)
- [x] Remove authentication check from app/_layout.tsx
- [x] Skip login screen and load app directly
- [ ] Deploy to Netlify without authentication blocking
- [x] Test that app loads and all screens are accessible

## Fix Netlify Deployment (CRITICAL)
- [x] Create netlify.toml configuration file
- [x] Configure proper build command for Expo web
- [x] Set correct publish directory
- [ ] Push to GitHub to trigger Netlify rebuild
- [ ] Verify website loads on fitness2witness.netlify.app

## Fix tRPC Context Error on Netlify (CRITICAL)
- [ ] Make tRPC provider optional/conditional
- [ ] Remove tRPC calls from dashboard and other screens
- [ ] Use mock/local data instead of backend calls
- [ ] Deploy to Netlify and verify page loads

## Make Frontend Independent (STEP 1)
- [ ] Remove tRPC calls from dashboard screen
- [ ] Remove tRPC calls from leaderboard screen
- [ ] Remove tRPC calls from community screen
- [ ] Remove tRPC calls from challenges screen
- [ ] Remove tRPC calls from profile screen
- [ ] Add mock data for all screens
- [ ] Make tRPC provider optional in app layout
- [ ] Test frontend loads without backend
- [ ] Deploy to Netlify and verify

## Enhanced Check-In System (Phase 2)
- [ ] Update check-in screen to allow ONE PHOTO PER CATEGORY (Nutrition, Hydration, Movement, Scripture)
- [ ] Add carb count input field to Nutrition category
- [ ] Add workout details input field to Movement category (type, duration, intensity)
- [ ] Store detailed nutrition and movement data in database
- [ ] Display detailed inputs in check-in history

## AI-Powered Body Metrics Analysis (Phase 3)
- [ ] Enhance InBody scan AI analysis to extract all available metrics
- [ ] Add trend analysis and projections based on historical data
- [ ] Calculate weight loss/gain velocity
- [ ] Project future body composition based on current trends
- [ ] Correlate nutrition/workout data with body composition changes
- [ ] Display AI insights and recommendations on body metrics screen
- [ ] Add 12-week projection charts with confidence intervals

## Challenge Creation & Invitation System (Phase 4)
- [ ] Build challenge creation modal for users, leaders, and admins
- [ ] Add challenge invitation system (send invites to group members)
- [ ] Create challenge acceptance/decline flow
- [ ] Add challenge notification system
- [ ] Build challenge management screen (edit, delete, end early)
- [ ] Add challenge visibility settings (public to group, private invite-only)
- [ ] Implement challenge rewards/badges system
- [ ] Create challenge templates for common challenge types

## Body Metrics Workflow Clarification
- [ ] Simplify body metrics screen to focus on photo-first workflow
- [ ] Primary action: Take photo or upload InBody scan printout
- [ ] AI automatically extracts ALL metrics from the scan (no manual entry needed)
- [ ] Store baseline from first scan
- [ ] Track progress by comparing subsequent scans to baseline
- [ ] Display trend charts showing changes over time
- [ ] Optional: Allow manual entry only if AI extraction fails

## InBody Target Tracking System
- [ ] Enhance AI InBody extraction to capture recommended targets (carbs, calories, protein, etc.)
- [ ] Store InBody baseline targets in database (linked to user)
- [ ] Update check-in screen to display carb progress (e.g., "150g / 200g target")
- [ ] Show visual progress indicators for nutrition targets
- [ ] Compile all workout entries from check-ins into aggregated view
- [ ] Calculate total workout volume (minutes, frequency, intensity distribution)
- [ ] Build correlation analysis: nutrition adherence vs body composition changes
- [ ] Build correlation analysis: workout consistency vs body composition changes
- [ ] Add insights dashboard showing how daily actions impact InBody metrics
- [ ] Display average daily carbs vs target over time
- [ ] Show workout frequency trends and correlation with weight/body fat changes

## Critical Bug Fixes (Reported 2026-02-10 - After Production Testing)

- [x] Move challenge creation to Admin/Leader dashboard only (already restricted - only leaders/admins see create button)
- [x] Users can view and join challenges, only admins/leaders can create them
- [x] Fix logout button (now properly calls backend logout endpoint and clears session)
- [x] Fix auth session issues (clarified: use LOGIN for existing accounts, not REGISTER)
- [x] Fix export stats button (now uses Share API on mobile, clipboard on web)

## Authentication Flow Fix (URGENT - 2026-02-10)

- [x] Remove oauth/callback route reference causing layout error
- [x] Create login/register screen with phone number input
- [x] Add authentication gate to app layout (redirect to login if not authenticated)
- [x] Fix 401 Unauthorized errors by ensuring proper session handling
- [x] Updated logout to redirect to /auth screen instead of /

## Leaderboard Enhancement (2026-02-10)

- [x] Make top 3 performers highly visible with bold text and special styling
- [x] Increase card size for top 3 (larger badges, text, padding)
- [x] Add trophy emojis (🥇🥈🥉) and colored borders for top 3
- [x] Add descriptive labels (Top Performer, Runner Up, Bronze Medal)
- [x] Ensure all users can see the full leaderboard ranked by points

## Profile Pictures & Avatars (2026-02-10)

- [ ] Add profile picture upload functionality to profile screen
- [ ] Add avatar selection option (preset avatars for users who don't want to upload)
- [ ] Store profile picture URL in user database
- [ ] Display profile pictures on leaderboard next to names
- [ ] Display profile pictures on community posts
- [ ] Display profile picture on profile screen header
- [ ] Add default avatar for users without uploaded pictures

## Weekly Winner Celebration System (2026-02-10)

- [ ] Create backend cron job to detect week end (Sunday 11:59 PM)
- [ ] Identify #1 performer for the week
- [ ] Generate AI congratulations message (authentic, personalized with stats)
- [ ] Post celebration message to community feed automatically
- [ ] Send text message to winner with celebration message
- [ ] Include winner's weekly stats in message (points, check-ins completed, achievements)
- [ ] Add celebration badge/icon to winner's profile for the week

## URGENT: Login Not Working (2026-02-10)

- [x] User enters phone number but stays on auth page (doesn't redirect to app)
- [x] Removed blocking Alert that prevented redirect
- [x] Added 500ms delay to ensure session cookie is set
- [x] Fixed loading state to persist during redirect

## Critical Bug: Login Redirect Issue
- [ ] Fix cross-origin cookie authentication between Netlify frontend and Render backend
- [ ] Ensure session cookies are properly set and sent with SameSite=None; Secure
- [ ] Verify auth.me query returns user data after successful login
- [ ] Test login flow redirects to dashboard instead of staying on auth page

## Critical Bug: Login Redirect Issue (Updated)
- [x] Fix cross-origin cookie authentication between Netlify frontend and Render backend
- [ ] Switch from cookie-based to token-based authentication (browsers block third-party cookies)
- [ ] Return JWT token in login response body instead of cookie
- [ ] Store token in localStorage/SecureStore on frontend
- [ ] Send token in Authorization header with all API requests
- [ ] Update backend to read token from Authorization header
- [ ] Test login flow redirects to dashboard successfully

## Critical Bug: Check-In Submission Not Working
- [ ] Investigate why check-in submission doesn't register when clicking submit
- [ ] Fix navigation issue - should go to next page after submission
- [ ] Ensure check-in data is properly saved to database
- [ ] Test all four categories (Nutrition, Hydration, Movement, Scripture)

## Critical Bug: Database Not Properly Initialized
- [ ] Database is empty - no users, groups, or challenges
- [ ] Create default challenge "Fitness2Witness – 12 Week Challenge"
- [ ] Create pilot group
- [ ] Assign users to group
- [ ] Link group to challenge
- [ ] Verify check-in submission works after setup

## Critical Fix: Auto-Assign Users to Group
- [x] Modify registration endpoint to auto-assign new users to pilot group (ID 1)
- [ ] Deploy to production (push to GitHub)
- [ ] Test registration creates user with groupId
- [ ] Verify check-in submission works after registration

## Critical Bug: Invalid Token Handling
- [x] Add error handling to useAuth to detect invalid tokens
- [x] Automatically clear invalid tokens from localStorage/SecureStore
- [x] Force redirect to login when token is invalid
- [ ] Test logout properly clears all auth state
