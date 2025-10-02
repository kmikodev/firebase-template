#!/bin/bash
# Pre-deploy hook for Firebase
# Runs before firebase deploy to ensure production readiness

set -e

echo "🚀 Running pre-deployment checks..."

# 1. Confirm deployment target
FIREBASE_PROJECT=$(firebase use 2>/dev/null | grep "Now using" | awk '{print $4}')
echo "📍 Current Firebase project: $FIREBASE_PROJECT"

if [[ "$FIREBASE_PROJECT" == *"prod"* ]]; then
    echo "⚠️  You are about to deploy to PRODUCTION!"
    echo "   Continue? (yes/no)"
    read -r response
    if [[ "$response" != "yes" ]]; then
        echo "❌ Deployment cancelled."
        exit 1
    fi
fi

# 2. Run all tests
echo "🧪 Running full test suite..."
npm test || {
    echo "❌ Tests failed. Fix tests before deploying."
    exit 1
}

# 3. Build the app
echo "🔨 Building application..."
npm run build || {
    echo "❌ Build failed. Fix build errors before deploying."
    exit 1
}

# 4. Check bundle size
echo "📦 Checking bundle size..."
BUNDLE_SIZE=$(du -sh dist/ | awk '{print $1}')
echo "   Bundle size: $BUNDLE_SIZE"

# 5. Build and test Cloud Functions
echo "⚡ Building Cloud Functions..."
cd functions
npm run build || {
    echo "❌ Functions build failed."
    exit 1
}
cd ..

# 6. Validate Firestore security rules
echo "🔒 Validating Firestore security rules..."
if [ -f "firestore.rules" ]; then
    # Check for insecure rules
    if grep -q "allow read, write: if true" firestore.rules; then
        echo "❌ WARNING: Insecure Firestore rules detected!"
        echo "   Found 'allow read, write: if true' which allows unrestricted access."
        exit 1
    fi
fi

# 7. Check environment variables
echo "🔧 Checking environment variables..."
if [[ "$FIREBASE_PROJECT" == *"prod"* ]]; then
    if [ ! -f "functions/.env" ]; then
        echo "⚠️  WARNING: functions/.env not found for production!"
        echo "   Ensure secrets are configured in Firebase Secret Manager."
    fi
fi

# 8. Security audit
echo "🛡️  Running security audit..."
npm audit --production || {
    echo "⚠️  WARNING: Security vulnerabilities found."
    echo "   Consider running 'npm audit fix' before deploying."
    echo "   Continue anyway? (y/n)"
    read -r response
    if [[ "$response" != "y" ]]; then
        exit 1
    fi
}

echo "✅ All pre-deployment checks passed!"
echo "🚀 Ready to deploy to $FIREBASE_PROJECT"
exit 0
