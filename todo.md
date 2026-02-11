# Fitness2Witness - InBody & AI Meal Suggestions

## A) InBody Upload/Scan Reliability
- [x] Verify file upload succeeds
- [x] Verify file stored in DB/storage
- [x] Verify parsed values populate body metrics
- [x] Ensure parsing failures never block saving (store file + manual entry message)
- [x] Test end-to-end: upload → storage → metrics OR fallback

## B) AI Meal Suggestions (Safe Implementation)
- [x] Create nutrition.getMealSuggestions endpoint
- [x] Read latest body metrics + user goal
- [x] Call AI to generate 3-5 meal suggestions + macros
- [x] Return suggestions as JSON
- [x] Add "Generate meal suggestions" button in Nutrition section
- [x] Handle AI failures gracefully (show error, allow continue)
- [x] Never block check-ins, posts, or body metrics saving
- [x] Cache suggestions with timestamp (day/week)
- [x] Add "Regenerate" button

## Verification Checklist
- [x] Check-in submission works even if AI is down (no changes to checkins.submit)
- [x] Upload InBody → view metrics → generate suggestions → suggestions appear
- [x] Parsing failure stores file and shows manual entry message
- [x] AI failure shows error but doesn't break app
