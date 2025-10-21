# react-native-broadcast

a

## Installation

```sh
npm install react-native-broadcast
```

## Usage

### BroadcastVideoView Component

Display the local video preview from the broadcast mixer:

```tsx
import { BroadcastVideoView, multiply } from 'react-native-broadcast';
import { View, StyleSheet, Button } from 'react-native';

function App() {
  const startBroadcast = async () => {
    // This will initialize the mixer and start the RTMP broadcast
    await multiply(3, 7);
  };

  return (
    <View style={styles.container}>
      <BroadcastVideoView style={styles.video} />
      <Button title="Start Broadcast" onPress={startBroadcast} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  video: {
    flex: 1,
    backgroundColor: 'black',
  },
});
```

### API

#### `BroadcastVideoView`

A native view component that displays the local video from the broadcast mixer.

**Props:**

- `style?: ViewStyle` - Standard React Native style prop

The view automatically connects to the mixer when it becomes available after calling `multiply()` to start the broadcast.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
