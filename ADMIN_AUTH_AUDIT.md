# ADMIN/AUTH AUDIT BUNDLE

## A) ROUTE + UI ENTRYPOINTS (Admin + Profile/Auth)

### 1) Admin-Related Screens/Routes

**File:** `/app/admin-calendar.tsx`
- Route: `/admin-calendar`
- Purpose: Admin calendar for adding check-ins and attendance

**File:** `/app/admin-users.tsx`
- Route: `/admin-users`
- Purpose: User management (remove from group, delete permanently)

**File:** `/app/admin-moderation.tsx`
- Route: `/admin-moderation`
- Purpose: Community post moderation (delete posts)

### 2) UI Buttons and onClick Handlers

#### Add Check-In Button
**File:** `/app/admin-calendar.tsx` (line 226)
```tsx
<TouchableOpacity
  key={user.id}
  onPress={() => handleQuickAddCheckIn(user.id, user.name)}
  className="p-3 bg-background rounded-xl border border-border flex-row items-center justify-between"
>
```

**Handler:** `handleQuickAddCheckIn` (lines 92-124)
```tsx
const handleQuickAddCheckIn = (userId: string, userName: string) => {
  if (!selectedDate) {
    Alert.alert("Error", "Please select a date first");
    return;
  }
  if (!userId) {
    Alert.alert("Error", "User ID is missing");
    return;
  }
  
  Alert.alert(
    "Quick Add Check-In",
    `Add full check-in (all 4 categories) for ${userName} on ${selectedDate.toLocaleDateString()}?`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Add All",
        onPress: () => {
          console.log("Adding check-in:", { userId, date: selectedDate.toISOString() });
          upsertCheckInMutation.mutate({
            userId,
            dateISO: selectedDate.toISOString(),
            nutritionDone: true,
            hydrationDone: true,
            movementDone: true,
            scriptureDone: true,
            notes: "Added by admin",
          });
        },
      },
    ]
  );
};
```

**Mutation:** `upsertCheckInMutation` (lines 31-43)
```tsx
const upsertCheckInMutation = trpc.admin.upsertCheckInForUserDate.useMutation({
  onSuccess: (data) => {
    console.log("Check-in saved successfully:", data);
    Alert.alert("Success", `Check-in ${data.action} successfully`);
    refetch();
    setEditMode(false);
    setSelectedUserId(null);
  },
  onError: (error) => {
    console.error("Check-in error:", error);
    Alert.alert("Error", error.message || "Failed to save check-in. Check console for details.");
  },
});
```

#### Mark Present Button
**File:** `/app/admin-calendar.tsx` (line 249)
```tsx
<TouchableOpacity
  key={user.id}
  onPress={() => !hasAttendance && handleAddAttendance(user.id)}
  disabled={hasAttendance}
>
```

**Handler:** `handleAddAttendance` (lines 126-141)
```tsx
const handleAddAttendance = (userId: string) => {
  if (!selectedDate) {
    Alert.alert("Error", "Please select a date first");
    return;
  }
  if (!userId) {
    Alert.alert("Error", "User ID is missing");
    return;
  }
  
  console.log("Adding attendance:", { userId, date: selectedDate.toISOString() });
  addAttendanceMutation.mutate({
    userId,
    date: selectedDate.toISOString(),
    attended: true,
  });
};
```

**Mutation:** `addAttendanceMutation` (lines 45-56)
```tsx
const addAttendanceMutation = trpc.admin.addUserAttendance.useMutation({
  onSuccess: () => {
    console.log("Attendance saved successfully");
    Alert.alert("Success", "Attendance recorded successfully");
    refetchAttendance();
  },
  onError: (error) => {
    console.error("Attendance error:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    Alert.alert("Error", `${error.message}\n\nCheck console for details.`);
  },
});
```

#### Delete Post Button
**File:** `/app/admin-moderation.tsx` (line 26)
```tsx
const handleDeletePost = (postId: number, postText: string) => {
  Alert.alert(
    "Delete Post",
    `Are you sure you want to delete this post?\n\n"${postText?.substring(0, 100)}..."`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePostMutation.mutateAsync({ postId });
            Alert.alert("Success", "Post deleted successfully");
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to delete post");
          }
        },
      },
    ]
  );
};
```

