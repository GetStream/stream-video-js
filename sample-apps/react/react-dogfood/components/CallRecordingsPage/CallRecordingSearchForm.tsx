import {
  CallRecording,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useRouter } from 'next/router';
import {
  ChangeEventHandler,
  FormEventHandler,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Button, Stack } from '@mui/material';
import clsx from 'clsx';

const CALL_TYPES = ['default', 'development', 'audio-room', 'livestream'];

type CallRecordingSearchFormProps = {
  setLoading: (loading: boolean) => void;
  setResult: (recordings: CallRecording[] | undefined) => void;
  setResultError: (error: Error | undefined) => void;
};
export const CallRecordingSearchForm = ({
  setLoading,
  setResult,
  setResultError,
}: CallRecordingSearchFormProps) => {
  const router = useRouter();
  const videoClient = useStreamVideoClient();

  const [enabled, setEnabled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedOption, setHighlightedOption] = useState(0);
  const [callIdInput, setCallIdInput] = useState<HTMLInputElement | null>(null);
  const [callTypeInput, setCallTypeInput] = useState<HTMLInputElement | null>(
    null,
  );

  const queryRecordings = useCallback(
    async (callType: string, callId: string) => {
      if (!videoClient) return;

      const call = videoClient.call(callType, callId);

      try {
        setLoading(true);
        setEnabled(false);
        const { recordings } = await call.queryRecordings();
        setResult(recordings);
        setResultError(undefined);
      } catch (err) {
        setResultError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setResult, setResultError, setEnabled, videoClient],
  );

  const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    async (e) => {
      e.preventDefault();
      const callId = callIdInput?.value.trim();
      const callType = callTypeInput?.value.trim();

      if (!(callId && callType)) return;

      await router.push(
        {
          pathname: '/call-recordings/[...callCid]',
          query: { callCid: [callType, callId] },
        },
        undefined,
        {
          shallow: true,
        },
      );
    },
    [callIdInput, callTypeInput, router],
  );

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(() => {
    setEnabled(!!(callTypeInput?.value && callIdInput?.value));
    setResult(undefined);
    setResultError(undefined);
  }, [callTypeInput, callIdInput, setResult, setResultError]);

  const handleDropdownNavigation: KeyboardEventHandler<HTMLInputElement> =
    useCallback(
      (e) => {
        if (!callTypeInput) return;
        if (e.code === 'ArrowDown') {
          if (!showDropdown) {
            setShowDropdown(true);
            return;
          }
          setHighlightedOption((prev) => {
            return ++prev % CALL_TYPES.length;
          });
        }

        if (e.code === 'ArrowUp') {
          setHighlightedOption((prev) => {
            return prev === 0
              ? CALL_TYPES.length - 1
              : --prev % CALL_TYPES.length;
          });
        }

        if (e.code === 'Enter') {
          callTypeInput.value = CALL_TYPES[highlightedOption];
          setShowDropdown(false);
          setEnabled(!!callIdInput?.value);
          setResultError(undefined);
        }

        if (e.code === 'Escape' && showDropdown) {
          setShowDropdown(false);
        }
      },
      [
        callTypeInput,
        callIdInput,
        showDropdown,
        highlightedOption,
        setResultError,
      ],
    );

  useEffect(() => {
    const { callCid } = router.query;

    if (callCid?.length && typeof callCid !== 'string') {
      const [callType, callId] = callCid;
      if (!(callId && callType && callIdInput && callTypeInput)) return;

      callTypeInput.value = callType as string;
      callIdInput.value = callId as string;
      queryRecordings(callType, callId);
    }
  }, [callIdInput, callTypeInput, router, router.query, queryRecordings]);

  const formId = 'recording-search-form';
  return (
    <Stack spacing={2} alignItems="center" padding={2} maxWidth={'300px'}>
      <form onSubmit={handleSubmit} id={formId}>
        <Stack direction="row">
          <div className="rd__call-type-dropdown-container">
            <input
              form={formId}
              ref={setCallTypeInput}
              className="rd__input rd__input--underlined rd__call-recording-search-input"
              type="text"
              onChange={handleChange}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 100)}
              onKeyDown={handleDropdownNavigation}
              placeholder="Call Type"
              tabIndex={1}
            />
            {showDropdown && (
              <div className="rd__call-recording-search-input__call-type-dropdown">
                {CALL_TYPES.map((callType, i) => (
                  <div
                    className={clsx('rd__call-recording-search-input__option', {
                      'rd__call-recording-search-input__option--highlighted':
                        i === highlightedOption,
                    })}
                    key={callType}
                    onClick={() => {
                      if (!callTypeInput) return;
                      callTypeInput.value = callType;
                    }}
                  >
                    {callType}
                  </div>
                ))}
              </div>
            )}
          </div>
          <span>:</span>
          <input
            form={formId}
            className="rd__input rd__input--underlined rd__call-recording-search-input"
            type="text"
            onChange={handleChange}
            ref={setCallIdInput}
            placeholder="Call ID"
            tabIndex={2}
          />
        </Stack>
        <Button
          className="rd__call-recording-search-submit-button"
          type="submit"
          variant="contained"
          sx={{ marginTop: '1rem' }}
          disabled={!enabled}
          fullWidth
          tabIndex={3}
        >
          Go
        </Button>
      </form>
    </Stack>
  );
};
