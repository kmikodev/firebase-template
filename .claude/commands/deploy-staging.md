# Deploy to Staging

Deploys the application to Firebase staging environment with all necessary checks.

## Command

```bash
# Switch to staging project
firebase use staging

# Run tests
npm test

# Build application
npm run build

# Build Cloud Functions
cd functions && npm run build && cd ..

# Deploy to staging
firebase deploy --project staging

# Show deployment URL
echo "✅ Deployed to staging!"
firebase hosting:channel:list
```

## Post-Deployment

After deployment, run smoke tests:
1. Visit staging URL
2. Test authentication flow
3. Test payment with test card: 4242 4242 4242 4242
4. Check Firebase console for errors

## Rollback

If issues found:
```bash
firebase hosting:rollback --project staging
```
