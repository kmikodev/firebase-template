# My Firebase App

Serverless mobile-first application built with Firebase, React, Tailwind CSS, and Capacitor.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your Firebase config

# Start development server
npm run dev

# Start Firebase emulators (in another terminal)
npm run firebase:emulators
```

Visit http://localhost:5173

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Build**: Vite
- **Backend**: Firebase (Firestore, Auth, Functions, Storage, Hosting)
- **Mobile**: Capacitor (iOS + Android)
- **Payments**: Stripe
- **Testing**: Vitest + React Testing Library

## 📁 Project Structure

```
my-firebase-app/
├── src/                    # React application
│   ├── components/         # Reusable components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and Firebase config
│   └── types/              # TypeScript types
├── functions/              # Cloud Functions
├── .claude/                # AI agents and automation
│   ├── agents/             # Specialized AI agents
│   ├── commands/           # Custom slash commands
│   └── output-styles/      # Communication styles
├── public/                 # Static assets
└── capacitor/              # Native mobile projects
```

## 📝 Available Scripts

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm test                 # Run tests
npm run lint             # Lint code
npm run firebase:emulators  # Start Firebase emulators
npm run capacitor:sync   # Sync with Capacitor
```

## 🤖 AI Agents

This project includes specialized AI agents for the complete development lifecycle:

### Planning
- `firebase-architect` - System architecture and data modeling
- `requirements-analyst` - Requirements gathering and user stories
- `tech-researcher` - Technology research and recommendations

### Development
- `code-reviewer` - Code quality and security review
- `test-writer` - Test creation and coverage
- `cloud-functions-specialist` - Cloud Functions implementation

### Testing
- `qa-specialist` - Manual testing and QA
- `security-auditor` - Security audits (especially payments)

### Deployment
- `firebase-deployer` - Deployment and CI/CD
- `documentation-writer` - Technical documentation

**Usage**: `> Use the [agent-name] agent to [task]`

## 🎯 Custom Commands

- `/deploy-staging` - Deploy to staging with checks
- `/deploy-production` - Deploy to production (full validation)
- `/test-payment-flow` - Test payment integration
- `/security-audit` - Run security checks
- `/build-mobile` - Build iOS/Android apps

## 🔧 Configuration

See **CLAUDE.md** for comprehensive development guide including:
- Code conventions and best practices
- Firebase integration patterns
- Payment flow implementation
- Mobile build process
- Security guidelines

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with UI
npm test:ui

# Test Cloud Functions
cd functions && npm test
```

## 🚀 Deployment

```bash
# Deploy to Firebase
npm run build
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
```

## 📱 Mobile Build

```bash
# Build and sync
npm run capacitor:build

# Open in IDE
npm run capacitor:ios      # Xcode
npm run capacitor:android  # Android Studio
```

## 🔐 Security

- Environment variables for all secrets
- Firestore security rules enforced
- Server-side validation in Cloud Functions
- Webhook signature verification
- Payment data handled by Stripe only

## 📖 Documentation

- **CLAUDE.md** - Development guide for AI assistants
- **functions/README.md** - Cloud Functions API documentation
- **docs/** - Additional documentation

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run tests and linting
4. Use `/security-audit` before committing
5. Create pull request

## 📄 License

MIT

---

**Need Help?** Check CLAUDE.md or use the specialized AI agents for guidance.
