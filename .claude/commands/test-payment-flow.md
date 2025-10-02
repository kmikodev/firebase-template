# Test Payment Flow

Comprehensive testing of the complete payment flow using Stripe test mode.

## Command

```bash
echo "💳 Payment Flow Testing Guide"
echo ""
echo "1. Start Firebase Emulators"
echo "   npm run firebase:emulators"
echo ""
echo "2. Start Dev Server (in new terminal)"
echo "   npm run dev"
echo ""
echo "3. Test Cards to Use:"
echo "   ✅ Success: 4242 4242 4242 4242"
echo "   ❌ Decline: 4000 0000 0000 0002"
echo "   ⏸️  Requires Auth: 4000 0025 0000 3155"
echo "   💰 Insufficient Funds: 4000 0000 0000 9995"
echo ""
echo "4. Test Scenarios:"
echo "   - Create payment intent"
echo "   - Process successful payment"
echo "   - Handle declined card"
echo "   - Test webhook delivery"
echo "   - Verify Firestore updates"
echo "   - Check transaction records"
echo ""
echo "5. Verify in Firebase Emulator UI:"
echo "   http://localhost:4000"
echo ""
echo "6. Check Function Logs:"
echo "   Look for payment events and webhook processing"

# Optional: Run automated payment tests
if [ -f "tests/payment.test.ts" ]; then
    echo ""
    echo "Running automated payment tests..."
    npm test -- payment.test.ts
fi
```

## Manual Test Checklist

### Happy Path
- [ ] User selects product/plan
- [ ] Payment form loads correctly
- [ ] Enter test card: 4242 4242 4242 4242
- [ ] Expiry: any future date (e.g., 12/25)
- [ ] CVV: any 3 digits (e.g., 123)
- [ ] ZIP: any 5 digits (e.g., 12345)
- [ ] Payment processes successfully
- [ ] Success message displayed
- [ ] User credits/subscription updated in Firestore
- [ ] Transaction recorded
- [ ] Confirmation email sent (check logs)

### Declined Card
- [ ] Enter card: 4000 0000 0000 0002
- [ ] Payment fails gracefully
- [ ] Error message displayed
- [ ] User can retry
- [ ] No charge created
- [ ] No Firestore update

### Network Errors
- [ ] Simulate offline mode
- [ ] Verify error handling
- [ ] Check retry mechanism

### Webhook Testing
- [ ] Payment succeeds
- [ ] Webhook received by Cloud Function
- [ ] Signature verified
- [ ] Firestore updated
- [ ] Check logs: `firebase functions:log`

## Stripe Test Webhooks

Trigger test webhooks:
```bash
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
```

## Security Checks

- [ ] Payment amount validated server-side
- [ ] User authentication checked
- [ ] Webhook signature verified
- [ ] No card data stored in Firestore
- [ ] Idempotency key used
- [ ] Error messages don't leak sensitive info
