# Fitness2Witness Mobile App Design

## Design Philosophy
- **Mobile-first**: Optimized for portrait orientation (9:16) and one-handed usage
- **iOS HIG Compliance**: Follows Apple Human Interface Guidelines for native feel
- **Accessibility**: Clear typography, sufficient touch targets, intuitive navigation
- **Faith + Fitness**: Balanced visual language combining wellness and spirituality

## Color Palette
- **Primary**: Deep purple (#7C3AED) - represents faith and commitment
- **Secondary**: Vibrant green (#10B981) - represents growth and wellness
- **Success**: Emerald (#22C55E) - achievement and completion
- **Warning**: Amber (#F59E0B) - needs attention
- **Error**: Red (#EF4444) - missed goals
- **Background Light**: White (#FFFFFF)
- **Background Dark**: Near black (#151718)
- **Surface**: Light gray (#F5F5F5) / Dark gray (#1E2022)
- **Text Primary**: Dark gray (#11181C) / Light gray (#ECEDEE)
- **Text Muted**: Medium gray (#687076) / Light gray (#9BA1A6)

## Screen List & Flows

### 1. Authentication & Onboarding
**Screens**: Welcome, Login, Role Selection (if new user)
- Welcome screen with app logo and tagline
- OAuth login (email/password)
- First-time users see brief onboarding explaining the 12-week challenge

### 2. Role-Based Home (Tab Navigation)
**User Role** → My Dashboard (default tab)
**Leader Role** → Leader Dashboard (default tab)
**Admin Role** → Admin Console (default tab)

### 3. User Dashboard (Main Tab)
**Content**:
- Header: User name, current week number
- Points summary card:
  - This week: X / 38 points
  - Total: X / 456 points
  - Progress bars for both
- Quick action button: "Log Today's Check-In" (prominent, centered)
- Charts section:
  - Line chart: Weekly totals (Week 1-12)
  - Bar chart: Daily points this week (Mon-Sun)
- Recent proof photos grid (3x2 thumbnails)

**Navigation**: Bottom tabs (Dashboard, Leaderboard, Community, Chat, Profile)

### 4. Daily Check-In Screen
**Content**:
- Date selector (defaults to today)
- Four toggle sections (each with icon):
  - ✓ Nutrition (1 pt)
  - ✓ Hydration (1 pt)
  - ✓ Movement/Fitness (1 pt)
  - ✓ Scripture/Prayer (1 pt)
- Notes field (optional text)
- Photo upload section:
  - "Take Photo" button (camera icon)
  - "Choose from Library" button (gallery icon)
  - Thumbnail preview if photo added
- Points summary: "Today's Total: X / 4 points"
- Submit button (disabled if already submitted for today)

**Flow**: User taps toggles → adds photo → writes notes → submits → returns to dashboard with success message

### 5. Group Leaderboard (Tab)
**Content**:
- Segmented control: "This Week" / "Overall"
- Ranked list of users:
  - Position number
  - User avatar/initials
  - User name
  - Points (X / 38 or X / 456)
  - Progress bar
  - Highlight current user's row
- Pull-to-refresh

### 6. Community Feed (Tab)
**Content**:
- "Create Post" button (floating action button)
- Feed of posts (reverse chronological):
  - User avatar, name, timestamp
  - Post type badge (Encouragement, Testimony, Photo, Video, Announcement)
  - Post text
  - Image/video (if attached)
  - Pin icon (if pinned by leader/admin)
  - Like count (optional)
  - Comment count
  - Tap to expand comments
- Pinned posts appear at top with distinct styling
- Announcements have special background color

**Create Post Flow**:
- Modal sheet slides up
- Post type selector
- Text field
- Image upload / video URL field
- Visibility toggle (Group Only / Leaders Only) - if user is leader/admin
- Submit button

**Comments Flow**:
- Tap post → expands to show comments
- Comment list below post
- Comment input field at bottom
- Submit comment button

### 7. Group Chat (Tab)
**Content**:
- Real-time message list (reverse chronological)
- Each message shows:
  - User avatar/initials
  - User name
  - Message text
  - Image thumbnail (if attached)
  - Timestamp
- Message input field at bottom
- Send button
- Image attachment button (camera + gallery)

**Flow**: User types message → optionally adds image → sends → message appears in chat

### 8. Leader Dashboard (Leader/Admin)
**Content**:
- Participation today card:
  - "X / Y members checked in today"
  - Progress bar
- Top 3 this week (podium style)
- Needs Follow-Up list:
  - Members with < 50% completion this week
  - Tap to view member details
- Group weekly average chart (line chart, Week 1-12)
- Wednesday attendance overview:
  - "X / Y attended this week"
- Community moderation section:
  - Recent posts requiring review
  - Quick actions: pin, remove

**Navigation**: Bottom tabs (Leader Dashboard, Group, Community, Chat, Admin)

### 9. Admin Console (Admin only)
**Content**:
- User manager:
  - List of all users
  - Search/filter
  - Tap to edit user (name, email, group, role)
  - Add new user button
- Group manager:
  - List of groups
  - Tap to edit group (name, leader, challenge)
  - Add new group button
- Challenge manager:
  - List of challenges
  - Tap to edit challenge (name, dates, active status)
  - Add new challenge button
- Point adjustments tool:
  - Select user, date, points delta, reason
  - Submit adjustment
- Audit log:
  - List of all point adjustments
  - Filter by user, date range
- Community moderation:
  - All posts across groups
  - Edit/remove posts

**Navigation**: Bottom tabs (Admin, Users, Groups, Challenges, Audit)

### 10. Profile Screen
**Content**:
- User avatar (editable)
- User name, email
- Group name
- Role badge
- Settings section:
  - Notifications toggle
  - Dark mode toggle
  - Privacy policy link
  - Terms of service link
- Logout button

## Key User Flows

### Flow 1: Daily Check-In
1. User opens app → sees Dashboard
2. Taps "Log Today's Check-In" button
3. Check-In screen opens
4. User toggles completed categories
5. User taps "Take Photo" → camera opens → captures proof photo
6. User writes optional notes
7. User taps "Submit"
8. Success message appears
9. Returns to Dashboard with updated points

### Flow 2: View Leaderboard
1. User taps "Leaderboard" tab
2. Sees "This Week" leaderboard by default
3. Scrolls to find their position
4. Taps "Overall" segment to switch view
5. Pulls down to refresh

### Flow 3: Post to Community Feed
1. User taps "Community" tab
2. Taps floating "+" button
3. Create Post modal opens
4. User selects post type (e.g., "Encouragement")
5. User types message
6. User taps "Choose from Library" → selects image
7. User taps "Post"
8. Modal closes, new post appears at top of feed

### Flow 4: Leader Checks Participation
1. Leader opens app → sees Leader Dashboard
2. Views "Participation today" card (e.g., "8 / 15 checked in")
3. Scrolls to "Needs Follow-Up" section
4. Sees list of members with low completion
5. Taps member name → views member's check-in history
6. Sends encouragement via Group Chat

### Flow 5: Admin Adjusts Points
1. Admin opens app → taps "Admin" tab
2. Taps "Point Adjustments" section
3. Selects user from dropdown
4. Enters date, points delta (+5), reason ("Bonus for leading prayer")
5. Taps "Submit Adjustment"
6. Adjustment appears in Audit Log
7. User's total points update immediately

## Navigation Structure

### User Role
- Tab 1: Dashboard (house icon)
- Tab 2: Leaderboard (trophy icon)
- Tab 3: Community (people icon)
- Tab 4: Chat (message icon)
- Tab 5: Profile (person icon)

### Leader Role
- Tab 1: Leader Dashboard (chart icon)
- Tab 2: Group (people icon)
- Tab 3: Community (feed icon)
- Tab 4: Chat (message icon)
- Tab 5: Admin (gear icon)

### Admin Role
- Tab 1: Admin Console (gear icon)
- Tab 2: Users (person icon)
- Tab 3: Groups (people icon)
- Tab 4: Challenges (flag icon)
- Tab 5: Audit (document icon)

## Component Patterns

### Cards
- Rounded corners (16px)
- Subtle shadow
- White background (light mode) / Dark surface (dark mode)
- Padding: 16px

### Buttons
- Primary: Purple background, white text, rounded full
- Secondary: Transparent background, purple border, purple text
- Destructive: Red background, white text
- Touch feedback: Scale 0.97 + light haptic

### Lists
- Use FlatList for all scrollable lists
- Pull-to-refresh enabled
- Empty state with icon + message

### Charts
- Use react-native-chart-kit or Victory Native
- Consistent color scheme (primary purple, secondary green)
- Axis labels, grid lines, tooltips

### Images
- Lazy loading for feed images
- Thumbnail previews with tap-to-expand
- Image picker with camera + library options

## Accessibility
- Minimum touch target: 44x44 points
- Color contrast ratio: 4.5:1 for text
- VoiceOver labels for all interactive elements
- Dynamic type support

## Performance
- Optimize FlatList with `getItemLayout`, `keyExtractor`, `windowSize`
- Lazy load images with expo-image
- Debounce search inputs
- Cache API responses with React Query

## Branding
- App name: "Fitness2Witness"
- Tagline: "12 Weeks of Faith & Fitness"
- Logo: Custom icon combining fitness (dumbbell) and faith (cross) elements
- Primary font: System default (SF Pro on iOS)
