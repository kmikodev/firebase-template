# CLAUDE.md

This file provides guidance to Claude Code when working with this Firebase + Capacitor project.

## Project Overview

**Stack**: React + TypeScript + Tailwind CSS + Firebase + Capacitor
**Type**: Serverless mobile-first application with payment integration

### Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Build Tool**: Vite
- **Backend**: Firebase (Firestore, Auth, Cloud Functions, Hosting, Storage)
- **Mobile**: Capacitor (iOS + Android)
- **Payments**: Stripe
- **Testing**: Vitest + React Testing Library
- **CI/CD**: GitHub Actions

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add Firebase config and Stripe keys

# Start development
npm run dev                      # Frontend dev server
npm run firebase:emulators       # Firebase emulators (in another terminal)

# Build and deploy
npm run build                    # Build for production
firebase deploy                  # Deploy to Firebase
```

## Project Structure

```
my-firebase-app/
├── src/                         # React frontend
│   ├── components/              # React components
│   │   ├── auth/                # Authentication components
│   │   ├── payment/             # Payment components
│   │   ├── ui/                  # Reusable UI components
│   │   └── layout/              # Layout components
│   ├── hooks/                   # Custom React hooks
│   ├── services/                # Firebase service integrations
│   │   ├── auth.ts              # Firebase Auth service
│   │   ├── firestore.ts         # Firestore service
│   │   └── storage.ts           # Storage service
│   ├── lib/                     # Utility functions
│   ├── types/                   # TypeScript type definitions
│   └── App.tsx                  # Main app component
├── functions/                   # Cloud Functions (TypeScript)
│   └── src/
│       ├── index.ts             # Functions entry point
│       ├── payments.ts          # Stripe payment handlers
│       └── triggers.ts          # Firestore triggers
├── public/                      # Static assets
├── capacitor/                   # Native mobile projects
├── .claude/                     # Claude Code configuration
│   ├── agents/                  # Specialized AI agents
│   ├── commands/                # Custom slash commands
│   ├── output-styles/           # Communication styles
│   └── hooks/                   # Automation hooks
└── firebase.json                # Firebase configuration
```

## Development Commands

```bash
# Frontend Development
npm run dev                      # Start dev server (http://localhost:5173)
npm run build                    # Build for production
npm run preview                  # Preview production build
npm test                         # Run tests
npm test:ui                      # Run tests with UI
npm run lint                     # Lint code
npm run lint:fix                 # Fix linting issues
npm run format                   # Format code with Prettier

# Firebase
npm run firebase:emulators       # Start all emulators
firebase deploy                  # Deploy everything
firebase deploy --only hosting   # Deploy hosting only
firebase deploy --only functions # Deploy functions only
firebase deploy --only firestore:rules # Deploy security rules

# Cloud Functions
cd functions
npm run build                    # Build functions
npm run serve                    # Test functions locally
npm test                         # Test functions

# Capacitor (Mobile)
npm run capacitor:sync           # Sync web app with native projects
npm run capacitor:ios            # Open Xcode
npm run capacitor:android        # Open Android Studio
npm run capacitor:build          # Build web + sync
```

## Code Style & Conventions

### React Components

- Use **functional components** with hooks
- Use **TypeScript** for all components
- File naming: `ComponentName.tsx` (PascalCase)
- Export format: `export default ComponentName`

```typescript
// Good example
interface PaymentButtonProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: Error) => void;
}

export default function PaymentButton({
  amount,
  onSuccess,
  onError
}: PaymentButtonProps) {
  // Component logic
  return (
    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
      Pay ${amount / 100}
    </button>
  );
}
```

### Tailwind CSS

- Use Tailwind utility classes (avoid custom CSS when possible)
- Mobile-first approach: `className="text-sm md:text-base lg:text-lg"`
- Common patterns:
  - Buttons: `btn btn-primary` (configured in tailwind.config.js)
  - Cards: `bg-white rounded-lg shadow-md p-4`
  - Forms: `input input-bordered w-full`

### State Management

- **Local state**: `useState` for component-specific state
- **Context**: React Context for auth and theme
- **Firebase**: Real-time listeners for Firestore data
- **React Query**: For server state (optional, can be added)

### Firebase Integration

```typescript
// firestore.ts
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './config';