**Mutation:** `deletePostMutation` (lines 14-18)
```tsx
const deletePostMutation = trpc.community.deletePost.useMutation({
  onSuccess: () => {
    utils.community.getPosts.invalidate();
  },
});
```

#### Remove User Button
**File:** `/app/admin-users.tsx` (line 39)
```tsx
const handleRemoveUser = (userId: string, userName: string) => {
  Alert.alert(
    "Remove User",
    `Choose action for ${userName}:`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove from Group",
        onPress: async () => {
          try {
            await removeFromGroupMutation.mutateAsync({ userId });
            await refetch();
            Alert.alert("Success", `${userName} removed from group`);
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to remove user from group");
          }
        },
      },
      {
        text: "Delete Permanently",
        style: "destructive",
        onPress: async () => {
          try {
            await removeUserMutation.mutateAsync({ userId });
            await refetch();
            Alert.alert("Success", `${userName} deleted permanently`);
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to delete user");
          }
        },
      },
    ]
  );
};
```

**Mutations:** (lines 16-18)
```tsx
const removeUserMutation = trpc.admin.removeUser.useMutation();
const removeFromGroupMutation = trpc.admin.removeUserFromGroup.useMutation();
const deactivateUserMutation = trpc.admin.deactivateUser.useMutation();
```

#### Logout Button
**File:** `/app/(tabs)/profile.tsx` (line 20)
```tsx
const handleLogout = () => {
  Alert.alert("Logout", "Are you sure you want to logout?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Logout",
      style: "destructive",
      onPress: async () => {
        try {
          await logout();
          Alert.alert("Success", "You have been logged out successfully");
        } catch (error) {
          console.error("Logout failed:", error);
          Alert.alert("Error", "Failed to logout. Please try again.");
        }
      },
    },
  ]);
};
```

**Logout Function:** `/hooks/use-auth.ts` (lines 31-85)
```tsx
const logout = async () => {
  console.log("logout clicked");
  console.log("token before logout:", Platform.OS === "web" && typeof window !== "undefined" ? window.localStorage.getItem("auth_token") : "(native)");
  
  try {
    // Call backend logout endpoint via tRPC
    await logoutMutation.mutateAsync();

    // Clear auth token from secure storage
    if (Platform.OS !== "web") {
      await SecureStore.deleteItemAsync("auth_token");
      console.log("token removed from SecureStore");
    } else {
      // For web, clear from localStorage
      if (typeof window !== "undefined") {
        console.log("removing token from localStorage...");
        window.localStorage.removeItem("auth_token");
        console.log("token after logout:", window.localStorage.getItem("auth_token"));
        
        // Also clear cookies for backward compatibility
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
    }

    // Clear all tRPC/react-query cache
    console.log("clearing tRPC cache...");
    await utils.invalidate();

    console.log("logout successful, navigating to /auth");
    
    // Redirect to auth screen
    router.replace("/auth");
    
    // Force reload to clear all cached data (web only)
    if (Platform.OS === "web" && typeof window !== "undefined") {
      setTimeout(() => window.location.reload(), 100);
    }
  } catch (error) {
    console.error("Logout error:", error);
    // Even if backend call fails, still clear local token
    if (Platform.OS !== "web") {
      await SecureStore.deleteItemAsync("auth_token");
    } else {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("auth_token");
        console.log("token after logout (error path):", window.localStorage.getItem("auth_token"));
      }
    }
    router.replace("/auth");
  }
};
```

---

## B) TRPC CLIENT + AUTH HEADER ATTACHMENT (WEB)

### 1) tRPC Client Creation Code

**File:** `/lib/trpc.ts`

**Base URL:** (line 40)
```tsx
url: `${getApiBaseUrl()}/api/trpc`,
```

**Authorization Header Attachment:** (lines 44-47)
```tsx
async headers() {
  const token = await getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
},
```

**Token Reading Function:** (lines 21-30)
```tsx
async function getAuthToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("auth_token");
    }
    return null;
  } else {
    return await SecureStore.getItemAsync("auth_token");
  }
}
```

