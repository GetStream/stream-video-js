import {
  type StreamVideoProviderProps,
  StreamVideoProvider,
} from '@stream-io/video-react-bindings';
import { PropsWithChildren } from 'react';
import {
  TranslationProvider,
  useStreami18n,
  type UseStreami18nParams,
} from '../../../i18n';

export type StreamVideoProps = StreamVideoProviderProps & UseStreami18nParams;

/**
 * StreamVideo is the root provider of the SDK: it provides the client to the component tree and
 * mounts the SDK's translation context.
 *
 * The i18n runtime lives here rather than in `@stream-io/video-react-bindings` because the key
 * catalog is generated from *this* package's `t()` call sites.
 *
 * This also fixes a real bug in the previous implementation, which rendered
 * `<StreamVideoProvider translationsOverrides={translations} {...props} />`. Because `{...props}`
 * came last, an integrator passing `translationsOverrides` *replaced* the SDK's bundled strings
 * instead of merging with them, leaving every untranslated key rendering as a raw dotted path.
 * `useStreami18n` layers integrator dictionaries over the SDK's own defaults, so a partial
 * dictionary is now safe.
 */
export const StreamVideo = ({
  children,
  client,
  i18nInstance,
  language,
  translations,
}: PropsWithChildren<StreamVideoProps>) => {
  const translationContext = useStreami18n({
    i18nInstance,
    language,
    translations,
  });
  return (
    <StreamVideoProvider client={client}>
      <TranslationProvider value={translationContext}>
        {children}
      </TranslationProvider>
    </StreamVideoProvider>
  );
};

StreamVideo.displayName = 'StreamVideo';
