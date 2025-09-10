import { CallCreatedEvent, CallRingEvent } from '../gen/coordinator';

export const CallCreatedPayload: CallCreatedEvent = {
  type: 'call.created',
  created_at: '2025-08-14T14:48:39.988853336Z',
  call_cid: 'default:h6c44o00NeFTH6IvsGGgM',
  call: {
    type: 'default',
    id: 'h6c44o00NeFTH6IvsGGgM',
    cid: 'default:h6c44o00NeFTH6IvsGGgM',
    current_session_id: '',
    created_by: {
      id: 'oliver_1',
      name: 'Oliver Lazoroski',
      image:
        'https://lh3.googleusercontent.com/a/ACg8ocJLHHaOnen-0xmJir7r65nPKpIVnF6TTvpX0QbFSXjGa8WWF9Y=s96-c',
      custom: {
        imageUrl:
          'https://ca.slack-edge.com/T02RM6X6B-U03HJKTMSQZ-cdf636547793-512',
      },
      language: '',
      role: 'user',
      teams: [],
      created_at: '2024-01-10T14:46:46.567417Z',
      updated_at: '2025-08-14T14:48:32.808624Z',
      // @ts-expect-error outdated types
      banned: false,
      online: false,
      last_active: '2025-08-12T11:50:03.973174Z',
      blocked_user_ids: [],
    },
    custom: {},
    created_at: '2025-08-14T14:48:39.958024Z',
    updated_at: '2025-08-14T14:48:39.958024Z',
    recording: false,
    transcribing: false,
    captioning: false,
    ended_at: null,
    starts_at: null,
    backstage: false,
    settings: {
      audio: {
        access_request_enabled: true,
        opus_dtx_enabled: true,
        redundant_coding_enabled: true,
        mic_default_on: true,
        speaker_default_on: true,
        default_device: 'speaker',
        noise_cancellation: {
          mode: 'auto-on',
        },
      },
      backstage: {
        enabled: false,
      },
      broadcasting: {
        enabled: true,
        hls: {
          auto_on: false,
          enabled: true,
          quality_tracks: ['720p'],
        },
        rtmp: {
          enabled: true,
          quality: '720p',
        },
      },
      geofencing: {
        names: [],
      },
      recording: {
        audio_only: false,
        mode: 'available',
        quality: '1080p',
      },
      frame_recording: {
        mode: 'auto-on',
        quality: '720p',
        capture_interval_in_seconds: 3,
      },
      ring: {
        incoming_call_timeout_ms: 60000,
        auto_cancel_timeout_ms: 60000,
        missed_call_timeout_ms: 5000,
      },
      screensharing: {
        enabled: true,
        access_request_enabled: true,
        target_resolution: null,
      },
      transcription: {
        mode: 'auto-on',
        closed_caption_mode: 'auto-on',
        // languages: [],
        language: 'en',
      },
      video: {
        enabled: true,
        access_request_enabled: true,
        target_resolution: {
          width: 1280,
          height: 720,
          bitrate: 1500000,
        },
        camera_default_on: true,
        camera_facing: 'front',
      },
      thumbnails: {
        enabled: true,
      },
      limits: {
        max_participants: null,
        // @ts-expect-error outdated types
        max_participants_exclude_roles: [],
        max_duration_seconds: null,
      },
      session: {
        inactivity_timeout_seconds: 30,
      },
      ingress: {
        enabled: true,
        audio_encoding_options: {
          channels: 2,
          enable_dtx: false,
          bitrate: 128000,
        },
        video_encoding_options: {
          '1280x720x30': {
            layers: [
              {
                codec: 'h264',
                bitrate: 3000000,
                min_dimension: 720,
                max_dimension: 1280,
                frame_rate_limit: 30,
              },
              {
                codec: 'h264',
                bitrate: 1000000,
                min_dimension: 600,
                max_dimension: 800,
                frame_rate_limit: 30,
              },
              {
                codec: 'h264',
                bitrate: 500000,
                min_dimension: 360,
                max_dimension: 640,
                frame_rate_limit: 30,
              },
            ],
          },
          '1920x1080x30': {
            layers: [
              {
                codec: 'h264',
                bitrate: 4000000,
                min_dimension: 1080,
                max_dimension: 1920,
                frame_rate_limit: 30,
              },
              {
                codec: 'h264',
                bitrate: 3000000,
                min_dimension: 720,
                max_dimension: 1280,
                frame_rate_limit: 30,
              },
              {
                codec: 'h264',
                bitrate: 1000000,
                min_dimension: 600,
                max_dimension: 800,
                frame_rate_limit: 30,
              },
            ],
          },
          '2560x1440x30': {
            layers: [
              {
                codec: 'h264',
                bitrate: 6000000,
                min_dimension: 1440,
                max_dimension: 2560,
                frame_rate_limit: 30,
              },
              {
                codec: 'h264',
                bitrate: 4000000,
                min_dimension: 1080,
                max_dimension: 1920,
                frame_rate_limit: 30,
              },
              {
                codec: 'h264',
                bitrate: 2000000,
                min_dimension: 720,
                max_dimension: 1280,
                frame_rate_limit: 30,
              },
            ],
          },
          '3840x2160x30': {
            layers: [
              {
                codec: 'h264',
                bitrate: 18000000,
                min_dimension: 2160,
                max_dimension: 3840,
                frame_rate_limit: 30,
              },
              {
                codec: 'h264',
                bitrate: 8000000,
                min_dimension: 1080,
                max_dimension: 1920,
                frame_rate_limit: 30,
              },
              {
                codec: 'h264',
                bitrate: 2000000,
                min_dimension: 720,
                max_dimension: 1280,
                frame_rate_limit: 30,
              },
            ],
          },
        },
      },
    },
    blocked_user_ids: [],
    ingress: {
      rtmp: {
        address:
          'rtmps://ingress.stream-io-video.com:443/par8f5s3gn2j.default.h6c44o00NeFTH6IvsGGgM',
      },
    },
    session: null,
    egress: {
      broadcasting: false,
      hls: null,
      rtmps: [],
      frame_recording: null,
    },
    thumbnails: {
      image_url:
        'https://us-east.stream-io-cdn.com/1270131/images/default/h6c44o00NeFTH6IvsGGgM/preview/thumbnail.jpg?Key-Pair-Id=APKAIHG36VEWPDULE23Q&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly91cy1lYXN0LnN0cmVhbS1pby1jZG4uY29tLzEyNzAxMzEvaW1hZ2VzL2RlZmF1bHQvaDZjNDRvMDBOZUZUSDZJdnNHR2dNL3ByZXZpZXcvdGh1bWJuYWlsLmpwZyoiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3NTU0NDIxMTl9fX1dfQ__&Signature=ladoiTTWl8bbnSqEDswKUIQ1hbY1kVbDFuHS4mZgHBcv-L1hJ13q1UE5fKBCMbqGvrL~9AzLTYFpX2AwhX85JYRvTESHxfqqQyrSiFf9FLMmZMbi2ro-YBJOeFRE3Iz2~jVcqr~HAw26mHfcM74CMMv3cCQGBToXtYgdfUuN-snPWQidfnRGReDN6slb8mga0gufw4UoJr~WLWLc6nNYPyuYRcGMj4dghRtQiCcyfGXtuOc~Hjlnh8DTZgPY09QZlX7HwqyENfP4~qEHnMsRyZBfzqFk4mT-T~HDd3v26Ruf3clVETjdKTH4xzd2D1fpFF0Q8YjtWrS0NK1qW3pc9w__',
    },
    join_ahead_time_seconds: 0,
    channel_cid: null,
  },
  members: [
    {
      user: {
        id: 'marcelo',
        name: 'marcelo',
        image:
          'https://getstream.io/static/aaf5fb17dcfd0a3dd885f62bd21b325a/802d2/marcelo-pires.webp',
        custom: {
          imageUrl: 'https://getstream.io/random_png/?id=marcelo&name=marcelo',
        },
        language: '',
        role: 'user',
        teams: [],
        created_at: '2024-01-10T13:26:19.889536Z',
        updated_at: '2025-08-07T07:35:43.81976Z',
        // @ts-expect-error outdated types
        banned: false,
        online: false,
        last_active: '2025-08-07T04:30:50.670932Z',
        blocked_user_ids: [],
      },
      user_id: 'marcelo',
      custom: {},
      created_at: '2025-08-14T14:48:39.9691Z',
      updated_at: '2025-08-14T14:48:39.9691Z',
    },
    {
      user: {
        id: 'oliver',
        name: 'Oliver Lazoroski',
        image:
          'https://lh3.googleusercontent.com/a/ACg8ocJLHHaOnen-0xmJir7r65nPKpIVnF6TTvpX0QbFSXjGa8WWF9Y=s96-c',
        custom: {
          imageUrl:
            'https://ca.slack-edge.com/T02RM6X6B-U03HJKTMSQZ-cdf636547793-512',
        },
        language: '',
        role: 'user',
        teams: [],
        created_at: '2024-01-10T14:46:46.567417Z',
        updated_at: '2025-08-14T14:48:32.808624Z',
        // @ts-expect-error outdated types
        banned: false,
        online: false,
        last_active: '2025-08-12T11:50:03.973174Z',
        blocked_user_ids: [],
      },
      user_id: 'oliver',
      custom: {},
      created_at: '2025-08-14T14:48:39.9691Z',
      updated_at: '2025-08-14T14:48:39.9691Z',
    },
  ],
  received_at: '2025-08-14T14:48:39.973Z',
};

