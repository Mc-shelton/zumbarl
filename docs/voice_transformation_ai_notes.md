Yes—you can disguise a caller’s voice before it enters the WebRTC connection while keeping speech understandable.

The processing flow is:

```text
Microphone → voice transformation → processed audio track → WebRTC → recipient
```

In a browser, capture the microphone with `getUserMedia()`, process it through the Web Audio API or an audio-processing library, convert the output back into a `MediaStream`, and send that processed track through `RTCPeerConnection`.

For effective anonymization, don’t merely change pitch. Pitch alone often sounds artificial and leaves recognizable speech patterns intact. Combine:

* Pitch shifting: approximately ±3–6 semitones
* Formant shifting: changes perceived vocal-tract size without making speech too “chipmunk-like”
* Mild EQ: modifies the vocal timbre
* Light compression: keeps words consistently audible
* Optional subtle modulation or spectral smoothing
* Removal or suppression of background noise, since location sounds can identify someone

Conceptual browser code:

```javascript
const micStream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
});

const audioContext = new AudioContext();
const source = audioContext.createMediaStreamSource(micStream);

// A real implementation would use an AudioWorklet containing
// a pitch/formant shifting algorithm.
await audioContext.audioWorklet.addModule("/voice-anonymizer.js");

const anonymizer = new AudioWorkletNode(
  audioContext,
  "voice-anonymizer",
  {
    parameterData: {
      pitchShift: -4,
      formantShift: 1.15
    }
  }
);

const destination = audioContext.createMediaStreamDestination();

source.connect(anonymizer);
anonymizer.connect(destination);

const processedTrack = destination.stream.getAudioTracks()[0];

peerConnection.addTrack(
  processedTrack,
  destination.stream
);
```

The important component is `/voice-anonymizer.js`. An `AudioWorklet` operates on tiny audio frames away from the browser’s main thread, reducing glitches. Inside it, you would implement or integrate DSP such as phase-vocoder, PSOLA, or SoundTouch-style pitch processing.

Practical targets:

| Property                     |               Recommended target |
| ---------------------------- | -------------------------------: |
| Added processing latency     |                   Under 40–60 ms |
| Total conversational latency |                     Under 200 ms |
| Sample rate                  |                           48 kHz |
| Frame size                   |                  128–512 samples |
| Codec                        |                      WebRTC Opus |
| Pitch shift                  | Randomized within ±3–6 semitones |
| Formant shift                |               Roughly 0.85–1.20× |

A few important limitations:

* A distorted voice is pseudonymous, not guaranteed anonymous.
* Speaking rhythm, accent, vocabulary, catchphrases, background sounds and disclosed information can still identify someone.
* A fixed transformation may potentially be analysed or learned from several recordings.
* Stronger protection comes from subtly varying transformation parameters between calls—or gradually within safe ranges—while preserving intelligibility.
* Do not expose the original microphone track anywhere in the WebRTC sender. Replace or add only the processed track.
* Make the voice masking obvious to participants; secretly impersonating someone or recording them may create legal and consent issues.

For something like anonymous student counselling in Zumbarl, I’d offer three preset voices—lower, neutral and higher—then randomize the exact pitch/formant parameters behind each preset. That protects the caller without turning the conversation into a distracting robotic effect.