export function subscribeToUserData(userId: string, callback: (data: any) => void) {
  const q = query(collection(db, 'users'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
}
```

### Cloud Functions

- Always use **TypeScript**
- Validate all inputs
- Check authentication
- Handle errors properly
- Use environment variables for secrets

```typescript
import { onCall, HttpsError } from 'firebase-functions/v2/https';

export const myFunction = onCall(async (request) => {
  // 1. Check authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  // 2. Validate input
  const { data } = request.data;
  if (!data) {
    throw new HttpsError('invalid-argument', 'Data is required');
  }

  // 3. Business logic
  try {
    // ... implementation
    return { success: true };
  } catch (error) {
    console.error('Function failed:', error);
    throw new HttpsError('internal', 'Operation failed');
  }
});
```

## AI Agents Available

### Planning Phase
- **firebase-architect**: Design system architecture, data models, security rules
- **requirements-analyst**: Gather requirements, write user stories
- **tech-researcher**: Research libraries and best practices

### Development Phase
- **code-reviewer**: Review code quality, security, Firebase best practices
- **test-writer**: Write unit and integration tests
- **cloud-functions-specialist**: Implement Cloud Functions, especially payments

### Testing Phase
- **qa-specialist**: Manual testing, test plans, bug reports
- **security-auditor**: Security audit, especially for payment flows

### Deployment Phase
- **firebase-deployer**: Handle deployments, CI/CD setup
- **documentation-writer**: Create technical and user documentation

### How to Use Agents

```
> Use the firebase-architect agent to design a user authentication flow

> Use the code-reviewer agent to review my recent payment implementation

> Use the security-auditor agent to audit the payment security
```

## Custom Slash Commands

- **/deploy-staging** - Deploy to staging environment with checks
- **/deploy-production** - Deploy to production with full validation
- **/test-payment-flow** - Guide for testing payment integration
- **/security-audit** - Run comprehensive security checks
- **/build-mobile** - Build iOS and Android apps

## Key Firebase Patterns

### Authentication

```typescript
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from './config';

// Sign in
const userCredential = await signInWithEmailAndPassword(auth, email, password);

// Listen to auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
  } else {
    // User is signed out
  }
});
```

### Firestore Real-time

```typescript
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './config';

// Real-time listener
const unsubscribe = onSnapshot(doc(db, 'users', userId), (doc) => {
  console.log('Current data:', doc.data());
});

// Don't forget to unsubscribe!
return () => unsubscribe();
```

### Payment Flow

1. **Client**: Call `createPaymentIntent` Cloud Function
2. **Server**: Create Stripe Payment Intent, return client secret
3. **Client**: Use Stripe SDK with client secret
4. **Stripe**: Process payment
5. **Webhook**: Stripe notifies Cloud Function
6. **Server**: Update Firestore with payment status
7. **Client**: Real-time listener updates UI

## Security Best Practices

1. **Never store payment data in Firestore** - Only store Stripe customer ID
2. **Validate on server** - Never trust client-side data
3. **Use environment variables** - No secrets in code
4. **Verify webhook signatures** - Critical for Stripe webhooks
5. **Check authentication** - In all Cloud Functions
6. **Firestore security rules** - Deny by default, allow explicitly
7. **Input sanitization** - Validate all user inputs

## Testing Strategy

### Unit Tests (Vitest)
- Test React components: `npm test`
- Test Cloud Functions: `cd functions && npm test`
- Coverage goal: 80%+ for business logic

### Integration Tests
- Use Firebase emulators
- Test with Stripe test mode
- Test payment webhooks

### E2E Tests (Optional)
- Playwright or Cypress
- Test critical flows: auth + payment

## Deployment Strategy

### Environments
- **Development**: Local emulators
- **Staging**: Firebase project `my-app-staging`
- **Production**: Firebase project `my-app-prod`

### Deployment Checklist
1. All tests passing
2. Security audit complete
3. Build successful
4. Environment variables configured
5. Test in staging first
6. Monitor logs after production deploy

## Performance Optimization

- **Bundle size**: Keep < 500KB (check with `npm run build`)
- **Images**: Use WebP, lazy loading
- **Firestore**: Minimize reads with pagination
- **Functions**: Keep dependencies small (faster cold starts)
- **Caching**: Use Firebase Hosting cache headers

## Mobile Considerations

- **Offline-first**: Firestore persistence enabled
- **Touch targets**: Minimum 44x44 pixels
- **Loading states**: Show for all network operations
- **Error handling**: User-friendly messages
- **Native features**: Camera, notifications via Capacitor

## Common Patterns

### Loading State
```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await someAsyncOperation();
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

### Error Handling
```typescript
try {
  await operation();
} catch (error) {
  if (error instanceof FirebaseError) {
    // Handle Firebase errors
    toast.error(error.message);
  } else {
    // Handle other errors
    toast.error('An unexpected error occurred');
  }
}
```

### Form Validation
```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const result = schema.safeParse(formData);
if (!result.success) {
  // Handle validation errors
}
```

## Troubleshooting

### Firebase Emulator Issues
```bash
# Kill all emulators
lsof -ti:4000,5000,8080,9099 | xargs kill -9

# Restart
npm run firebase:emulators
```

### Build Failures
```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

### Payment Testing
- Use Stripe test cards: https://stripe.com/docs/testing
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002

## Resources

- [Firebase Docs](https://firebase.google.com/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Capacitor Docs](https://capacitorjs.com)
- [Stripe Docs](https://stripe.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## Getting Help

1. Check this CLAUDE.md file
2. Use relevant AI agent for specific tasks
3. Check Firebase console for errors
4. Review Cloud Functions logs: `firebase functions:log`
5. Use `/security-audit` command before releases
