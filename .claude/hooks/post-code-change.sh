#!/bin/bash
# Post code change hook
# Runs after significant code changes to trigger reviews

set -e

echo "🔍 Post code-change hook triggered..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "⚠️  Not in a git repository. Skipping hook."
    exit 0
fi

# Get list of changed files
CHANGED_FILES=$(git diff --name-only HEAD 2>/dev/null || echo "")

if [ -z "$CHANGED_FILES" ]; then
    echo "ℹ️  No changes detected."
    exit 0
fi

echo "📝 Files changed:"
echo "$CHANGED_FILES"

# Check if Cloud Functions changed
if echo "$CHANGED_FILES" | grep -q "functions/"; then
    echo ""
    echo "⚡ Cloud Functions changes detected!"
    echo "   Recommended actions:"
    echo "   1. Run 'cd functions && npm test' to test functions"
    echo "   2. Use security-auditor agent to review payment code"
    echo "   3. Test with emulators: 'firebase emulators:start'"
fi

# Check if security rules changed
if echo "$CHANGED_FILES" | grep -q "firestore.rules\|storage.rules"; then
    echo ""
    echo "🔒 Security rules changes detected!"
    echo "   Recommended actions:"
    echo "   1. Test rules with emulators"
    echo "   2. Review with security-auditor agent"
    echo "   3. Deploy rules only: 'firebase deploy --only firestore:rules'"
fi

# Check if payment code changed
if echo "$CHANGED_FILES" | grep -q "payment\|stripe\|checkout"; then
    echo ""
    echo "💳 Payment-related code changes detected!"
    echo "   ⚠️  CRITICAL: Review required!"
    echo "   Recommended actions:"
    echo "   1. Use security-auditor agent to review payment security"
    echo "   2. Test with Stripe test cards"
    echo "   3. Verify webhook signature validation"
    echo "   4. Check idempotency implementation"
fi

# Check if package.json changed
if echo "$CHANGED_FILES" | grep -q "package.json"; then
    echo ""
    echo "📦 Dependencies changed!"
    echo "   Recommended action: Run 'npm install'"
fi

# Suggest code review
LINES_CHANGED=$(git diff --stat HEAD | tail -1 | awk '{print $4}' || echo "0")
if [ "$LINES_CHANGED" -gt 100 ] 2>/dev/null; then
    echo ""
    echo "📊 Large change detected ($LINES_CHANGED lines changed)"
    echo "   Consider using code-reviewer agent before committing."
fi

exit 0
