# Production Deployment Checklist

Complete checklist for deploying the queue management system to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Security Verification](#security-verification)
4. [Database Configuration](#database-configuration)
5. [Cloud Functions Setup](#cloud-functions-setup)
6. [Frontend Build](#frontend-build)
7. [Deployment Steps](#deployment-steps)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Monitoring Setup](#monitoring-setup)
10. [Rollback Plan](#rollback-plan)

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] Linting clean (`npm run lint`)
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] No console.log statements in production code
- [ ] No TODO/FIXME comments in critical paths
- [ ] Code reviewed and approved
- [ ] Git branch merged to main

### Documentation
- [ ] README.md updated
- [ ] API_DOCUMENTATION.md complete
- [ ] TESTING_GUIDE.md complete
- [ ] SETUP_FCM.md complete
- [ ] Changelog updated

### Dependencies
- [ ] All npm packages up to date
- [ ] No security vulnerabilities (`npm audit`)
- [ ] Production dependencies reviewed
- [ ] Lock files committed (package-lock.json)

---

## Environment Configuration

### Firebase Project Setup

1. **Verify Firebase Project**
   ```bash
   firebase projects:list
   firebase use production  # or your production project alias
   ```

2. **Environment Variables (.env)**
   ```bash
   # Frontend (.env)
   VITE_FIREBASE_API_KEY=your_production_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   VITE_FIREBASE_VAPID_KEY=your_vapid_key
   ```

3. **Cloud Functions Secrets (functions/.env)**
   ```bash
   STRIPE_SECRET_KEY=sk_live_your_live_key  # NOT TEST KEY
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

4. **Set Firebase Secrets**
   ```bash
   cd functions
   firebase functions:secrets:set STRIPE_SECRET_KEY
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
   ```

### Checklist
- [ ] Production Firebase project created
- [ ] .env file configured with production values
- [ ] VAPID key generated and added to .env
- [ ] Stripe live keys configured (NOT test keys)
- [ ] Stripe webhook secret configured
- [ ] Firebase secrets set for Cloud Functions
- [ ] No secrets committed to git

---

## Security Verification

### Authentication
- [ ] Firebase Auth enabled for production project
- [ ] Email/password provider enabled
- [ ] Google sign-in configured (optional)
- [ ] Anonymous sign-in enabled
- [ ] Password reset email templates configured
- [ ] Authorized domains configured

### Firestore Security Rules
- [ ] Rules reviewed and tested
- [ ] Default deny policy in place
- [ ] User authentication required for sensitive data
- [ ] Role-based access control working
- [ ] Run security rules test:
   ```bash
   firebase emulators:start --only firestore
   # Test rules with different user roles
   ```

### Cloud Functions
- [ ] All functions require authentication where needed
- [ ] Input validation on all callable functions
- [ ] Rate limiting considered for expensive operations
- [ ] CORS configured correctly
- [ ] Secrets not exposed in function code

### Stripe Integration
- [ ] Using live Stripe keys (sk_live_*)
- [ ] Webhook signature verification enabled
- [ ] Amount validation on server side
- [ ] No card data stored in Firestore
- [ ] PCI compliance verified

### Security Checklist
- [ ] Run security audit: `npm audit`
- [ ] No exposed secrets in code
- [ ] HTTPS only in production
- [ ] Service worker using production config
- [ ] FCM tokens properly secured

---

## Database Configuration

### Firestore Setup

1. **Initialize Collections**
   ```bash
   # No need to create collections manually
   # They will be created on first write
   ```

2. **Create Indexes**
   - Check `firestore.indexes.json`
   - Deploy indexes:
     ```bash
     firebase deploy --only firestore:indexes
     ```

3. **Deploy Security Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

### Required Indexes (firestore.indexes.json)
```json
{
  "indexes": [
    {
      "collectionGroup": "queue",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "branchId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "position", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "queue",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "loyaltyTransactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "read", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Checklist
- [ ] Firestore database created in production
- [ ] Indexes deployed
- [ ] Security rules deployed
- [ ] Test queries work with indexes

---

## Cloud Functions Setup

### Functions Configuration

1. **Review functions/package.json**
   - Ensure all dependencies listed
   - Check Node.js version (18+)

2. **Build Functions**
   ```bash
   cd functions
   npm install
   npm run build
   ```

3. **Test Functions Locally**
   ```bash
   firebase emulators:start --only functions,firestore
   # Test all callable functions
   ```

### Scheduled Functions

**checkExpiredTimers** - Runs every 1 minute
- [ ] Schedule configured in functions/src/scheduled/checkExpiredTimers.ts
- [ ] Cloud Scheduler API enabled in GCP
- [ ] Function deployed and running

### Checklist
- [ ] All functions build successfully
- [ ] Functions tested in emulators
- [ ] Cloud Scheduler API enabled
- [ ] Secrets configured for functions
- [ ] Functions region configured (us-central1)
- [ ] Memory limits appropriate (512MB default)
- [ ] Timeout settings appropriate (540s for scheduled)

---

## Frontend Build

### Build Configuration

1. **Update vite.config.ts**
   ```typescript
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';
   import path from 'path';

   export default defineConfig({
     plugins: [react()],
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
     build: {
       sourcemap: false,  // Disable for production
       minify: 'terser',
       terserOptions: {
         compress: {
           drop_console: true,  // Remove console.log
           drop_debugger: true,
         },
       },
     },
   });
   ```

2. **Build Frontend**
   ```bash
   npm run build
   ```

3. **Test Build Locally**
   ```bash
   npx vite preview
   ```

### Service Worker

- [ ] `public/firebase-messaging-sw.js` using production config
- [ ] Service worker registered in production
- [ ] Service worker scope correct

### Checklist
- [ ] Build successful
- [ ] Build size reasonable (<2MB)
- [ ] console.log statements removed
- [ ] Source maps disabled (or uploaded to error tracking)
- [ ] Service worker configured for production
- [ ] favicon and manifest.json present

---

## Deployment Steps

### 1. Deploy Firebase Services

```bash
# 1. Deploy Firestore rules and indexes
firebase deploy --only firestore

# 2. Deploy Cloud Functions
firebase deploy --only functions

# 3. Deploy Hosting (frontend)
firebase deploy --only hosting

# Or deploy everything
firebase deploy
```

### 2. Verify Deployment

```bash
# Check deployment status
firebase projects:list

# View deployed functions
firebase functions:list

# View hosting URL
firebase hosting:sites:list
```

### 3. Monitor Deployment

```bash
# View function logs
firebase functions:log --only checkExpiredTimers
firebase functions:log --only takeTicketHTTP

# View hosting traffic
# Go to Firebase Console > Hosting
```

### Deployment Checklist
- [ ] Firestore rules deployed
- [ ] Firestore indexes deployed
- [ ] All Cloud Functions deployed (11 total)
- [ ] Frontend deployed to Hosting
- [ ] Deployment completed without errors
- [ ] Deployment URL accessible

---

## Post-Deployment Verification

### Smoke Tests

1. **Test User Registration**
   - [ ] Create new user account
   - [ ] Verify user in Firestore `users` collection
   - [ ] Check custom claims assigned
   - [ ] Verify FCM token saved

2. **Test Queue Flow**
   - [ ] Client can take ticket
   - [ ] Ticket appears in Firestore `queue` collection
   - [ ] Position calculated correctly
   - [ ] Barber can advance queue
   - [ ] Notifications sent
   - [ ] Timer starts on notification
   - [ ] Client can mark arrival
   - [ ] Barber can complete service
   - [ ] Loyalty points awarded

3. **Test Push Notifications**
   - [ ] Permission banner shows
   - [ ] Permission can be granted
   - [ ] Foreground notifications work
   - [ ] Background notifications work
   - [ ] Notification history displays
   - [ ] Multi-device notifications work

4. **Test Barber Dashboard**
   - [ ] Queue displays correctly
   - [ ] Advance queue works
   - [ ] Complete ticket works
   - [ ] Cancel ticket works
   - [ ] Real-time updates work

5. **Test Admin Functions**
   - [ ] Franchises CRUD works
   - [ ] Branches CRUD works
   - [ ] Barbers CRUD works
   - [ ] Services CRUD works

6. **Test Payments (if applicable)**
   - [ ] Payment intent creation works
   - [ ] Webhook signature verification works
   - [ ] Payment success updates Firestore
   - [ ] Payment failure handled gracefully

### Performance Tests

- [ ] Page load time < 3 seconds
- [ ] Time to interactive < 5 seconds
- [ ] Lighthouse score > 90
- [ ] Mobile responsive on all devices
- [ ] No console errors in production

### Load Tests (Optional)

```bash
# Use Apache Bench or similar
ab -n 1000 -c 10 https://your-app.web.app/
```

### Monitoring Tests

- [ ] Firebase Analytics tracking events
- [ ] Performance Monitoring collecting data
- [ ] Error tracking capturing errors
- [ ] Function logs appearing in console

---

## Monitoring Setup

### Firebase Console

1. **Enable Firebase Analytics**
   - Go to Firebase Console > Analytics
   - Enable Google Analytics
   - Link to existing GA4 property or create new

2. **Enable Performance Monitoring**
   - Go to Firebase Console > Performance
   - Enable Performance Monitoring
   - Add to frontend if not already present

3. **Set Up Alerts**
   - Go to Firebase Console > Alerts
   - Create alert for:
     - Function errors > 10/hour
     - Function execution time > 10s
     - Hosting 5xx errors > 5/hour

### Cloud Functions Monitoring

1. **View Metrics**
   ```bash
   # Go to GCP Console > Cloud Functions
   # View metrics for each function:
   # - Invocations
   # - Execution time
   # - Memory usage
   # - Errors
   ```

2. **Set Up Cloud Monitoring**
   - Create uptime checks for critical functions
   - Set up alerting policies
   - Configure notification channels (email, Slack)

### Error Tracking

1. **Sentry (Optional)**
   ```bash
   npm install @sentry/react @sentry/tracing
   ```

   ```typescript
   // src/main.tsx
   import * as Sentry from "@sentry/react";

   Sentry.init({
     dsn: "your-sentry-dsn",
     environment: "production",
     tracesSampleRate: 0.1,
   });
   ```

2. **Firebase Crashlytics (Mobile)**
   - Enable in Firebase Console
   - Add to Capacitor apps

### Checklist
- [ ] Firebase Analytics enabled
- [ ] Performance Monitoring enabled
- [ ] Alerts configured
- [ ] Error tracking set up
- [ ] Uptime monitoring configured
- [ ] Log aggregation set up

---

## Rollback Plan

### Quick Rollback Steps

1. **Rollback Hosting**
   ```bash
   # View deployment history
   firebase hosting:releases:list

   # Rollback to specific version
   firebase hosting:rollback
   ```

2. **Rollback Functions**
   ```bash
   # Redeploy previous version from git
   git checkout previous-tag
   firebase deploy --only functions
   ```

3. **Rollback Firestore Rules**
   ```bash
   # Edit firestore.rules to previous version
   git checkout previous-tag -- firestore.rules
   firebase deploy --only firestore:rules
   ```

### Emergency Contacts

- **Firebase Support**: https://firebase.google.com/support
- **Stripe Support**: https://support.stripe.com
- **Development Team**: [Your team contact]

### Incident Response

1. **Detect Issue**
   - Monitor alerts
   - Check error logs
   - User reports

2. **Assess Impact**
   - How many users affected?
   - Is data at risk?
   - Can users continue?

3. **Mitigate**
   - Rollback if critical
   - Apply hotfix if minor
   - Communicate to users

4. **Post-Mortem**
   - Document what happened
   - Identify root cause
   - Prevent future occurrences

### Checklist
- [ ] Rollback procedure documented
- [ ] Emergency contacts updated
- [ ] Incident response plan in place
- [ ] Backup strategy defined

---

## Final Production Checklist

### Before Going Live
- [ ] All smoke tests passed
- [ ] Performance tests passed
- [ ] Security audit completed
- [ ] Monitoring enabled
- [ ] Alerts configured
- [ ] Rollback plan ready
- [ ] Team notified
- [ ] Users notified (if migration)

### Day 1 After Launch
- [ ] Monitor error rates
- [ ] Check function execution times
- [ ] Verify analytics tracking
- [ ] Review user feedback
- [ ] Check Firestore costs
- [ ] Verify notifications sending

### Week 1 After Launch
- [ ] Review performance metrics
- [ ] Analyze user behavior
- [ ] Check cost projections
- [ ] Optimize slow queries
- [ ] Address user feedback
- [ ] Plan next features

---

## Cost Optimization

### Firestore
- [ ] Review read/write operations
- [ ] Optimize queries with indexes
- [ ] Implement pagination where needed
- [ ] Use real-time listeners sparingly

### Cloud Functions
- [ ] Review cold start times
- [ ] Optimize memory usage
- [ ] Use appropriate timeouts
- [ ] Consider min/max instances for high-traffic functions

### Cloud Storage
- [ ] Review storage usage
- [ ] Implement lifecycle policies
- [ ] Optimize image sizes

### Monitoring
- [ ] Set up budget alerts in GCP
- [ ] Review costs daily first week
- [ ] Identify expensive operations
- [ ] Optimize as needed

---

## Appendix

### Useful Commands

```bash
# Check Firebase project
firebase projects:list

# Switch project
firebase use production

# Deploy specific service
firebase deploy --only hosting
firebase deploy --only functions:takeTicketHTTP
firebase deploy --only firestore:rules

# View logs
firebase functions:log
firebase functions:log --only functionName

# View hosting releases
firebase hosting:releases:list

# Rollback hosting
firebase hosting:rollback

# Delete specific function
firebase functions:delete functionName

# View function config
firebase functions:config:get

# Set function config
firebase functions:config:set stripe.secret_key="sk_live_xxx"

# Test locally
firebase emulators:start

# Run specific emulators
firebase emulators:start --only functions,firestore
```

### Firebase Console URLs

- **Project Overview**: https://console.firebase.google.com/project/YOUR_PROJECT_ID
- **Authentication**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/authentication
- **Firestore**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore
- **Cloud Functions**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/functions
- **Hosting**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/hosting
- **Analytics**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/analytics

### GCP Console URLs

- **Cloud Functions**: https://console.cloud.google.com/functions
- **Cloud Scheduler**: https://console.cloud.google.com/cloudscheduler
- **Monitoring**: https://console.cloud.google.com/monitoring
- **Billing**: https://console.cloud.google.com/billing

---

## Support and Resources

- **Firebase Documentation**: https://firebase.google.com/docs
- **Stripe Documentation**: https://stripe.com/docs
- **Capacitor Documentation**: https://capacitorjs.com/docs
- **React Documentation**: https://react.dev
- **Project README**: README.md
- **API Documentation**: API_DOCUMENTATION.md
- **Testing Guide**: TESTING_GUIDE.md

---

**Last Updated**: 2025-01-XX
**Version**: 1.0.0
**Maintained By**: Development Team
