# QA Output Style

Use this style when communicating test results, bug reports, and quality assessments.

## Characteristics

- **Clear reproduction steps**: Anyone can reproduce the issue
- **Evidence-based**: Include screenshots, logs, videos
- **Structured format**: Consistent bug report template
- **Severity classification**: Critical, High, Medium, Low
- **Environment details**: Device, OS, version, network

## Example Output

### Bug Report
```
🐛 Bug Report #47: Payment fails on iOS with specific card

Severity: High
Priority: P1
Status: Open
Assigned: Dev Team

Environment:
- Device: iPhone 14 Pro
- iOS Version: 17.1
- App Version: 1.2.0
- Network: WiFi

Steps to Reproduce:
1. Log in to app
2. Navigate to Pricing screen
3. Select "Pro Plan ($9.99/month)"
4. Tap "Subscribe"
5. Enter test card: 4000 0000 0000 0341
6. Tap "Pay"

Expected Result:
- Payment processing modal shows
- After 2-3 seconds, success message appears
- User redirected to dashboard
- Subscription status updated

Actual Result:
- Payment processing modal shows
- After ~10 seconds, error appears: "Payment failed"
- User stuck on payment screen
- Subscription not updated

Additional Info:
- Works fine on Android with same card
- Works fine on iOS with card 4242 4242 4242 4242
- Console shows: "Stripe error: card_decline_rate_limit_exceeded"
- Occurs 100% of the time with this specific card

Screenshots: [attached]
Video: [attached]
Logs: [attached]

Suggested Fix:
- Improve error message to explain why card was declined
- Add retry mechanism
- Show user-friendly error message
```

### Test Results
```
✅ Payment Flow Test Results

Test Suite: Payment Integration
Date: 2024-01-15
Tester: QA Team
Environment: Staging

Summary: 18/20 PASSED (90%)

Happy Path: ✅ PASSED
- Create payment intent: ✅
- Process payment with valid card: ✅
- Receive success confirmation: ✅
- Firestore updated correctly: ✅
- Email confirmation sent: ✅

Error Handling: ⚠️ 1 FAILED
- Declined card handling: ✅
- Network error handling: ✅
- Invalid amount handling: ✅
- Duplicate payment prevention: ❌ FAILED
  Issue: User can submit payment twice if tapping quickly
  Bug #48 created

Edge Cases: ✅ PASSED
- Zero amount: ✅ (correctly rejected)
- Negative amount: ✅ (correctly rejected)
- Extremely large amount: ✅ (correctly rejected)
- Missing currency: ✅ (defaults to USD)

Performance: ✅ PASSED
- Payment intent creation: 450ms (target: <1s) ✅
- Payment processing: 2.1s (target: <3s) ✅
- Webhook processing: 180ms (target: <500ms) ✅

Security: ✅ PASSED
- Unauthenticated requests blocked: ✅
- Amount validated server-side: ✅
- Webhook signature verified: ✅
- No card data in Firestore: ✅
- Payment logs sanitized: ✅

Recommendations:
1. Fix duplicate payment issue (Bug #48) before production
2. Add loading indicator during payment processing
3. Improve error messages for user clarity
```

### Test Plan
```
Test Plan: iOS Release v1.3.0

Scope: Payment features and authentication

Testing Phases:
1. Smoke Testing (30 min)
2. Functional Testing (4 hours)
3. Regression Testing (2 hours)
4. Exploratory Testing (2 hours)

Test Cases:

Authentication (8 test cases)
- [ ] TC-001: Sign up with email
- [ ] TC-002: Sign in with email
- [ ] TC-003: Sign in with Google
- [ ] TC-004: Password reset
- [ ] TC-005: Email verification
- [ ] TC-006: Sign out
- [ ] TC-007: Session persistence
- [ ] TC-008: Token refresh

Payment (12 test cases)
- [ ] TC-101: Create payment - valid card
- [ ] TC-102: Create payment - declined card
- [ ] TC-103: Create payment - expired card
- [ ] TC-104: Create payment - insufficient funds
- [ ] TC-105: Payment - network error
- [ ] TC-106: Payment - timeout
- [ ] TC-107: Subscription - monthly plan
- [ ] TC-108: Subscription - annual plan
- [ ] TC-109: Subscription - cancellation
- [ ] TC-110: Subscription - renewal
- [ ] TC-111: Refund processing
- [ ] TC-112: Transaction history

Devices to Test:
- iPhone SE (iOS 16) - Small screen
- iPhone 14 (iOS 17) - Standard
- iPhone 14 Pro Max (iOS 17) - Large screen
- iPad Air (iPadOS 17) - Tablet

Exit Criteria:
- All critical bugs fixed
- 95% test cases passed
- No open P1/P2 bugs
- Performance benchmarks met
- Security checklist complete
```

## When to Use

- Bug reports
- Test results
- QA status updates
- Test plan creation
- Release readiness assessment
