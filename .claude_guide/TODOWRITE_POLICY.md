# 📋 TodoWrite Mandatory Policy

## ⚠️ CRITICAL RULE FOR CLAUDE CODE

**BEFORE STARTING ANY TASK, YOU MUST USE TodoWrite TO CREATE A COMPREHENSIVE TODO LIST.**

This is NOT optional. This is NOT a suggestion. This is **MANDATORY**.

## Why TodoWrite is Mandatory

### 1. User Visibility
The user needs to see EXACTLY what you plan to do before you do it. No surprises.

### 2. Progress Tracking
Users can track progress in real-time and know you haven't frozen or gotten stuck.

### 3. Quality Control
Creating todos forces you to think through the entire task before executing, preventing mistakes.

### 4. Collaboration
If the plan is wrong, the user can stop you BEFORE you waste time implementing the wrong thing.

## TodoWrite Requirements

### ✅ MUST DO:

1. **Create TodoWrite FIRST** - Before ANY code, ANY analysis, ANY work
2. **Be Comprehensive** - Include EVERY step: analysis, design, implementation, testing, review, deployment
3. **Include Agents** - Specify which agents you'll use (e.g., "Review with code-reviewer agent")
4. **Update in Real-Time** - Mark todos as `in_progress` and `completed` immediately
5. **One at a Time** - Only ONE todo should be `in_progress` at any given moment
6. **Be Specific** - Each todo should be clear and actionable

### ❌ NEVER:

1. **Start coding without TodoWrite** - This breaks the workflow
2. **Skip todos** - Don't jump ahead without marking previous todos as complete
3. **Batch updates** - Update todos immediately, not at the end
4. **Vague todos** - "Implement feature" is too vague. Be specific.
5. **Forget agents** - Always include agent usage in your plan

## TodoWrite Template

```json
{
  "todos": [
    {
      "content": "Analyze requirements using requirements-analyst agent",
      "activeForm": "Analyzing requirements with requirements-analyst agent",
      "status": "pending"
    },
    {
      "content": "Design architecture using firebase-architect agent",
      "activeForm": "Designing architecture with firebase-architect agent",
      "status": "pending"
    },
    {
      "content": "Implement [specific component/function]",
      "activeForm": "Implementing [specific component/function]",
      "status": "pending"
    },
    {
      "content": "Create tests using test-writer agent",
      "activeForm": "Creating tests with test-writer agent",
      "status": "pending"
    },
    {
      "content": "Review code with code-reviewer agent",
      "activeForm": "Reviewing code with code-reviewer agent",
      "status": "pending"
    },
    {
      "content": "Security audit with security-auditor agent (if payment-related)",
      "activeForm": "Performing security audit with security-auditor agent",
      "status": "pending"
    },
    {
      "content": "Deploy to staging using /deploy-staging",
      "activeForm": "Deploying to staging",
      "status": "pending"
    }
  ]
}
```

## Example: CORRECT Workflow

### User Request:
```
"Add Google sign-in to the app"
```

### Your Response (CORRECT ✅):

```markdown
I'll implement Google sign-in. Let me plan all the steps first.

**TodoWrite:**

1. ⏳ Analyze Google Auth requirements (requirements-analyst agent)
2. ⏳ Design authentication flow (firebase-architect agent)
3. ⏳ Configure Google OAuth in Firebase Console
4. ⏳ Install required dependencies (@react-oauth/google)
5. ⏳ Implement GoogleSignInButton component
6. ⏳ Update auth service to handle Google sign-in
7. ⏳ Add error handling for Google auth failures
8. ⏳ Create tests for Google auth flow (test-writer agent)
9. ⏳ Review implementation (code-reviewer agent)
10. ⏳ Security audit (security-auditor agent)
11. ⏳ Test in Firebase emulators
12. ⏳ Update documentation (documentation-writer agent)
13. ⏳ Deploy to staging (/deploy-staging)
14. ⏳ Manual testing in staging
15. ⏳ Deploy to production (/deploy-production)

Now I'll start with todo #1...

**[Todo 1 - IN PROGRESS]**

> Use the requirements-analyst agent to analyze Google Auth requirements...
```

### Your Response (INCORRECT ❌):

```markdown
I'll implement Google sign-in.

[Starts writing code immediately without TodoWrite]
```

**This is WRONG and breaks the workflow!**

## Special Cases

### Small Tasks (< 3 steps)

Even for small tasks, create todos:

```markdown
User: "Fix typo in README"

TodoWrite:
1. ⏳ Read README.md and locate typo
2. ⏳ Fix typo
3. ⏳ Verify change

[Todo 1 - IN PROGRESS]
[Reads file]
[Todo 1 - COMPLETED]

[Todo 2 - IN PROGRESS]
[Fixes typo]
[Todo 2 - COMPLETED]

[Todo 3 - IN PROGRESS]
[Shows diff]
[Todo 3 - COMPLETED]

✅ All todos completed. Typo fixed.
```

### Urgent Hotfixes

Even for urgent fixes, create todos:

```markdown
User: "URGENT: Payment webhook is failing in production!"

TodoWrite:
1. ⏳ Check Firebase Functions logs for errors
2. ⏳ Identify root cause
3. ⏳ Implement fix
4. ⏳ Test fix locally
5. ⏳ Security review (security-auditor)
6. ⏳ Deploy hotfix to production
7. ⏳ Monitor logs post-deployment

[Executing urgently but systematically...]
```

### Complex Multi-Day Features

Create high-level todos, add details as you go:

```markdown
TodoWrite (Day 1):
1. ⏳ Analyze requirements (requirements-analyst)
2. ⏳ Design architecture (firebase-architect)
3. ⏳ Research libraries (tech-researcher)
4. ⏳ Create implementation plan
5. ⏳ [Will add more todos based on plan]

[After creating implementation plan, update todos]

TodoWrite (Updated):
1. ✅ Analyze requirements
2. ✅ Design architecture
3. ✅ Research libraries
4. ✅ Create implementation plan
5. ⏳ Implement backend (15 sub-todos)
6. ⏳ Implement frontend (10 sub-todos)
7. ⏳ Testing (5 sub-todos)
8. ⏳ Deployment (3 sub-todos)
```

## Agent Usage in Todos

### Always Include Agents in Your Plan:

```markdown
✅ GOOD:
- "Analyze requirements using requirements-analyst agent"
- "Review security with security-auditor agent"
- "Create tests with test-writer agent"

❌ BAD:
- "Analyze requirements" (missing which agent)
- "Review code" (missing which agent)
- "Write tests" (missing which agent)
```

### Agent Priority by Task Type:

#### New Feature:
```markdown
1. requirements-analyst (requirements)
2. firebase-architect (architecture)
3. tech-researcher (if needed)
4. [implementation todos]
5. test-writer (tests)
6. code-reviewer (review)
7. security-auditor (if sensitive)
8. qa-specialist (test plan)
9. documentation-writer (docs)
```

#### Bug Fix:
```markdown
1. qa-specialist (reproduce bug)
2. [identify cause]
3. [implement fix]
4. test-writer (regression test)
5. code-reviewer (review fix)
6. [deploy]
```

#### Payment Feature:
```markdown
1. requirements-analyst (requirements)
2. firebase-architect (architecture)
3. cloud-functions-specialist (implementation)
4. test-writer (extensive tests)
5. code-reviewer (review)
6. security-auditor (MANDATORY audit)
7. /test-payment-flow
8. security-auditor (second audit)
9. [staging deployment]
10. [production deployment]
```

## Enforcement

### How to Check Compliance:

1. **Did you create TodoWrite before starting?** ✅ / ❌
2. **Are todos comprehensive and specific?** ✅ / ❌
3. **Do todos include agent usage?** ✅ / ❌
4. **Are you updating todos in real-time?** ✅ / ❌
5. **Is only ONE todo in_progress at a time?** ✅ / ❌

### If You Realize You Forgot TodoWrite:

```markdown
⚠️ I apologize - I should have created a TodoWrite plan first.

Let me correct this:

**TodoWrite (should have been first):**
1. [all the steps I should have planned]

I'll now continue following this plan properly.
```

## Benefits of Following This Policy

### For the User:
- ✅ Knows exactly what you're doing
- ✅ Can stop you if plan is wrong
- ✅ Sees progress in real-time
- ✅ No surprises or wasted work

### For Claude (You):
- ✅ Forces you to think before acting
- ✅ Prevents forgetting important steps
- ✅ Ensures comprehensive approach
- ✅ Improves quality of work

### For the Project:
- ✅ Better documentation of what was done
- ✅ Auditable trail of work
- ✅ Consistent workflow
- ✅ Higher quality deliverables

## Summary

**TodoWrite is not a nice-to-have. It's the FOUNDATION of how you work on this project.**

Every task, no matter how small, starts with TodoWrite.
Every agent, every command, every step should be in the todos.
Every todo should be updated in real-time.

**No exceptions. No shortcuts. TodoWrite FIRST, always.**

---

Remember: The user configured this project specifically to have this workflow. Respect it.
