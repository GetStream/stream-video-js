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

### [Add Stream Video SDK's setup method](https://getstream.io/video/docs/reactnative/setup/installation/react-native/#add-stream-video-sdks-setup-method)

#### Android

Adds the following in your `MainApplication.java` file:

<!-- vale off -->

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

<!-- vale on -->

#### iOS

Adds the following in your `AppDelegate.mm` file:

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

### Android Permissions

The `@stream-io/video-react-native-sdk` adds the appropriate android permissions such as `POST_NOTIFICATIONS`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MICROPHONE`, `BLUETOOTH`, `BLUETOOTH_ADMIN` and `BLUETOOTH_CONNECT` to the `AndroidManifest.xml`.
