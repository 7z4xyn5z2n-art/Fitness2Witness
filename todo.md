# Fitness2Witness - Admin Calendar Fix (URGENT)

## Problem
- Console warning: "DateTimePicker is not supported on: web"
- Clicking "Mark Present" → 400 Bad Request (admin.addUserAttendance)
- Clicking "Add Check-In" does nothing or errors
- Root cause: selectedDate is null/undefined on web

## Requirements
- [x] Fix date selection on WEB: replace DateTimePicker with <input type="date"> (lines 149-170)
- [x] Keep native DateTimePicker on iOS/Android (lines 171-194)
- [x] Default selectedDate to TODAY on load (line 11: useState(new Date()))
- [x] Validate selectedDate and userId exist before calling mutations (lines 88-95, 122-129)
- [x] Show toast/alert if date or user missing (lines 89, 93, 123, 127)
- [x] Send date in correct format (ISO string) (lines 108, 134)
- [x] Add console logs for debugging (lines 105, 131)
- [x] Success: toast "Saved" and invalidate/refetch queries (lines 34-35, 48-49)
- [x] Error: toast shows server message and logs details (lines 40-41, 52-54)

## Acceptance Tests (WEB)
- [ ] No "DateTimePicker not supported" warning
- [ ] Selecting date works
- [ ] Mark Present creates attendance successfully (no 400)
- [ ] Add Check-In works and updates immediately
- [ ] Mobile behavior unchanged