export const CallRingPayload: CallRingEvent = {
  type: 'call.ring',
  created_at: '2025-08-14T14:48:40.006646269Z',
  call_cid: 'default:h6c44o00NeFTH6IvsGGgM',
  session_id: 'b8a44039-41f3-4570-a438-187d6df65671',
  call: {
    type: 'default',
    id: 'h6c44o00NeFTH6IvsGGgM',
    cid: 'default:h6c44o00NeFTH6IvsGGgM',
    current_session_id: 'b8a44039-41f3-4570-a438-187d6df65671',
    created_by: {
      id: 'oliver_1',
      name: 'Oliver Lazoroski',
      image:
        'https://lh3.googleusercontent.com/a/ACg8ocJLHHaOnen-0xmJir7r65nPKpIVnF6TTvpX0QbFSXjGa8WWF9Y=s96-c',
      custom: {
        imageUrl:
          'https://ca.slack-edge.com/T02RM6X6B-U03HJKTMSQZ-cdf636547793-512',
      },
      language: '',
      role: 'user',
      teams: [],
      created_at: '2024-01-10T14:46:46.567417Z',
      updated_at: '2025-08-14T14:48:32.808624Z',
      // @ts-expect-error outdated types
      banned: false,
      online: false,
      last_active: '2025-08-12T11:50:03.973174Z',
      blocked_user_ids: [],
    },
    custom: {},
    created_at: '2025-08-14T14:48:39.958024Z',
    updated_at: '2025-08-14T14:48:39.958024Z',
    recording: false,
    transcribing: false,
    captioning: false,
    ended_at: null,
    starts_at: null,
    backstage: false,
    settings: {
      audio: {
        access_request_enabled: true,
        opus_dtx_enabled: true,
        redundant_coding_enabled: true,
        mic_default_on: true,
        speaker_default_on: true,
        default_device: 'speaker',
        noise_cancellation: {
          mode: 'auto-on',
        },
      },
      backstage: {
        enabled: false,
      },
      broadcasting: {
        enabled: true,
        hls: {
          auto_on: false,
          enabled: true,
          quality_tracks: ['720p'],
        },
        rtmp: {
          enabled: true,
          quality: '720p',
        },
      },
      geofencing: {
        names: [],
      },
      recording: {
        audio_only: false,
        mode: 'available',
        quality: '1080p',
      },
      frame_recording: {
        mode: 'auto-on',
        quality: '720p',
        capture_interval_in_seconds: 3,
      },
      ring: {
        incoming_call_timeout_ms: 60000,
        auto_cancel_timeout_ms: 60000,
        missed_call_timeout_ms: 5000,
      },
      screensharing: {
        enabled: true,
        access_request_enabled: true,
        target_resolution: null,
      },
      transcription: {
        mode: 'auto-on',
        closed_caption_mode: 'auto-on',
        // @ts-expect-error outdated types
        languages: [],
        language: 'en',
      },
      video: {
        enabled: true,
        access_request_enabled: true,
        target_resolution: {
          width: 1280,
          height: 720,
          bitrate: 1500000,
        },
        camera_default_on: true,
        camera_facing: 'front',
      },
      thumbnails: {
        enabled: true,
      },
      limits: {
        max_participants: null,
        // @ts-expect-error outdated types
        max_participants_exclude_roles: [],
        max_duration_seconds: null,
      },
      session: {
        inactivity_timeout_seconds: 30,
      },
      ingress: {
        enabled: true,
        audio_encoding_options: {
          channels: 2,
          enable_dtx: false,
          bitrate: 128000,
        },
        video_encoding_options: {
          '1280x720x30': {
            layers: [
              {
                codec: 'h264',
                bitrate: 3000000,
                min_dimension: 720,
                max_dimension: 1280,
                frame_rate_limit: 30,
              },
              {
                codec: 'h264',
                bitrate: 1000000,
                min_dimension: 600,
                max_dimension: 800,
                frame_rate_limit: 30,
              },
              {
                codec: 'h264',
                bitrate: 500000,
                min_dimension: 360,
                max_dimension: 640,
                frame_rate_limit: 30,
              },
            ],
          },
          '1920x1080x30': {
            layers: [
              {
                codec: 'h264',
                bitrate: 4000000,
                min_dimension: 1080,
                max_dimension: 1920,
                frame_rate_limit: 30,
              },
              {
                codec: 'h264',
                bitrate: 3000000,
                min_dimension: 720,
                max_dimension: 1280,
                frame_rate_limit: 30,
              },
              {
                codec: 'h264',
                bitrate: 1000000,
                min_dimension: 600,
                max_dimension: 800,
                frame_rate_limit: 30,
              },
            ],
          },
          '2560x1440x30': {
            layers: [
              {
                codec: 'h264',
                bitrate: 6000000,
                min_dimension: 1440,
                max_dimension: 2560,
                frame_rate_limit: 30,
              },
              {
                codec: 'h264',
                bitrate: 4000000,
                min_dimension: 1080,
                max_dimension: 1920,
                frame_rate_limit: 30,
              },
              {
                codec: 'h264',
                bitrate: 2000000,
                min_dimension: 720,
                max_dimension: 1280,
                frame_rate_limit: 30,
              },
            ],
          },
          '3840x2160x30': {
            layers: [
              {
                codec: 'h264',
                bitrate: 18000000,
                min_dimension: 2160,
                max_dimension: 3840,
                frame_rate_limit: 30,
              },
              {
                codec: 'h264',
                bitrate: 8000000,
                min_dimension: 1080,
                max_dimension: 1920,
                frame_rate_limit: 30,
              },
              {
                codec: 'h264',
                bitrate: 2000000,
                min_dimension: 720,
                max_dimension: 1280,
                frame_rate_limit: 30,
              },
            ],
          },
        },
      },
    },
    blocked_user_ids: [],
    ingress: {
      rtmp: {
        address:
          'rtmps://ingress.stream-io-video.com:443/par8f5s3gn2j.default.h6c44o00NeFTH6IvsGGgM',
      },
    },
    session: {
      id: 'b8a44039-41f3-4570-a438-187d6df65671',
      started_at: null,
      ended_at: null,
      participants: [],
      participants_count_by_role: {},
      anonymous_participant_count: 0,
      rejected_by: {},
      accepted_by: {},
      missed_by: {},
      live_started_at: null,
      live_ended_at: null,
      timer_ends_at: null,
    },
    egress: {
      broadcasting: false,
      hls: null,
      rtmps: [],
      frame_recording: null,
    },
    thumbnails: {
      image_url:
        'https://us-east.stream-io-cdn.com/1270131/images/default/h6c44o00NeFTH6IvsGGgM/preview/thumbnail.jpg?Key-Pair-Id=APKAIHG36VEWPDULE23Q&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly91cy1lYXN0LnN0cmVhbS1pby1jZG4uY29tLzEyNzAxMzEvaW1hZ2VzL2RlZmF1bHQvaDZjNDRvMDBOZUZUSDZJdnNHR2dNL3ByZXZpZXcvdGh1bWJuYWlsLmpwZyoiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3NTU0NDIxMTl9fX1dfQ__&Signature=ladoiTTWl8bbnSqEDswKUIQ1hbY1kVbDFuHS4mZgHBcv-L1hJ13q1UE5fKBCMbqGvrL~9AzLTYFpX2AwhX85JYRvTESHxfqqQyrSiFf9FLMmZMbi2ro-YBJOeFRE3Iz2~jVcqr~HAw26mHfcM74CMMv3cCQGBToXtYgdfUuN-snPWQidfnRGReDN6slb8mga0gufw4UoJr~WLWLc6nNYPyuYRcGMj4dghRtQiCcyfGXtuOc~Hjlnh8DTZgPY09QZlX7HwqyENfP4~qEHnMsRyZBfzqFk4mT-T~HDd3v26Ruf3clVETjdKTH4xzd2D1fpFF0Q8YjtWrS0NK1qW3pc9w__',
    },
    join_ahead_time_seconds: 0,
    channel_cid: null,
  },
  members: [
    {
      user: {
        id: 'marcelo',
        name: 'marcelo',
        image:
          'https://getstream.io/static/aaf5fb17dcfd0a3dd885f62bd21b325a/802d2/marcelo-pires.webp',
        custom: {
          imageUrl: 'https://getstream.io/random_png/?id=marcelo&name=marcelo',
        },
        language: '',
        role: 'user',
        teams: [],
        created_at: '2024-01-10T13:26:19.889536Z',
        updated_at: '2025-08-07T07:35:43.81976Z',
        // @ts-expect-error outdated types
        banned: false,
        online: false,
        last_active: '2025-08-07T04:30:50.670932Z',
        blocked_user_ids: [],
      },
      user_id: 'marcelo',
      custom: {},
      created_at: '2025-08-14T14:48:39.9691Z',
      updated_at: '2025-08-14T14:48:39.9691Z',
    },
  ],
  user: {
    id: 'oliver',
    name: 'Oliver Lazoroski',
    image:
      'https://lh3.googleusercontent.com/a/ACg8ocJLHHaOnen-0xmJir7r65nPKpIVnF6TTvpX0QbFSXjGa8WWF9Y=s96-c',
    custom: {
      imageUrl:
        'https://ca.slack-edge.com/T02RM6X6B-U03HJKTMSQZ-cdf636547793-512',
    },
    language: '',
    role: 'user',
    teams: [],
    created_at: '2024-01-10T14:46:46.567417Z',
    updated_at: '2025-08-14T14:48:32.808624Z',
    // @ts-expect-error outdated types
    banned: false,
    online: false,
    last_active: '2025-08-12T11:50:03.973174Z',
    blocked_user_ids: [],
  },
  video: false,
  received_at: '2025-08-14T14:48:39.990Z',
};
