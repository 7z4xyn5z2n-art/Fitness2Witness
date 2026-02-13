# Remaining Fixes for 95% Confidence Admin Day Editor

## Status: Phase 1 Complete, Phase 2 ~70% Complete

### ✅ Completed (Phase 1)
- Database schema migrated to DATE columns (day, weekStart)
- Unique constraints added to prevent duplicates
- adminAuditLog table created with indexes
- toDateString() helper function added
- 36+ database functions updated to use new column names

### 🚧 In Progress (Phase 2 - API Contract Standardization)

**Remaining TypeScript Errors: 16**

All errors are related to frontend files still using old parameter names:
- `dateISO` → should be `day`
- `date` → should be `day` (in mutation payloads)
- Missing `idempotencyKey` in point adjustment calls

#### Files Needing Updates:

1. **app/admin-calendar.tsx** (4 errors)
   - Line 77: Change `dateISO:` to `day:`
   - Line 126: Change `dateISO:` to `day:`
   - Line 152: Change `.date` to `.day`

2. **app/admin-console.tsx** (2 errors)
   - Line 133: Change `dateISO:` to `day:`
   - Line 156: Change `.date` to `.day`

3. **app/admin-day-editor.tsx** (5 errors)
   - Line 47, 62: tRPC query parameter mismatch (needs investigation)
   - Line 127: Change `dateISO:` to `day:`
   - Line 153: Change `.date` to `.day`
   - Line 202: Add `idempotencyKey` to point adjustment payload

4. **app/attendance.tsx** (1 error)
   - Line 75: Change `date:` to `day:`

5. **app/checkin.tsx** (1 error)
   - Line 169: Change `date:` to `day:`

6. **server/routers.ts** (3 errors)
   - Line 865: Change `date:` to `day:` in createPointAdjustment call
   - Line 1008: Change `date:` to `day:` in createDailyCheckin call
   - Line 1298-1299: Change `dateISO` to `day` in getDaySnapshot

### ⏳ Not Started (Phase 2 Remaining)

- [ ] Add console.log for all mutation payloads (before DB write)
- [ ] Add console.log for all mutation results (after DB write)
- [ ] Add adminAuditLog entry for every mutation:
  - upsertDailyCheckin
  - setWeeklyAttendance
  - createPointAdjustmentForDay
  - updatePost
  - deletePost
- [ ] Verify all admin procedures enforce server-side admin role check

### ⏳ Not Started (Phase 3 - Frontend Date + State Reliability)

- [ ] Change selectedDate to selectedDay storing "YYYY-MM-DD" string
- [ ] Remove any toISOString() conversions for day keys
- [ ] Add disabled={mutation.isPending} to all mutation buttons
- [ ] Generate idempotencyKey for point adjustments (userId:day:points:reason:bucket)
- [ ] Replace useState initializer with useEffect for snapshot state sync
- [ ] Verify destructive actions have confirmation dialogs

### ⏳ Not Started (Phase 4 - Tests)

- [ ] Integration test: upsert daily check-in twice => only 1 record
- [ ] Integration test: set attendance twice => only 1 record
- [ ] Integration test: create adjustment with same idempotencyKey => only 1 record
- [ ] Integration test: admin selects "2026-02-13" => DB day = '2026-02-13'
- [ ] Integration test: non-admin calling admin mutation => rejected
- [ ] E2E test: pick day + user, toggle checkin, save, reload, confirm persists

## Quick Fix Commands

```bash
# Fix frontend dateISO → day
cd /home/ubuntu/fitness2witness
sed -i 's/dateISO:/day:/g' app/admin-calendar.tsx app/admin-console.tsx app/admin-day-editor.tsx

# Fix frontend .date → .day in payload access
sed -i 's/payload\.date/payload.day/g' app/admin-calendar.tsx app/admin-console.tsx app/admin-day-editor.tsx

# Fix attendance.tsx
sed -i 's/date:/day:/g' app/attendance.tsx

# Fix checkin.tsx
sed -i 's/date:/day:/g' app/checkin.tsx

# Fix server/routers.ts remaining issues
sed -i 's/date: toDateString/day: toDateString/g' server/routers.ts
```

## Estimated Time to Complete

- **Phase 2 remaining**: 30 minutes (fix 16 TS errors + add audit logging)
- **Phase 3**: 1 hour (frontend state management fixes)
- **Phase 4**: 1-2 hours (write and run integration tests)

**Total**: 2.5-3.5 hours to reach 95% confidence
