This config plugin is built to auto configure the `@stream-io/video-react-native-sdk` with the native changes.

After installing the `@stream-io/video-react-native-sdk` you can simply add the plugin in the `app.json` or `app.config.js` of your project as:

```json
{
  "expo": {
    "plugins": ["@stream-io/video-react-native-sdk"]
  }
}
```

Next you can run the code using `yarn run android` and `yarn run ios`.

## Changes

The plugin adds the following native changes to the code.

### Android

#### `AndroidManifest.xml`

Add service named `app.notifee.core.ForegroundService`.

```xml
<service android:name="app.notifee.core.ForegroundService" android:stopWithTask="true" android:foregroundServiceType="shortService"/>
```

The `@stream-io/video-react-native-sdk` also adds the appropriate android permissions such as `POST_NOTIFICATIONS`, `FOREGROUND_SERVICE`, `BLUETOOTH`, `BLUETOOTH_ADMIN` and `BLUETOOTH_CONNECT` to the `AndroidManifest.xml`.

### iOS

### `Info.plist`

Adds `audio` to the `UIBackgroundModes` in Info.plist as:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>
</array>
```
