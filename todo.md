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
