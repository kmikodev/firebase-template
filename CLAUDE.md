# CLAUDE.md

This file provides guidance to Claude Code when working with this Firebase + Capacitor project.

## ⚠️ CRITICAL: Read This FIRST

**Before doing ANYTHING, you MUST:**

1. **Read** `.claude_guide/TODOWRITE_POLICY.md` - TodoWrite is MANDATORY
2. **Create TodoWrite** for EVERY task before starting
3. **Use specialized agents** from `.claude/agents/` for each phase

**No exceptions. This is how this project works.**

---

## 📚 Complete Documentation System

All comprehensive guides are in `.claude_guide/`:

### 🚀 **Getting Started (Read in Order)**

1. **[.claude_guide/START_HERE.md](.claude_guide/START_HERE.md)** - Your entry point (5 min)
2. **[.claude_guide/MASTER_INDEX.md](.claude_guide/MASTER_INDEX.md)** - Index of all documentation (10 min)
3. **[.claude_guide/TODOWRITE_POLICY.md](.claude_guide/TODOWRITE_POLICY.md)** - ⚠️ MANDATORY policy (10 min)
4. **[.claude_guide/WORKFLOW_GUIDE.md](.claude_guide/WORKFLOW_GUIDE.md)** - How I (Claude) work here (20 min)

### 📖 **Reference Documentation**

- **[.claude_guide/BEST_PRACTICES.md](.claude_guide/BEST_PRACTICES.md)** - Patterns, checklists, decision matrices
- **[.claude_guide/EXAMPLE_WORKFLOWS.md](.claude_guide/EXAMPLE_WORKFLOWS.md)** - Real case studies with full TodoWrite
- **[.claude_guide/SETUP_GUIDE.md](.claude_guide/SETUP_GUIDE.md)** - Complete project setup
- **[.claude_guide/MCP_SETUP.md](.claude_guide/MCP_SETUP.md)** - MCP servers configuration

---

## 🤖 Specialized Agents System

Located in `.claude/agents/` - Use these for every task phase:

### Planning Phase
- **firebase-architect** - Architecture, data models, security rules design
- **requirements-analyst** - Requirements analysis, user stories creation
- **tech-researcher** - Library evaluation, best practices research

### Development Phase
- **code-reviewer** - Code quality, security, Firebase best practices review
- **test-writer** - Unit and integration tests creation
- **cloud-functions-specialist** - Cloud Functions implementation (especially payments)

### Testing & QA Phase
- **qa-specialist** - Manual testing, test plans, bug reproduction
- **security-auditor** - Security audits (MANDATORY for payments/auth)

### Deployment Phase
- **firebase-deployer** - Deployments, CI/CD configuration
- **documentation-writer** - Technical and user documentation

**See:** [.claude_guide/WORKFLOW_GUIDE.md](.claude_guide/WORKFLOW_GUIDE.md) for detailed agent usage patterns

---

## 🎮 Custom Slash Commands

Located in `.claude/commands/`:

- **/deploy-staging** - Deploy to staging with validations
- **/deploy-production** - Deploy to production with full checks
- **/test-payment-flow** - Comprehensive payment testing guide
- **/security-audit** - Complete security audit
- **/build-mobile** - iOS/Android build process

---

## 📋 TodoWrite: The Foundation

### This is MANDATORY for EVERY task

**Before ANY work:**

```markdown
1. Create comprehensive TodoWrite with ALL steps
2. Include which agents you'll use
3. Mark one todo as in_progress at a time
4. Update status immediately when done
```

**Example:**

```markdown
User: "Implement user authentication"

You: "I'll implement authentication. Let me plan all steps first."

TodoWrite:
1. ⏳ Analyze auth requirements (requirements-analyst agent)
2. ⏳ Design auth architecture (firebase-architect agent)
3. ⏳ Configure Firebase Auth
4. ⏳ Implement auth components
5. ⏳ Create tests (test-writer agent)
6. ⏳ Review code (code-reviewer agent)
7. ⏳ Security audit (security-auditor agent)
8. ⏳ Deploy to staging (/deploy-staging)
9. ⏳ Deploy to production (/deploy-production)

[Todo 1 - IN PROGRESS] Analyzing requirements...

> Use the requirements-analyst agent to...
```

**NEVER start coding without TodoWrite. NEVER.**

**See:** [.claude_guide/TODOWRITE_POLICY.md](.claude_guide/TODOWRITE_POLICY.md) for complete policy

---

## 🏗️ Project Architecture

### Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Firebase (Firestore, Auth, Cloud Functions, Storage, Hosting)
- **Mobile**: Capacitor (iOS + Android)
- **Payments**: Stripe
- **Testing**: Vitest + React Testing Library

### Project Structure

