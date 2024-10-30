#!/bin/bash

# Configuration
APP_NAME=StreamReactNativeVideoSDKSample
TEAM_ID=EHV7XZLAHA

# Create exportOptions.plist
cat > ios/exportOptions.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>development</string>
    <key>teamID</key>
    <string>EHV7XZLAHA</string>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
EOF

# Build and export
cd ios
xcodebuild clean archive -workspace "$APP_NAME.xcworkspace" \
  -scheme "$APP_NAME" \
  -archivePath "build/$APP_NAME.xcarchive" \
  -allowProvisioningUpdates \
  -destination 'generic/platform=iOS'

xcodebuild -exportArchive \
  -archivePath "build/$APP_NAME.xcarchive" \
  -exportPath "build/$APP_NAME.ipa" \
  -exportOptionsPlist exportOptions.plist

echo "IPA created at: $(pwd)/build/$APP_NAME.ipa"