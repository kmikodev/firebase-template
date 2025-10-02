# Deploy to Production

Deploys the application to Firebase production with comprehensive safety checks.

## Command

```bash
# Confirmation
echo "⚠️  PRODUCTION DEPLOYMENT"
echo "Have you:"
echo "  ✓ Tested in staging?"
echo "  ✓ Reviewed all code changes?"
echo "  ✓ Updated version number?"
echo "  ✓ Prepared rollback plan?"
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Switch to production
firebase use prod

# Run full test suite
echo "🧪 Running tests..."
npm test

# Security audit
echo "🛡️  Security audit..."
npm audit --production

# Build
echo "🔨 Building..."
npm run build

# Build Functions
echo "⚡ Building Cloud Functions..."
cd functions && npm run build && cd ..

# Deploy Firestore rules first
echo "🔒 Deploying security rules..."
firebase deploy --only firestore:rules,storage:rules --project prod

# Deploy Functions
echo "⚡ Deploying Cloud Functions..."
firebase deploy --only functions --project prod

# Deploy Hosting
echo "🌐 Deploying hosting..."
firebase deploy --only hosting --project prod

# Tag release
git tag -a "v$(date +%Y%m%d-%H%M%S)" -m "Production deployment"
git push --tags

echo "✅ Deployed to production!"
echo "🔍 Monitor logs: firebase functions:log --project prod"
```

## Post-Deployment Checklist

- [ ] Visit production URL
- [ ] Test login
- [ ] Test core feature
- [ ] Test payment with test card (in test mode)
- [ ] Monitor Firebase console for 15 minutes
- [ ] Check error logs
- [ ] Verify analytics
- [ ] Announce to team

## Emergency Rollback

```bash
firebase hosting:rollback --project prod
```