```
my-firebase-app/
├── .claude/                    # Agent system configuration
│   ├── agents/                 # 10 specialized agents
│   ├── commands/               # 5 custom commands
│   ├── output-styles/          # 3 communication styles
│   └── hooks/                  # 3 automation hooks
│
├── .claude_guide/              # Complete documentation
│   ├── START_HERE.md          # Entry point
│   ├── MASTER_INDEX.md        # Documentation index
│   ├── TODOWRITE_POLICY.md    # MANDATORY policy
│   ├── WORKFLOW_GUIDE.md      # How I work
│   ├── BEST_PRACTICES.md      # Patterns & checklists
│   ├── EXAMPLE_WORKFLOWS.md   # Real examples
│   ├── SETUP_GUIDE.md         # Setup instructions
│   └── MCP_SETUP.md           # MCP configuration
│
├── src/                       # React frontend
│   ├── components/            # React components
│   ├── pages/                 # Page components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utils & Firebase config
│   ├── services/              # Firebase services
│   └── types/                 # TypeScript types
│
├── functions/                 # Cloud Functions
│   └── src/
│       ├── index.ts           # Entry point
│       ├── payments.ts        # Stripe integration
│       └── triggers.ts        # Firestore triggers
│
├── capacitor/                 # Native projects
│   ├── ios/                   # Xcode project
│   └── android/               # Android Studio project
│
├── CLAUDE.md                  # This file
└── README.md                  # Quick start guide
```

---

## ⚡ Quick Reference

### Essential Commands

```bash
# Development
npm run dev                    # Start dev server (localhost:5173)
npm run firebase:emulators     # Start Firebase emulators
npm test                       # Run tests
npm run lint                   # Lint code

# Firebase
firebase deploy                # Deploy everything
firebase deploy --only hosting # Deploy hosting only
firebase deploy --only functions # Deploy functions only

# Capacitor
npm run capacitor:sync         # Sync web → native
npm run capacitor:ios          # Open Xcode
npm run capacitor:android      # Open Android Studio
```

### Code Conventions

**React Components:**
- Functional components with hooks
- TypeScript for all files
- File naming: `ComponentName.tsx` (PascalCase)

**Styling:**
- Tailwind utility classes (mobile-first)
- Custom classes in `src/index.css`

**Firebase Integration:**
- Environment variables for config
- Real-time listeners for Firestore
- Offline persistence enabled

**Cloud Functions:**
- TypeScript only
- Always validate auth
- Always validate input
- Use environment variables for secrets

**See:** [.claude_guide/BEST_PRACTICES.md](.claude_guide/BEST_PRACTICES.md) for complete conventions

---

## 🚨 Critical Security Rules

### ALWAYS Follow These:

1. **Payments:**
   - NEVER store card data in Firestore
   - ALWAYS verify webhook signatures
   - ALWAYS validate amounts server-side
   - Use security-auditor agent MULTIPLE times
   - Test with /test-payment-flow command
   - Deploy to staging for 48h minimum

2. **Authentication:**
   - ALWAYS validate on server (Cloud Functions)
   - NEVER trust client-side validation
   - Use security-auditor agent before production

3. **Data Access:**
   - Firestore security rules MUST deny by default
   - Test rules in emulators before deploy
   - Use security-auditor agent to review rules

4. **Secrets:**
   - NEVER commit secrets to git
   - Use environment variables (.env)
   - Use Firebase Secret Manager for functions

**See:** [.claude_guide/BEST_PRACTICES.md](.claude_guide/BEST_PRACTICES.md) → Security section

---

## 🔄 Standard Workflows

### New Feature Workflow

```markdown
TodoWrite:
1. requirements-analyst → Analyze requirements
2. firebase-architect → Design architecture
3. tech-researcher → Research libraries (if needed)
4. [Implement code]
5. test-writer → Create tests
6. code-reviewer → Review code
7. security-auditor → Audit (if sensitive)
8. qa-specialist → Create test plan
9. documentation-writer → Document
10. /deploy-staging
11. Manual testing
12. /deploy-production
```

### Payment Feature Workflow (CRITICAL)

```markdown
TodoWrite:
1. requirements-analyst → Payment requirements
2. firebase-architect → Secure architecture design
3. cloud-functions-specialist → Implement functions
4. test-writer → Exhaustive tests
5. code-reviewer → First review
6. security-auditor → First audit
7. /test-payment-flow → Test with all cards
8. code-reviewer → Second review
9. security-auditor → Second audit
10. qa-specialist → Manual testing
11. /deploy-staging
12. [Test in staging 48h minimum]
13. security-auditor → Third audit in staging
14. /deploy-production
15. [Monitor intensively 24h]

NEVER skip steps for payments.
```

### Bug Fix Workflow

```markdown
TodoWrite:
1. qa-specialist → Reproduce bug
2. [Identify root cause]
3. [Implement fix]
4. test-writer → Regression test
5. code-reviewer → Review fix
6. /deploy-staging
7. Verify fix
8. /deploy-production
9. Monitor
```

