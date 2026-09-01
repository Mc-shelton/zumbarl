Based on the three Voice Shield documents—not a full application-wide audit—the calling workflow is substantially implemented, but the original recognition-resistant audio pipeline is still early.

### Progress summary

| Area | Progress | Assessment |
|---|---:|---|
| Support-circle calling experience | ~80% | Functional |
| Beta client-side Voice Shield | ~70% | Functional disguise |
| Original DSP/anonymization pipeline | ~30% | Major stages missing |
| Release-gate validation | 0 of 5 gates | Not production-qualified |
| Overall original Voice Shield plan | ~40% | Beta, not identity-protecting |

These percentages are checklist estimates, not test-derived metrics.

### What has been implemented

- Microphone capture with echo cancellation, browser noise suppression, automatic gain control, mono audio, and requested 48 kHz sampling.
- Local AudioWorklet-based pitch processing using SoundTouch.
- An 82 Hz high-pass filter, two mild timbre/EQ filters, and compression.
- Three non-gendered profiles: Cedar, River, and Sunbird.
- Small per-session randomization of pitch and EQ parameters.
- Processed audio routed through `MediaStreamAudioDestinationNode`.
- Only the destination stream is handed to lower-level `lib-jitsi-meet`.
- No Jitsi iframe microphone path.
- Processor and microphone failures stop the source and output tracks.
- Tracks, AudioContext, conference, and connection are destroyed on exit.
- Explicit Voice Shield/natural-voice selection and acknowledgement before entry.
- Correct “Voice Shield beta” and “disguise, not anonymity” language.
- Audio-only rooms, aliases, participant roster, mute/leave controls, waiting-room approval, participant counts, and expiring rooms.
- No Jibri or Jigasi service is deployed, so Zumbarl currently provides no server recording or transcription.

The implemented audio chain is visible in [createVoiceShieldStream.js](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl.com/src/features/calls/createVoiceShieldStream.js:16), and processed-track publication is in [VoiceShieldConference.jsx](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl.com/src/features/calls/VoiceShieldConference.jsx:86).

### What remains from the original DSP plan

The original first-stage recommendation was:

`WebRTC VAD → RNNoise → PSOLA → LPC formant shifting`

That plan is documented in [voice_shield_pipeline_ai_prop.md](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/docs/voice_shield_pipeline_ai_prop.md:201). The current implementation is closer to:

`Browser cleanup → high-pass → SoundTouch pitch → EQ → compressor`

The following components have not been implemented:

- Explicit voice-activity detection such as WebRTC VAD, Silero, or RNNoise VAD.
- Dedicated RNNoise or DeepFilterNet cleanup.
- Fundamental-frequency estimation using YIN, pYIN, CREPE, or RMVPE.
- PSOLA-based speech transformation.
- Independent formant shifting using LPC or another formant-aware algorithm.
- Vocal-tract-length or spectral-envelope warping.
- Prosody processing for cadence, pause, energy, or timing changes.
- Parameter interpolation for transformations that change during speech.
- Explicit de-essing, transient preservation, spectral smoothing, and click suppression.
- A true output limiter near −1 dBFS.
- Neural speaker-identity removal or synthetic speaker embeddings.

The missing formant and prosody stages are particularly important: pitch shifting alone can still sound like the same recognizable person with a filter.

### Product and security gaps

1. Conferencing access is not enforced by Jitsi itself.

   The API checks membership before returning the room, but Jitsi authentication is disabled. Anyone who obtains the underlying room URL can potentially bypass the application and connect directly. Rooms should use short-lived signed JWTs tied to the circle, student, alias, and expiry.

2. Alias-only participation is not enforced.

   The architecture says moderators should receive the stable circle alias, but the UI permits profile-name participation and disabling aliases. See [SupportCirclePage.jsx](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl.com/src/pages/SupportCirclePage.jsx:368).

3. Shield status is only reliably visible to the local participant.

   Other participants see an alias and “In the circle,” but they are not told whether that person is shielded or using their natural voice. The product rule requires persistent shield status for every participant.

4. Safeguarding identity access is not implemented as a dedicated audited workflow.

   The database internally connects memberships to student accounts, but there is no narrow safeguarding endpoint with reason capture, authorized roles, immutable audit events, and notification/review controls.

5. Membership rules diverge from the document.

   The architecture says rooms are restricted to active members, but scheduled calls can be configured with `membersOnly: false`. The desired policy needs to be resolved and consistently enforced.

6. Recording protections should be explicit.

   Recording/transcription infrastructure is not running, which is good, but the configuration should explicitly set all recording, local recording, service recording, and transcription flags to disabled.

### Release gates still outstanding

None of the five release gates in [voice-shield-architecture.md](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/docs/voice-shield-architecture.md:34) currently has an implemented test suite or recorded evidence:

- Speaker re-identification testing.
- Intelligibility/WER for Kenyan English, Kiswahili, and code-switching.
- Latency and quality measurements on low-cost Android devices and weak networks.
- Accessibility testing for speech differences and assistive devices.
- Automated failure-closed testing for crashes, stalls, permission loss, and disconnections.

There are also no dedicated unit or end-to-end tests for `createVoiceShieldStream`, profile randomization, raw-track isolation, or two-client Jitsi calling.

### Recommended next order

1. Secure rooms with Jitsi JWT authentication and enforce alias-only support-circle identity.
2. Add explicit VAD/RNNoise, formant transformation, limiter, and processing-stall watchdog.
3. Broadcast every participant’s shield/natural-voice status.
4. Build the five release-gate test harnesses and collect baseline measurements.
5. Implement audited safeguarding identity access.
6. Only after the classical pipeline is measured, consider the neural anonymizer.

Until those are complete, the current product should remain labeled exactly as it is: **Voice Shield beta—a voice disguise, not guaranteed anonymity.**