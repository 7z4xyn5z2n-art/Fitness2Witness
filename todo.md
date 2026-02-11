# Fitness2Witness - Admin Panel Functionality

## A) Confirm Admin Role Works
- [x] Verify logged-in admin user has role='admin' in DB
- [x] Ensure admin middleware checks ctx.user.role === 'admin'
- [x] Return 403 when not admin (adminProcedure middleware)

## B) Implement Admin tRPC Procedures
- [x] admin.getAllUsers - returns safe user fields (id, name, groupId, role)
- [x] admin.removeUserFromGroup - set groupId=null
- [x] admin.deactivateUser - set groupId=null (deactivate)
- [x] admin.removeUser - delete user permanently
- [x] community.deletePost - delete post by postId (admin-only)
- [x] admin.upsertCheckInForUserDate - create/update check-in for specific user+date

## C) Frontend Admin UI Wiring
- [x] Users list: "Remove" button shows 2 options (Remove from Group / Delete Permanently)
- [x] Users list: refresh on success
- [x] Community moderation: Delete button calls deletePost
- [x] Community moderation: invalidate query on success (immediate UI update)
- [x] Calendar: admin selects user from list
- [x] Calendar: "Quick Add" adds full check-in (all 4 categories)
- [x] Calendar: "Custom" option for selecting specific categories
- [x] Calendar: uses upsertCheckInForUserDate (creates OR updates)
- [x] Calendar: shows "created" or "updated" confirmation

## D) Error Handling
- [x] All failed admin actions show actual error message (error.message)
- [x] No silent failures

## Deliverables
- [ ] File paths changed documented
- [ ] Exact procedure names documented
- [ ] Confirmation each action works in browser
