export * from '@stream-io/video-react-bindings';
export * from './src/components';
export * from './src/contexts';

// Overriding 'StreamVideo' from '@stream-io/video-react-bindings'
// Explicitly re-exporting to resolve the ambiguity.
export { StreamVideo } from './src/contexts/StreamVideoContext';
