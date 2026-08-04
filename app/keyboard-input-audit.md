# Keyboard Input Audit

Date: 2026-06-01

## Inventory Before Keyboard Handling Changes

Total actual `TextInput` components found: 58

Files/screens/components with inputs:

- `app/(auth)/forgot-password.tsx`: 4 inputs
- `app/(auth)/login.tsx`: 2 inputs
- `app/(auth)/otp-verification.tsx`: 1 rendered OTP input template, used for 6 OTP boxes
- `app/(auth)/register.tsx`: 4 inputs
- `app/(auth)/reset-password.tsx`: 2 inputs
- `app/(profile)/payout-information.tsx`: 1 input
- `app/(profile)/personal-info.tsx`: 2 inputs
- `app/(profile)/security.tsx`: 1 input template for password rows
- `app/(provider)/create-service.tsx`: 6 inputs
- `app/(provider)/deliver-order.tsx`: 1 input
- `app/(provider)/earnings.tsx`: 2 inputs
- `app/(provider)/requests.tsx`: 1 search input
- `app/(provider-setup)/wizard.tsx`: 5 inputs
- `app/(provider-tabs)/orders.tsx`: 1 search input
- `app/(tabs)/booking.tsx`: 1 search input
- `app/(tabs)/index.tsx`: 2 search inputs
- `app/booking-details.tsx`: 3 modal/bottom-sheet inputs
- `app/book-service.tsx`: 2 inputs
- `app/categories.tsx`: 1 search input
- `app/chat-details.tsx`: 5 inputs
- `app/post-request.tsx`: 5 inputs
- `app/resolution-center.tsx`: 1 comment input
- `app/services.tsx`: 1 search input
- `src/components/ConversationListScreen.tsx`: 1 search input
- `src/components/feedback/WebsiteReviewPrompt.tsx`: 1 modal input
- `src/components/SupportScreen.tsx`: 2 support form inputs

## Implementation

- Added `src/components/KeyboardAwareScrollView.tsx`.
- The shared component listens for keyboard show/hide events, tracks scroll position, measures the currently focused native input, and scrolls just enough to keep it above the keyboard.
- Enabled Android resize behavior with `android.softwareKeyboardLayoutMode = "resize"` in `app.json`.
- Replaced input-owning screen scroll containers with `KeyboardAwareScrollView`.
- Wrapped modal and bottom-sheet input areas where needed.
- Kept existing chat `KeyboardAvoidingView` behavior and added keyboard-aware scrolling to the custom proposal composer.

## Updated Screens/Components

- Auth: login, register, forgot password, reset password, OTP verification
- Client: home search, bookings search, categories search, services search, post request, book service, booking detail modals, resolution center
- Profile: personal info, payout information, security
- Provider: create service, delivery, earnings, provider requests, provider orders, provider setup wizard
- Chat/support: chat details composer/proposal form, conversation search, support form, website review modal

## Verification

- Static inventory after changes: all 26 files/components containing rendered `TextInput` now include either `KeyboardAwareScrollView` or `KeyboardAvoidingView`.
- `npm.cmd run lint`: passed with 3 pre-existing warnings.
- `npx.cmd tsc --noEmit`: passed.

Device-by-device manual tapping of all 58 fields was not performed in this environment. The implementation is centralized and statically covers every identified input owner.
