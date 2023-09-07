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

#### `MainApplication.java`

Adds the import and setup for StreamVideoReactNative in your `MainApplication.java` file:

Read more about it [here](https://getstream.io/video/docs/reactnative/setup/installation/react-native/#add-stream-video-sdks-setup-method).

```java
// Adds this
import com.streamvideo.reactnative.StreamVideoReactNative;

public class MainApplication extends Application implements ReactApplication {

  @Override
  public void onCreate() {
    super.onCreate();
    // Adds this
    StreamVideoReactNative.setup();
    // the rest..
  }
}
```

#### `AndroidManifest.xml`

Add service named `app.notifee.core.ForegroundService`.

```xml
<service android:name="app.notifee.core.ForegroundService" android:stopWithTask="true" android:foregroundServiceType="microphone"/>
```

The `@stream-io/video-react-native-sdk` also adds the appropriate android permissions such as `POST_NOTIFICATIONS`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MICROPHONE`, `BLUETOOTH`, `BLUETOOTH_ADMIN` and `BLUETOOTH_CONNECT` to the `AndroidManifest.xml`.

### iOS

#### `AppDelegate.mm`

Adds the import and setup for StreamVideoReactNative in your `AppDelegate.mm` file:

Read more about it [here](https://getstream.io/video/docs/reactnative/setup/installation/react-native/#add-stream-video-sdks-setup-method).

```c
// Adds this
#import "StreamVideoReactNative.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  // Adds this
  [StreamVideoReactNative setup];

  // the rest..
}
```

### `Info.plist`

Adds `audio` to the `UIBackgroundModes` in Info.plist as:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>audio</string>
</array>
```