**Full tRPC Client Creation:** (lines 36-58)
```tsx
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getApiBaseUrl()}/api/trpc`,
        // tRPC v11: transformer MUST be inside httpBatchLink, not at root
        transformer: superjson,
        // Custom headers to include Authorization token
        async headers() {
          const token = await getAuthToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
        // Custom fetch to include credentials for backward compatibility
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: "include",
          });
        },
      }),
    ],
  });
}
```

### 2) Token Key Name and All Locations

**Token Key:** `"auth_token"`

**Read Locations:**
- `/lib/trpc.ts` line 24: `window.localStorage.getItem("auth_token")`
- `/lib/trpc.ts` line 28: `SecureStore.getItemAsync("auth_token")`
- `/hooks/use-auth.ts` line 33: `window.localStorage.getItem("auth_token")` (debug log)

**Write Locations:**
- `/app/auth.tsx` (login/register success) - stores token after auth

**Clear Locations:**
- `/hooks/use-auth.ts` line 19: `SecureStore.deleteItemAsync("auth_token")` (on auth error)
- `/hooks/use-auth.ts` line 22: `window.localStorage.removeItem("auth_token")` (on auth error)
- `/hooks/use-auth.ts` line 41: `SecureStore.deleteItemAsync("auth_token")` (logout native)
- `/hooks/use-auth.ts` line 47: `window.localStorage.removeItem("auth_token")` (logout web)
- `/hooks/use-auth.ts` line 76: `SecureStore.deleteItemAsync("auth_token")` (logout error fallback native)
- `/hooks/use-auth.ts` line 79: `window.localStorage.removeItem("auth_token")` (logout error fallback web)

---

## C) SERVER-SIDE ADMIN PROCEDURES (tRPC)

### admin.addUserAttendance

**File:** `/server/routers.ts` (lines 1018-1053)

**Input Schema:**
```tsx
z.object({
  userId: z.string(),
  date: z.string(),
  attended: z.boolean(),
})
```

**Permission Check:** (lines 1027-1030)
```tsx
const adminUser = await db.getUserById(ctx.user.id);
if (!adminUser || adminUser.role !== "admin") {
  throw new Error("Only admins can add attendance");
}
```

**Validation:** (lines 1032-1040)
```tsx
const targetUser = await db.getUserById(parseInt(input.userId));
if (!targetUser || !targetUser.groupId) {
  throw new Error("User must be assigned to a group");
}

const group = await db.getGroupById(targetUser.groupId);
if (!group || !group.challengeId) {
  throw new Error("Group must be assigned to a challenge");
}
```

**DB Call:** (lines 1042-1053)
```tsx
const date = new Date(input.date);
const startOfWeek = new Date(date);
startOfWeek.setHours(0, 0, 0, 0);
const dayOfWeek = startOfWeek.getDay();
const diff = startOfWeek.getDate() - dayOfWeek;
startOfWeek.setDate(diff);

await db.createAttendance({
  userId: parseInt(input.userId),
  groupId: targetUser.groupId,
  challengeId: group.challengeId,
  weekStartDate: startOfWeek,
  attended: input.attended,
});

return { success: true };
```

**Expected Payload:**
- `userId`: string (will be parsed to int)
- `date`: ISO string (e.g., "2024-01-15T00:00:00.000Z")
- `attended`: boolean

---

### admin.upsertCheckInForUserDate

**File:** `/server/routers.ts` (lines 955-1016)

**Input Schema:**
```tsx
z.object({
  userId: z.string(),
  dateISO: z.string(),
  nutritionDone: z.boolean(),
  hydrationDone: z.boolean(),
  movementDone: z.boolean(),
  scriptureDone: z.boolean(),
  lifeGroupAttended: z.boolean().optional(),
  notes: z.string().optional(),
})
```

**Permission Check:** (lines 969-972)
```tsx
const adminUser = await db.getUserById(ctx.user.id);
if (!adminUser || adminUser.role !== "admin") {
  throw new Error("Only admins can upsert check-ins");
}
```

**Validation:** (lines 974-982)
```tsx
const targetUser = await db.getUserById(parseInt(input.userId));
if (!targetUser || !targetUser.groupId) {
  throw new Error("User must be assigned to a group");
}

const group = await db.getGroupById(targetUser.groupId);
if (!group || !group.challengeId) {
  throw new Error("Group must be assigned to a challenge");
}
```

**DB Call:** (lines 984-1015)
```tsx
// Normalize date to day boundary
const date = new Date(input.dateISO);
date.setHours(0, 0, 0, 0);

