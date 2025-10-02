# Build Mobile Apps

Builds the mobile application for iOS and Android using Capacitor.

## Command

```bash
echo "📱 Mobile Build Process"
echo ""

# 1. Build web app
echo "1️⃣  Building web application..."
npm run build

# 2. Sync with Capacitor
echo ""
echo "2️⃣  Syncing with Capacitor..."
npx cap sync

echo ""
echo "✅ Mobile sync complete!"
echo ""
echo "Next steps:"
echo ""
echo "For iOS:"
echo "  npx cap open ios"
echo "  Then in Xcode:"
echo "    - Select target device or 'Any iOS Device'"
echo "    - Product > Archive"
echo "    - Distribute App > App Store Connect"
echo ""
echo "For Android:"
echo "  npx cap open android"
echo "  Then in Android Studio:"
echo "    - Build > Generate Signed Bundle/APK"
echo "    - Select 'Android App Bundle'"
echo "    - Upload to Google Play Console"
echo ""
echo "Testing on emulators:"
echo "  iOS: npx cap run ios"
echo "  Android: npx cap run android"
```

## iOS Build Checklist

### Prerequisites
- [ ] Xcode installed (latest version)
- [ ] Apple Developer account
- [ ] Provisioning profiles configured
- [ ] App Store Connect app created

### Build Steps
1. `npm run build`
2. `npx cap sync ios`
3. `npx cap open ios`
4. In Xcode:
   - Update version and build number
   - Select signing certificate
   - Select target: "Any iOS Device (arm64)"
   - Product > Archive
   - Upload to App Store Connect
5. Submit for review in App Store Connect

### Testing
- [ ] Test on physical device
- [ ] Test on iOS simulator
- [ ] Test on different screen sizes (SE, 14, Pro Max)
- [ ] Test dark mode
- [ ] Test offline functionality
- [ ] Test push notifications
- [ ] Test camera/native features

## Android Build Checklist

### Prerequisites
- [ ] Android Studio installed
- [ ] Java SDK installed
- [ ] Google Play Console account
- [ ] Keystore file created and secured

### Build Steps
1. `npm run build`
2. `npx cap sync android`
3. `npx cap open android`
4. In Android Studio:
   - Update versionCode and versionName in build.gradle
   - Build > Generate Signed Bundle/APK
   - Select Android App Bundle
   - Sign with release keystore
   - Upload to Google Play Console
5. Submit for review

### Testing
- [ ] Test on physical device
- [ ] Test on Android emulator
- [ ] Test on different screen sizes
- [ ] Test different Android versions (minimum supported)
- [ ] Test dark mode
- [ ] Test offline functionality
- [ ] Test push notifications
- [ ] Test camera/native features
- [ ] Test back button behavior

## Environment Configuration

### iOS (Info.plist)
- Camera permissions
- Photo library permissions
- Push notification permissions
- Deep link schemes

### Android (AndroidManifest.xml)
- Camera permissions
- Storage permissions
- Internet permissions
- Deep link schemes

## Fastlane Automation (Optional)

Create `fastlane/Fastfile`:

```ruby
default_platform(:ios)

platform :ios do
  desc "Build and upload to TestFlight"
  lane :beta do
    sh("npm run build")
    sh("npx cap sync ios")
    build_app(scheme: "App")
    upload_to_testflight
  end
end

platform :android do
  desc "Build and upload to Play Store"
  lane :beta do
    sh("npm run build")
    sh("npx cap sync android")
    gradle(task: "bundle", build_type: "Release")
    upload_to_play_store(track: "internal")
  end
end
```

Run with: `fastlane ios beta` or `fastlane android beta`

## Common Issues

### iOS
- **Signing issues**: Check provisioning profiles in Xcode
- **Missing permissions**: Add to Info.plist
- **Build fails**: Clean build folder (Product > Clean Build Folder)

### Android
- **Keystore issues**: Verify keystore password
- **Gradle sync fails**: Invalidate caches (File > Invalidate Caches)
- **Missing permissions**: Add to AndroidManifest.xml

## Capacitor Plugins Used

Check `package.json` for:
- @capacitor/camera
- @capacitor/push-notifications
- @capacitor/app
- @capacitor/haptics
- @capacitor/keyboard
- @capacitor/status-bar
