# Security Audit

Runs comprehensive security checks on the Firebase application.

## Command

```bash
echo "🛡️  Running Security Audit..."
echo ""

# 1. Check for exposed secrets
echo "1️⃣  Checking for exposed secrets..."
if grep -r "sk_live\|sk_test\|AIza\|firebase.*apiKey.*:" src/ functions/src/ 2>/dev/null; then
    echo "   ❌ Potential secrets found in code!"
else
    echo "   ✅ No obvious secrets in code"
fi

# 2. NPM audit
echo ""
echo "2️⃣  Running npm audit..."
npm audit --production

# 3. Check Firestore security rules
echo ""
echo "3️⃣  Checking Firestore security rules..."
if [ -f "firestore.rules" ]; then
    if grep -q "allow read, write: if true" firestore.rules; then
        echo "   ❌ WARNING: Insecure rules detected!"
        echo "      Found 'allow read, write: if true'"
    else
        echo "   ✅ No obviously insecure rules found"
    fi
fi

# 4. Check for console.log in production
echo ""
echo "4️⃣  Checking for console.log in code..."
CONSOLE_LOGS=$(grep -r "console\.log" src/ functions/src/ --exclude-dir=node_modules 2>/dev/null | wc -l)
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    echo "   ⚠️  Found $CONSOLE_LOGS console.log statements"
    echo "      Consider removing before production"
else
    echo "   ✅ No console.log found"
fi

# 5. Check HTTPS usage
echo ""
echo "5️⃣  Checking for HTTP (non-HTTPS) usage..."
if grep -r "http://" src/ --exclude-dir=node_modules 2>/dev/null | grep -v "localhost\|127.0.0.1"; then
    echo "   ⚠️  HTTP URLs found (should use HTTPS)"
else
    echo "   ✅ No HTTP URLs found"
fi

# 6. Check TypeScript strict mode
echo ""
echo "6️⃣  Checking TypeScript configuration..."
if grep -q '"strict": true' tsconfig.json 2>/dev/null; then
    echo "   ✅ TypeScript strict mode enabled"
else
    echo "   ⚠️  Consider enabling TypeScript strict mode"
fi

# 7. Check environment variables
echo ""
echo "7️⃣  Checking environment variable usage..."
if [ -f ".env.example" ]; then
    echo "   ✅ .env.example found"
else
    echo "   ⚠️  No .env.example file found"
fi

# 8. Verify .gitignore
echo ""
echo "8️⃣  Checking .gitignore..."
REQUIRED_IGNORES=(".env" "functions/.env" "*.key" "*.pem")
for item in "${REQUIRED_IGNORES[@]}"; do
    if grep -q "$item" .gitignore 2>/dev/null; then
        echo "   ✅ $item is ignored"
    else
        echo "   ❌ $item NOT in .gitignore!"
    fi
done

echo ""
echo "🛡️  Security Audit Complete"
echo ""
echo "📋 Recommendations:"
echo "   1. Use security-auditor agent for detailed code review"
echo "   2. Review Firestore security rules before deployment"
echo "   3. Test payment security with Stripe test mode"
echo "   4. Enable Firebase App Check for production"
echo "   5. Set up Firebase Security Rules unit tests"
```

## Deep Security Review

For a comprehensive security review, use the security-auditor agent:

```
> Use the security-auditor agent to perform a complete security audit focusing on:
> 1. Firestore security rules
> 2. Cloud Functions authentication
> 3. Payment flow security
> 4. Webhook signature verification
> 5. Input validation
```

## Security Checklist

- [ ] All API keys in environment variables
- [ ] No secrets in git history
- [ ] Firestore rules tested and secure
- [ ] Cloud Functions validate authentication
- [ ] Payment webhooks verify signatures
- [ ] Input sanitization on all user data
- [ ] HTTPS enforced everywhere
- [ ] CORS configured correctly
- [ ] Rate limiting on sensitive endpoints
- [ ] User can delete their account (GDPR)
- [ ] Privacy policy accessible
- [ ] Error messages don't leak info
- [ ] npm audit shows no critical issues
- [ ] Firebase App Check enabled (production)
