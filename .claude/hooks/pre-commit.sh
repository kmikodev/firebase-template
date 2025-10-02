#!/bin/bash
# Pre-commit hook for Firebase + Capacitor project
# Runs before git commit to ensure code quality

set -e

echo "🔍 Running pre-commit checks..."

# 1. Lint code
echo "📝 Linting code..."
npm run lint || {
    echo "❌ Linting failed. Please fix errors before committing."
    exit 1
}

# 2. Run tests
echo "🧪 Running tests..."
npm test || {
    echo "❌ Tests failed. Please fix failing tests before committing."
    exit 1
}

# 3. Check for secrets in code
echo "🔐 Checking for exposed secrets..."
if grep -r "sk_live\|sk_test\|AIza" src/ functions/src/ 2>/dev/null; then
    echo "❌ WARNING: Possible API keys found in code!"
    echo "   Please use environment variables for secrets."
    exit 1
fi

# 4. Check TypeScript compilation
echo "🔨 Checking TypeScript..."
npx tsc --noEmit || {
    echo "❌ TypeScript compilation failed."
    exit 1
}

# 5. Check for console.log in production code
echo "🚫 Checking for console.log..."
if git diff --cached --name-only | grep -E '\.(ts|tsx|js|jsx)$' | xargs grep -n "console\.log" 2>/dev/null; then
    echo "⚠️  WARNING: console.log found. Consider removing before production."
    echo "   Continue anyway? (y/n)"
    read -r response
    if [[ "$response" != "y" ]]; then
        exit 1
    fi
fi

echo "✅ All pre-commit checks passed!"
exit 0
