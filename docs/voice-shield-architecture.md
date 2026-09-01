# Voice Shield for wellbeing circles

## Current beta implementation

Support-circle audio rooms are audio-only, short-lived, limited to active circle members, and use the member's circle alias as their conferencing display name. The browser now applies a local Voice Shield before the call, but it must never describe disguised audio as anonymous audio.

## Required media path

The recognition-resistant version must replace the embedded conferencing microphone path:

1. Capture microphone audio locally with `getUserMedia`.
2. Process it locally in an `AudioWorklet` or audited WASM voice-conversion module.
3. Route only the processed output through a `MediaStreamAudioDestinationNode`.
4. Publish that processed track through the lower-level `lib-jitsi-meet` client connected to the self-hosted conferencing backend.
5. Stop and close the microphone if processing fails. Never silently fall back to the natural voice.

The support-circle room does not use Jitsi's iframe. It captures the microphone with browser audio constraints, transforms pitch in an `AudioWorklet`, applies mild filtering and compression, and passes only the destination stream to `JitsiMeetJS.createLocalTracksFromMediaStreams`. The raw microphone stream is stopped on exit or processor failure and is never connected to the conference client or speakers.

Three non-gendered profiles—Cedar, River, and Sunbird—use slightly randomized parameters that remain stable for one room session. This reduces reliance on one globally fixed preset, but it is still a disguise rather than a formal anonymity guarantee. Pitch and timbre processing cannot remove identifying cadence, accent, word choice, disclosed details, or background sound.

## Product rules

- Voice Shield is opt-in and the selected sound profile is shown before joining.
- Every participant sees a persistent shield status while speaking.
- No raw microphone stream is sent to Zumbarl or the conference.
- No call recording or transcription is enabled by Zumbarl in support circles.
- Members are reminded that another participant can still make an external recording.
- Moderators receive the stable circle alias, never a public profile identity.
- Safeguarding access remains a separate, audited server-side process.
- Students can leave instantly and the microphone track is destroyed on exit.

## Release gate

Do not call the feature identity-protecting until it has been tested for:

- speaker re-identification against original and transformed samples;
- intelligibility across Kenyan English, Kiswahili and common code-switching;
- latency and audio quality on low-cost Android devices and weak networks;
- accessibility for speech differences and assistive audio devices;
- failure-closed behavior when processing crashes, stalls or loses permission.

Until those checks pass, the UI must call the feature **Voice Shield beta**, explain that it disguises rather than anonymizes, and require explicit acknowledgement before opening the microphone.
