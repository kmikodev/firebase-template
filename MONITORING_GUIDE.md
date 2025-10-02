# Monitoring & Analytics Guide

Complete guide for monitoring and analytics setup for the queue management system.

## Table of Contents

1. [Firebase Analytics Setup](#firebase-analytics-setup)
2. [Performance Monitoring](#performance-monitoring)
3. [Error Tracking](#error-tracking)
4. [Cloud Functions Monitoring](#cloud-functions-monitoring)
5. [Custom Events Tracking](#custom-events-tracking)
6. [Alerts & Notifications](#alerts--notifications)
7. [Dashboard Setup](#dashboard-setup)
8. [Cost Monitoring](#cost-monitoring)

---

## Firebase Analytics Setup

### 1. Enable Firebase Analytics

Firebase Analytics is already enabled in this project. Verify in Firebase Console:

```
https://console.firebase.google.com/project/comprakitsupervivencia/analytics
```

### 2. Analytics Configuration

Analytics is initialized in `src/lib/firebase.ts`:

```typescript
import { getAnalytics } from 'firebase/analytics';

export const analytics = getAnalytics(app);
```

### 3. Key Events to Track

#### User Events
- `sign_up` - User registration
- `login` - User login
- `logout` - User logout

#### Queue Events
- `ticket_taken` - Client takes a ticket
- `ticket_cancelled` - Client cancels ticket
- `ticket_completed` - Service completed
- `arrival_marked` - Client marks arrival
- `queue_advanced` - Barber advances queue

#### Business Events
- `payment_initiated` - Payment started (if implemented)
- `payment_completed` - Payment successful
- `payment_failed` - Payment failed

#### Engagement Events
- `page_view` - Page navigation
- `notification_received` - Push notification received
- `notification_clicked` - Push notification clicked

### 4. Event Parameters

Standard parameters for all events:
- `user_id` - Firebase user ID
- `user_role` - User role (admin, barber, client)
- `branch_id` - Branch where action occurred
- `timestamp` - Event timestamp

---

## Performance Monitoring

### 1. Enable Performance Monitoring

Already configured in `src/lib/firebase.ts`:

```typescript
import { getPerformance } from 'firebase/performance';

export const perf = getPerformance(app);
```

### 2. What Performance Monitoring Tracks Automatically

- **Page Load Time** - Time to first render
- **Network Requests** - API call performance
- **Resource Loading** - JS/CSS/image load times

### 3. Custom Traces

Add custom traces for critical operations:

```typescript
import { trace } from 'firebase/performance';
import { perf } from '@/lib/firebase';

// Example: Track queue operation performance
const queueTrace = trace(perf, 'take_ticket_operation');
queueTrace.start();

try {
  await takeTicket({ branchId, userId });
  queueTrace.putMetric('success', 1);
} catch (error) {
  queueTrace.putMetric('error', 1);
} finally {
  queueTrace.stop();
}
```

### 4. Network Request Monitoring

Performance Monitoring automatically tracks:
- Firestore reads/writes
- Cloud Functions calls
- Storage operations

### 5. Performance Targets

**Page Load Performance:**
- Time to Interactive: < 3 seconds
- First Contentful Paint: < 1.5 seconds
- Largest Contentful Paint: < 2.5 seconds

**API Performance:**
- takeTicket: < 2 seconds
- advanceQueue: < 1 second
- markArrival: < 1 second
- Cloud Functions: < 3 seconds

**Firestore Performance:**
- Single document read: < 100ms
- Query (< 50 docs): < 500ms
- Write operation: < 500ms

---

## Error Tracking

### 1. Console Errors

All errors are logged to Firebase Console automatically via Cloud Functions logger.

### 2. Frontend Error Boundary

Create error boundary for React (optional but recommended):

```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logEvent } from 'firebase/analytics';
import { analytics } from '@/lib/firebase';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Log to Firebase Analytics
    logEvent(analytics, 'exception', {
      description: error.message,
      fatal: true,
      stack: error.stack,
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Oops! Algo salió mal
            </h1>
            <p className="text-gray-600 mb-6">
              Ha ocurrido un error inesperado. Por favor, recarga la página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 3. Cloud Functions Error Tracking

Errors are automatically logged to Cloud Logging:

```typescript
import { logger } from 'firebase-functions/v2';

try {
  // operation
} catch (error) {
  logger.error('Error in function', { error, context: 'additional info' });
  throw error; // Re-throw to mark function as failed
}
```

View logs:
```
https://console.cloud.google.com/logs
```

### 4. Error Alerts

Set up error alerts in Cloud Monitoring:
1. Go to Cloud Console > Monitoring > Alerting
2. Create alert policy for:
   - Function error rate > 5%
   - Function timeout rate > 1%
   - 5xx HTTP errors > 10/hour

---

## Cloud Functions Monitoring

### 1. Built-in Metrics

Firebase automatically tracks:
- **Invocations** - Number of function calls
- **Execution time** - Duration of each call
- **Memory usage** - RAM consumption
- **Active instances** - Number of running instances
- **Error rate** - Percentage of failed invocations

### 2. View Function Metrics

**Firebase Console:**
```
https://console.firebase.google.com/project/comprakitsupervivencia/functions
```

**Cloud Console (more detailed):**
```
https://console.cloud.google.com/functions/list
```

### 3. Important Metrics to Watch

#### takeTicketHTTP
- Target: < 2s execution time
- Watch: Error rate should be < 1%
- Alert: If invocations spike unexpectedly

#### advanceQueueHTTP
- Target: < 1s execution time
- Watch: Should complete successfully > 99% of the time

#### checkExpiredTimers (Scheduled)
- Runs: Every 1 minute
- Watch: Execution time should be consistent
- Alert: If errors occur

#### onQueueCreate / onQueueUpdate (Triggers)
- Watch: Should complete within 5 seconds
- Alert: If causing backlog in Firestore writes

### 4. Function Logs

View real-time logs:
```bash
# All functions
firebase functions:log

# Specific function
firebase functions:log --only takeTicketHTTP

# Last 100 lines
firebase functions:log --lines 100

# Follow mode (real-time)
firebase functions:log --lines 0
```

### 5. Custom Metrics

Add custom metrics to track business logic:

```typescript
import { logger } from 'firebase-functions/v2';

// Log with structured data
logger.info('Queue advanced', {
  branchId,
  ticketNumber,
  waitTime: estimatedWaitMinutes,
  queueLength: tickets.length,
});

// These logs can be queried and graphed in Cloud Logging
```

---

## Custom Events Tracking

### 1. Analytics Helper Service

Create `src/services/analyticsService.ts`:

```typescript
import { logEvent } from 'firebase/analytics';
import { analytics } from '@/lib/firebase';

export const analyticsService = {
  // Queue Events
  trackTicketTaken(branchId: string, ticketNumber: string, position: number) {
    logEvent(analytics, 'ticket_taken', {
      branch_id: branchId,
      ticket_number: ticketNumber,
      position,
      timestamp: Date.now(),
    });
  },

  trackTicketCancelled(queueId: string, reason: string) {
    logEvent(analytics, 'ticket_cancelled', {
      queue_id: queueId,
      reason,
      timestamp: Date.now(),
    });
  },

  trackTicketCompleted(queueId: string, duration: number) {
    logEvent(analytics, 'ticket_completed', {
      queue_id: queueId,
      duration_minutes: duration,
      timestamp: Date.now(),
    });
  },

  trackArrivalMarked(queueId: string, waitTime: number) {
    logEvent(analytics, 'arrival_marked', {
      queue_id: queueId,
      wait_time_minutes: waitTime,
      timestamp: Date.now(),
    });
  },

  trackQueueAdvanced(branchId: string, queueLength: number) {
    logEvent(analytics, 'queue_advanced', {
      branch_id: branchId,
      queue_length: queueLength,
      timestamp: Date.now(),
    });
  },

  // User Events
  trackSignUp(method: string) {
    logEvent(analytics, 'sign_up', {
      method,
      timestamp: Date.now(),
    });
  },

  trackLogin(method: string) {
    logEvent(analytics, 'login', {
      method,
      timestamp: Date.now(),
    });
  },

  // Notification Events
  trackNotificationReceived(type: string) {
    logEvent(analytics, 'notification_received', {
      notification_type: type,
      timestamp: Date.now(),
    });
  },

  trackNotificationClicked(type: string) {
    logEvent(analytics, 'notification_clicked', {
      notification_type: type,
      timestamp: Date.now(),
    });
  },

  // Page Views
  trackPageView(pageName: string) {
    logEvent(analytics, 'page_view', {
      page_name: pageName,
      timestamp: Date.now(),
    });
  },

  // Errors
  trackError(error: string, context: string) {
    logEvent(analytics, 'exception', {
      description: error,
      fatal: false,
      context,
      timestamp: Date.now(),
    });
  },
};
```

### 2. Integrate Analytics in Components

**Example: Track ticket taken in ClientQueue:**

```typescript
import { analyticsService } from '@/services/analyticsService';

const handleTakeTicket = async () => {
  try {
    const result = await takeTicket({ branchId });

    // Track event
    analyticsService.trackTicketTaken(
      branchId,
      result.ticketNumber,
      result.position
    );
  } catch (err) {
    analyticsService.trackError(err.message, 'take_ticket');
  }
};
```

### 3. Track Page Views

**Add to each page component:**

```typescript
import { useEffect } from 'react';
import { analyticsService } from '@/services/analyticsService';

export default function ClientQueue() {
  useEffect(() => {
    analyticsService.trackPageView('client_queue');
  }, []);

  // ... rest of component
}
```

---

## Alerts & Notifications

### 1. Firebase Alerts

Set up in Firebase Console > Alerts:

**Performance Alerts:**
- Web page load time > 5s (P90)
- API response time > 3s (P95)

**Crashlytics Alerts (Mobile):**
- New crash types detected
- Crash rate > 1%

### 2. Cloud Monitoring Alerts

Set up in GCP Console > Monitoring > Alerting:

**Function Alerts:**
```yaml
Alert: High Function Error Rate
Condition: Error rate > 5% for 5 minutes
Threshold: 5%
Notification: Email + Slack

Alert: Function Timeout
Condition: Execution time > 30s
Threshold: 30 seconds
Notification: Email

Alert: High Function Invocations
Condition: Invocations > 10000/hour
Threshold: 10000
Notification: Email (potential abuse)
```

**Cost Alerts:**
```yaml
Alert: Budget Threshold
Condition: Projected spend > $50/month
Threshold: $50
Notification: Email + SMS
```

**Firestore Alerts:**
```yaml
Alert: High Read Rate
Condition: Reads > 100000/hour
Threshold: 100000
Notification: Email

Alert: High Write Rate
Condition: Writes > 50000/hour
Threshold: 50000
Notification: Email
```

### 3. Notification Channels

Configure notification channels:
1. **Email** - Primary alerts
2. **SMS** - Critical alerts only
3. **Slack** - Team notifications (optional)
4. **PagerDuty** - On-call rotation (optional)

---

## Dashboard Setup

### 1. Firebase Performance Dashboard

Access: `https://console.firebase.google.com/project/comprakitsupervivencia/performance`

**Key Metrics:**
- Page load times (P50, P90, P99)
- Network request duration
- Screen rendering performance

### 2. Firebase Analytics Dashboard

Access: `https://console.firebase.google.com/project/comprakitsupervivencia/analytics`

**Key Reports:**
- Events: See all custom events
- Conversions: Track key actions (ticket taken, service completed)
- User engagement: Daily/Monthly active users
- Retention: User retention cohorts

### 3. Cloud Functions Dashboard

Access: `https://console.cloud.google.com/functions/list`

**Key Metrics per Function:**
- Invocations over time
- Execution time (avg, P50, P95)
- Error rate percentage
- Memory usage
- Active instances

### 4. Custom Dashboard (Cloud Monitoring)

Create custom dashboard in GCP Console > Monitoring > Dashboards:

**Queue Operations Dashboard:**
```yaml
Widgets:
  - Tickets Taken (time series)
  - Tickets Completed (time series)
  - Average Wait Time (gauge)
  - Queue Length by Branch (bar chart)
  - Function Execution Times (line chart)
  - Error Rate (line chart)
```

### 5. Firestore Dashboard

Access: `https://console.firebase.google.com/project/comprakitsupervivencia/firestore`

**Monitor:**
- Document reads/writes per day
- Storage usage
- Index usage
- Rule evaluations

---

## Cost Monitoring

### 1. Set Up Budget Alerts

1. Go to GCP Console > Billing > Budgets & alerts
2. Create budget: $50/month (adjust as needed)
3. Set alerts at: 50%, 75%, 90%, 100%
4. Add notification email

### 2. Cost Breakdown

**Typical Monthly Costs (estimated):**

```
Firebase Hosting: $0 - $5
  - First 10GB/month free
  - Additional: $0.15/GB

Firestore: $0 - $20
  - Reads: 50k/day free, then $0.06/100k
  - Writes: 20k/day free, then $0.18/100k
  - Storage: 1GB free, then $0.18/GB

Cloud Functions: $0 - $30
  - 2M invocations/month free
  - 400k GB-seconds free
  - Additional: $0.40/M invocations

Cloud Storage: $0 - $5
  - 5GB free
  - Additional: $0.026/GB

FCM (Push Notifications): FREE
  - Unlimited notifications

Analytics: FREE
  - Unlimited events

Performance Monitoring: FREE
  - Standard tier
```

**Total Estimated: $0 - $60/month** (with moderate usage)

### 3. Cost Optimization Tips

**Firestore:**
- Use queries with indexes (avoid full collection scans)
- Implement pagination (limit queries to 50 docs)
- Cache frequently accessed data
- Use real-time listeners sparingly
- Clean up old data periodically

**Cloud Functions:**
- Optimize cold starts (keep functions warm if needed)
- Use appropriate memory allocation
- Set reasonable timeouts
- Batch operations when possible
- Use scheduled functions efficiently

**Cloud Storage:**
- Compress images before upload
- Set lifecycle policies to delete old files
- Use Cloud CDN for frequently accessed files

**Monitoring:**
- Review Cloud Logging costs (can grow large)
- Set log retention to 30 days
- Exclude verbose debug logs in production

### 4. Cost Monitoring Queries

**Top Expensive Operations (BigQuery - if enabled):**

```sql
-- Most expensive Firestore operations
SELECT
  operation_type,
  COUNT(*) as count,
  SUM(document_count) as total_docs
FROM firestore_usage
WHERE date > CURRENT_DATE() - 7
GROUP BY operation_type
ORDER BY total_docs DESC;

-- Most invoked functions
SELECT
  function_name,
  COUNT(*) as invocations,
  AVG(execution_time_ms) as avg_time_ms
FROM function_logs
WHERE date > CURRENT_DATE() - 7
GROUP BY function_name
ORDER BY invocations DESC;
```

---

## Monitoring Checklist

### Daily Monitoring (Automated)
- [ ] Function error rates < 1%
- [ ] Average response times within targets
- [ ] No critical alerts triggered
- [ ] Daily active users trend

### Weekly Review
- [ ] Review cost trends
- [ ] Check performance regressions
- [ ] Analyze top user events
- [ ] Review function execution times
- [ ] Check Firestore query performance

### Monthly Review
- [ ] Complete cost analysis
- [ ] Performance optimization opportunities
- [ ] User retention analysis
- [ ] Feature usage analytics
- [ ] Capacity planning

---

## Key Performance Indicators (KPIs)

### Technical KPIs
- **Uptime**: 99.9% target
- **API Response Time**: < 2s (P95)
- **Error Rate**: < 0.1%
- **Page Load Time**: < 3s (P90)

### Business KPIs
- **Daily Active Users**: Track growth
- **Tickets per Day**: Queue usage
- **Average Wait Time**: Service efficiency
- **Completion Rate**: Tickets completed / tickets taken
- **Cancellation Rate**: Should be < 10%
- **No-show Rate**: Should be < 5%

### User Experience KPIs
- **Time to Take Ticket**: < 10 seconds
- **Notification Delivery Rate**: > 95%
- **User Retention**: 7-day and 30-day
- **Feature Adoption**: % users using key features

---

## Resources

### Firebase Console Links
- **Analytics**: https://console.firebase.google.com/project/comprakitsupervivencia/analytics
- **Performance**: https://console.firebase.google.com/project/comprakitsupervivencia/performance
- **Functions**: https://console.firebase.google.com/project/comprakitsupervivencia/functions

### GCP Console Links
- **Cloud Functions**: https://console.cloud.google.com/functions
- **Monitoring**: https://console.cloud.google.com/monitoring
- **Logging**: https://console.cloud.google.com/logs
- **Billing**: https://console.cloud.google.com/billing

### Documentation
- **Firebase Analytics**: https://firebase.google.com/docs/analytics
- **Performance Monitoring**: https://firebase.google.com/docs/perf-mon
- **Cloud Monitoring**: https://cloud.google.com/monitoring/docs
- **Cloud Logging**: https://cloud.google.com/logging/docs

---

**Last Updated**: 2025-01-XX
**Version**: 1.0.0
**Maintained By**: Development Team
