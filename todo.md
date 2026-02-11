# Fitness2Witness - Logout Fix (URGENT)

## Problem
- Clicking Logout does NOT remove localStorage "auth_token"
- localStorage.getItem("auth_token") still returns token after clicking logout

## Requirements
- [x] Ensure Logout button is correctly wired to logout handler (onClick)
- [x] Handler MUST: localStorage.removeItem("auth_token") - line 47 in use-auth.ts
- [x] Handler MUST: clear tRPC/react-query cache (utils.invalidate) - line 61 in use-auth.ts
- [x] Handler MUST: navigate to /auth - line 66 in use-auth.ts
- [x] Add visible toast message on logout success - line 29 in profile.tsx
- [x] Add console.log("logout clicked") inside handler - line 32 in use-auth.ts
- [x] Add console.log("token after logout", localStorage.getItem("auth_token")) - line 48 in use-auth.ts
- [x] Ensure no UI overlay blocks the click (z-index/pointer-events) - verified TouchableOpacity
- [x] Remove any duplicate/unused logout buttons or handlers - only one logout button

## Acceptance Test
- [ ] Before click: localStorage.getItem("auth_token") returns a token string
- [ ] After click: localStorage.getItem("auth_token") returns null
- [ ] After click: UI is on /auth
