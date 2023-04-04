export * from '@stream-io/video-client';
export * from '@stream-io/video-react-bindings';
export * from './src/components';
export * from './src/contexts';
export * from './src/hooks';
export * from './src/theme';

// Overriding 'StreamVideo' from '@stream-io/video-react-bindings'
// Explicitly re-exporting to resolve ambiguity.
export { StreamVideo } from './src/providers';