**See:** [.claude_guide/EXAMPLE_WORKFLOWS.md](.claude_guide/EXAMPLE_WORKFLOWS.md) for complete real-world examples

---

## 🎨 Output Styles

Located in `.claude/output-styles/`:

- **technical** - For developers (code, technical details)
- **executive** - For stakeholders (business impact, summaries)
- **qa** - For QA reports (bug reports, test results)

**Usage:**
```
> Use technical output style to explain the architecture
```

---

## 🔌 MCP Integration (Optional)

Enhance capabilities with MCP servers:

- **Firebase MCP** - Direct Firestore/Functions access, real-time logs
- **Stripe MCP** - Test payments, view webhooks
- **GitHub MCP** - Create issues/PRs, check CI/CD

**Setup:** [.claude_guide/MCP_SETUP.md](.claude_guide/MCP_SETUP.md)

---

## ✅ Pre-Flight Checklists

### Before ANY Commit

- [ ] TodoWrite created and all todos completed
- [ ] Tests passing (`npm test`)
- [ ] Linting passing (`npm run lint`)
- [ ] Code reviewed (code-reviewer agent)
- [ ] No console.log in production code
- [ ] No exposed secrets

### Before Staging Deploy

- [ ] Commit checklist ↑ completed
- [ ] Security audit if auth/payments/sensitive data
- [ ] Documentation updated
- [ ] `/security-audit` passed

### Before Production Deploy

- [ ] Staging checklist ↑ completed
- [ ] Tested in staging minimum 24h (48h for payments)
- [ ] Second security audit completed
- [ ] QA manual testing done
- [ ] Rollback plan ready
- [ ] Monitoring configured

**See:** [.claude_guide/BEST_PRACTICES.md](.claude_guide/BEST_PRACTICES.md) for complete checklists

---

## 🎓 Learning Path

### For New Users (Read in Order):

1. This file (CLAUDE.md) - 10 min
2. [.claude_guide/START_HERE.md](.claude_guide/START_HERE.md) - 5 min
3. [.claude_guide/TODOWRITE_POLICY.md](.claude_guide/TODOWRITE_POLICY.md) - 10 min ⚠️
4. [.claude_guide/WORKFLOW_GUIDE.md](.claude_guide/WORKFLOW_GUIDE.md) - 20 min
5. [.claude_guide/BEST_PRACTICES.md](.claude_guide/BEST_PRACTICES.md) - 15 min
6. [.claude_guide/EXAMPLE_WORKFLOWS.md](.claude_guide/EXAMPLE_WORKFLOWS.md) - 20 min

**Total: ~80 minutes to master the system**

---

## 🆘 Getting Help

### Quick Reference:

1. **[.claude_guide/MASTER_INDEX.md](.claude_guide/MASTER_INDEX.md)** - Find relevant documentation
2. **[.claude_guide/BEST_PRACTICES.md](.claude_guide/BEST_PRACTICES.md)** - Look for similar patterns
3. **[.claude_guide/EXAMPLE_WORKFLOWS.md](.claude_guide/EXAMPLE_WORKFLOWS.md)** - See real examples
4. **Specific agent in `.claude/agents/`** - Detailed agent instructions

### How to Ask for Help:

```markdown
✅ GOOD:
"I need to implement [specific feature].
 I've read [relevant guide].
 My TodoWrite plan is:
 1. [step]
 2. [step]
 Can you review my approach?"

❌ BAD:
"Help me"
```

---

## 📊 Success Metrics

### Quality Goals:

- **Code Coverage**: 80%+ for business logic, 90%+ for Cloud Functions
- **Security**: All audits passing before production
- **Documentation**: Every feature documented
- **Testing**: All critical paths have tests
- **Deployment**: Staging tested before production (always)

---

## 🎯 Remember

1. **TodoWrite is MANDATORY** - No exceptions
2. **Use agents for each phase** - They're specialized for a reason
3. **Staging before production** - Always
4. **Security audits for payments** - Multiple times
5. **Follow checklists** - They prevent mistakes
6. **Document as you go** - Not after
7. **Monitor post-deploy** - First 15 minutes are critical

---

## 📚 Complete Documentation

**Everything you need is in `.claude_guide/`:**

- START_HERE.md - Entry point
- MASTER_INDEX.md - Complete index
- TODOWRITE_POLICY.md - TodoWrite rules (MANDATORY)
- WORKFLOW_GUIDE.md - How I work with agents
- BEST_PRACTICES.md - Patterns and checklists
- EXAMPLE_WORKFLOWS.md - Real case studies
- SETUP_GUIDE.md - Project setup
- MCP_SETUP.md - MCP configuration

**Start here:** [.claude_guide/START_HERE.md](.claude_guide/START_HERE.md)

---

**This project is configured for maximum quality and efficiency. Follow the system and you'll build amazing things.** 🚀
