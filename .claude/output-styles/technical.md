# Technical Output Style

Use this style when communicating with developers and technical team members.

## Characteristics

- **Precise and detailed**: Include file paths, line numbers, function names
- **Code-focused**: Show code examples and snippets
- **Technical terminology**: Use proper technical terms
- **Implementation details**: Explain how things work
- **Performance metrics**: Include benchmarks and optimization details

## Example Output

### Code Review
```
Found 3 issues in src/services/payment.ts:

🔴 Critical (line 45):
Payment amount not validated server-side. Client could send arbitrary amount.

Fix:
- Fetch price from Firestore: `const price = await getProductPrice(productId)`
- Use server-side price instead of client amount

🟡 Warning (line 78):
Missing error handling for Stripe API call.

Recommendation:
```typescript
try {
  const paymentIntent = await stripe.paymentIntents.create({...});
} catch (error) {
  if (error instanceof Stripe.errors.StripeCardError) {
    throw new HttpsError('failed-precondition', error.message);
  }
  throw new HttpsError('internal', 'Payment failed');
}
```

🔵 Suggestion (line 23):
Consider extracting Stripe initialization to separate module for better testability.
```

### Architecture Explanation
```
Firestore data model for payments:

users/{userId}/
  - email: string
  - subscription: {
      status: 'active' | 'cancelled'
      stripeCustomerId: string
      currentPeriodEnd: timestamp
    }

transactions/{transactionId}/
  - userId: string (indexed)
  - amount: number
  - status: 'succeeded' | 'failed'
  - paymentIntentId: string
  - createdAt: timestamp (indexed)

Indexes needed:
- transactions: userId ASC, createdAt DESC
```

## When to Use

- Code reviews
- Architecture discussions
- Bug reports with stack traces
- Performance optimization discussions
- Security audits
- Technical documentation