// Check if check-in exists
const existing = await db.getDailyCheckin(parseInt(input.userId), date);

if (existing) {
  // Update existing
  await db.updateDailyCheckin(existing.id, {
    nutritionDone: input.nutritionDone,
    hydrationDone: input.hydrationDone,
    movementDone: input.movementDone,
    scriptureDone: input.scriptureDone,
    lifeGroupAttended: input.lifeGroupAttended,
    notes: input.notes,
  });
  return { success: true, action: "updated", checkInId: existing.id };
} else {
  // Create new
  const newCheckIn = await db.createCheckIn({
    date,
    userId: parseInt(input.userId),
    groupId: targetUser.groupId,
    challengeId: group.challengeId,
    nutritionDone: input.nutritionDone,
    hydrationDone: input.hydrationDone,
    movementDone: input.movementDone,
    scriptureDone: input.scriptureDone,
    lifeGroupAttended: input.lifeGroupAttended,
    notes: input.notes,
  });
  return { success: true, action: "created", checkInId: newCheckIn?.id || 0 };
}
```

**Expected Payload:**
- `userId`: string (will be parsed to int)
- `dateISO`: ISO string (e.g., "2024-01-15T00:00:00.000Z")
- `nutritionDone`: boolean
- `hydrationDone`: boolean
- `movementDone`: boolean
- `scriptureDone`: boolean
- `lifeGroupAttended`: boolean (optional)
- `notes`: string (optional)

---

### community.deletePost

**File:** `/server/routers.ts` (lines 472-480)

**Input Schema:**
```tsx
z.object({ postId: z.number() })
```

**Permission Check:** (lines 473-476)
```tsx
const user = await db.getUserById(ctx.user.id);
if (!user || user.role !== "admin") {
  throw new Error("Only admins can delete posts");
}
```

**DB Call:** (lines 478-479)
```tsx
await db.deletePost(input.postId);
return { success: true };
```

**Expected Payload:**
- `postId`: number

---

### admin.removeUser

**File:** `/server/routers.ts` (lines 655-669)

**Input Schema:**
```tsx
z.object({
  userId: z.string(),
})
```

**Permission Check:** (lines 662-665)
```tsx
const user = await db.getUserById(ctx.user.id);
if (!user || user.role !== "admin") {
  throw new Error("Only admins can remove users");
}
```

**DB Call:** (lines 667-668)
```tsx
await db.deleteUser(parseInt(input.userId));
return { success: true };
```

**Expected Payload:**
- `userId`: string (will be parsed to int)

---

### admin.removeUserFromGroup

**File:** `/server/routers.ts` (lines 689-704)

**Input Schema:**
```tsx
z.object({
  userId: z.string(),
})
```

**Permission Check:** (lines 696-699)
```tsx
const user = await db.getUserById(ctx.user.id);
if (!user || user.role !== "admin") {
  throw new Error("Only admins can remove users from groups");
}
```

**DB Call:** (lines 701-703)
```tsx
await db.updateUser(parseInt(input.userId), { groupId: null });
const updatedUser = await db.getUserById(parseInt(input.userId));
return updatedUser;
```

**Expected Payload:**
- `userId`: string (will be parsed to int)

---

## D) LOGOUT + SESSION TIMEOUT

### 1) Logout Handler and Auth Guard

**Logout Handler:** `/hooks/use-auth.ts` (lines 31-85)
- See full code in Section A

**Auth Guard on App Load:** `/hooks/use-auth.ts` (lines 13-29)
```tsx
// Clear invalid token if auth query fails
useEffect(() => {
  if (error && !isLoading) {
    console.log("Auth error detected, clearing invalid token:", error.message);
    
    // Clear invalid token
    if (Platform.OS !== "web") {
      SecureStore.deleteItemAsync("auth_token").catch(console.error);
    } else {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("auth_token");
      }
    }
    
    // Redirect to auth screen
    router.replace("/auth");
  }
}, [error, isLoading]);
```

**Auth Query:** `/hooks/use-auth.ts` (line 9)
```tsx
const { data: user, isLoading, error, refetch } = trpc.auth.me.useQuery();
```

**Backend Auth Endpoint:** `/server/routers.ts` (line 39)
```tsx
me: publicProcedure.query((opts) => opts.ctx.user),
```

### 2) Token Expiration Handling

**Backend Logout Endpoint:** `/server/routers.ts` (lines 40-46)
```tsx
logout: publicProcedure.mutation(({ ctx }) => {
  const cookieOptions = getSessionCookieOptions(ctx.req);
  ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
  return {
    success: true,
  } as const;
}),
```

**JWT Expiration:** No JWT expiration handling found in codebase.

**Auto Logout Timer:** **No idle timeout implemented.**

---

## E) MINIMAL REPRODUCTION NOTES

### 1) Add Check-In Does Nothing / Errors

**What the UI does:**
- User clicks "Add Check-In" button → Alert confirmation → Click "Add All" → Nothing happens OR 400 error

**Which function/mutation should run:**
- `handleQuickAddCheckIn` → `upsertCheckInMutation.mutate()` → `admin.upsertCheckInForUserDate`

**Why it might fail:**
- **Auth missing:** Token not attached to request (check browser Network tab for Authorization header)
- **Role missing:** User's role in DB is not "admin" (check `users` table `role` column)
- **Invalid payload:** `dateISO` format incorrect (must be ISO string like "2024-01-15T00:00:00.000Z")
- **User validation:** Target user not assigned to a group OR group not assigned to a challenge
- **Date picker issue on web:** `selectedDate` is null because DateTimePicker doesn't work on web

### 2) Mark Present Returns 400

**What the UI does:**
- User clicks "Mark Present" → 400 Bad Request error

**Which function/mutation should run:**
- `handleAddAttendance` → `addAttendanceMutation.mutate()` → `admin.addUserAttendance`

**Why it might fail:**
- **Auth missing:** Token not attached to request
- **Role missing:** User's role in DB is not "admin"
- **Invalid payload:** `date` format incorrect (must be ISO string)
- **User validation:** Target user not assigned to a group OR group not assigned to a challenge
- **Date picker issue on web:** `selectedDate` is null

### 3) Delete Post Does Nothing / Errors

**What the UI does:**
- Admin clicks "Delete" on post → Alert confirmation → Click "Delete" → Nothing happens OR error

**Which function/mutation should run:**
- `handleDeletePost` → `deletePostMutation.mutateAsync()` → `community.deletePost`

**Why it might fail:**
- **Auth missing:** Token not attached to request
- **Role missing:** User's role in DB is not "admin"
- **Invalid payload:** `postId` is not a number or is missing
- **Post doesn't exist:** Post already deleted or invalid postId

### 4) Remove User Does Nothing / Errors

**What the UI does:**
- Admin clicks "Remove" → Alert with 2 options → Click "Remove from Group" or "Delete Permanently" → Nothing happens OR error

**Which function/mutation should run:**
- `handleRemoveUser` → `removeFromGroupMutation.mutateAsync()` OR `removeUserMutation.mutateAsync()` → `admin.removeUserFromGroup` OR `admin.removeUser`

**Why it might fail:**
- **Auth missing:** Token not attached to request
- **Role missing:** User's role in DB is not "admin"
- **Invalid payload:** `userId` is not a string or is missing
- **User doesn't exist:** User already deleted or invalid userId

### 5) Logout Doesn't Work

**What the UI does:**
- User clicks "Logout" → Alert confirmation → Click "Logout" → Token still in localStorage after logout

**Which function/mutation should run:**
- `handleLogout` → `logout()` → `logoutMutation.mutateAsync()` → `auth.logout`

**Why it might fail:**
- **localStorage.removeItem not executing:** Check browser console for "removing token from localStorage..." log
- **Token being re-added:** Some code is re-writing the token after removal
- **Page reload timing:** Token cleared but page reloads before console log shows null
- **Browser caching:** Browser is caching the localStorage value
- **Multiple storage locations:** Token stored in both localStorage AND cookies, only one being cleared

### 6) Session Never Times Out on Web

**What should happen:**
- After X minutes of inactivity, user should be logged out automatically

**Why it doesn't work:**
- **No idle timeout implemented.** There is no timer or JWT expiration check in the codebase.
- **JWT never expires:** No `exp` claim validation on backend
- **No session timeout:** No automatic logout after inactivity period

---

**END OF AUDIT BUNDLE**
