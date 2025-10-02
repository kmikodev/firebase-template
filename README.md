# My Firebase App

Serverless mobile-first application built with Firebase, React, Tailwind CSS, and Capacitor.

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your Firebase config

# Start development
npm run dev                      # Dev server (localhost:5173)
npm run firebase:emulators       # Firebase emulators (separate terminal)
\`\`\`

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Build**: Vite
- **Backend**: Firebase (Firestore, Auth, Cloud Functions, Storage, Hosting)
- **Mobile**: Capacitor (iOS + Android)
- **Payments**: Stripe
- **Testing**: Vitest + React Testing Library

## 📝 Available Scripts

\`\`\`bash
npm run dev              # Start dev server
npm run build            # Build for production
npm test                 # Run tests
npm run lint             # Lint code
npm run firebase:emulators  # Start Firebase emulators
npm run capacitor:sync   # Sync with Capacitor
\`\`\`

## 🤖 AI-Powered Development

This project includes a complete AI agent system for the full development lifecycle.

**For Claude Code users:** Read **[CLAUDE.md](CLAUDE.md)** for complete instructions.

### Quick Overview:

- **10 specialized agents** for planning, development, testing, and deployment
- **5 custom commands** for common operations
- **3 output styles** for different audiences
- **Complete workflows** documented

## 📚 Documentation

### For Developers:
1. **[CLAUDE.md](CLAUDE.md)** - Complete guide for AI-assisted development
2. **[.claude_guide/START_HERE.md](.claude_guide/START_HERE.md)** - Comprehensive getting started guide
3. **[.claude_guide/MASTER_INDEX.md](.claude_guide/MASTER_INDEX.md)** - Index of all documentation

### For Setup:
- **[.env.example](.env.example)** - Environment variables template
- **[.claude_guide/SETUP_GUIDE.md](.claude_guide/SETUP_GUIDE.md)** - Detailed setup instructions
- **[.claude_guide/MCP_SETUP.md](.claude_guide/MCP_SETUP.md)** - MCP servers configuration

## 🔧 Configuration

### Environment Variables

Create \`.env\`:
\`\`\`bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
# ... see .env.example for complete list
\`\`\`

### Firebase

\`\`\`bash
# Login
firebase login

# Deploy
firebase deploy
\`\`\`

### Capacitor (Mobile)

\`\`\`bash
# Build and sync
npm run capacitor:build

# Open in IDE
npm run capacitor:ios      # Xcode
npm run capacitor:android  # Android Studio
\`\`\`

## 🧪 Testing

\`\`\`bash
# Run tests
npm test

# Run tests with UI
npm test:ui

# Test Cloud Functions
cd functions && npm test
\`\`\`

## 🚀 Deployment

\`\`\`bash
# Build
npm run build

# Deploy to Firebase
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
\`\`\`

## 📱 Mobile Build

\`\`\`bash
# Sync web app with native projects
npm run capacitor:sync

# Open in Xcode (iOS)
npm run capacitor:ios

# Open in Android Studio (Android)
npm run capacitor:android
\`\`\`

## 🔐 Security

- All secrets in environment variables
- Server-side validation in Cloud Functions
- Firestore security rules enforced
- Payment data handled by Stripe only
- Webhook signature verification

## 🤝 Contributing

This project uses AI agents for development. See **[CLAUDE.md](CLAUDE.md)** for the workflow.

Key principles:
1. Always use TodoWrite to plan tasks
2. Use specialized agents for each phase
3. Test in staging before production
4. Security audits for sensitive features

## 📖 Learn More

- **[CLAUDE.md](CLAUDE.md)** - AI agent system guide
- **[.claude_guide/](.claude_guide/)** - Complete documentation
- [Firebase Docs](https://firebase.google.com/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Capacitor Docs](https://capacitorjs.com)
- [Stripe Docs](https://stripe.com/docs)

## 📄 License

MIT

---

**Ready to build?** Start with **[.claude_guide/START_HERE.md](.claude_guide/START_HERE.md)** 🚀
