To make it sound natural, intelligible, low-latency, and difficult to reverse, you need a processing pipeline—not one distortion algorithm.

## Recommended algorithm stack

### 1. Voice activity detection

Detects when the person is speaking so the system doesn’t transform silence and amplify background noise.

Good options:

* WebRTC VAD
* Silero VAD
* RNNoise VAD

Target frame size: 10–20 ms.

### 2. Noise and echo removal

Background sounds may reveal identity or location, while echo makes subsequent processing unstable.

Use:

* WebRTC Acoustic Echo Cancellation
* RNNoise or DeepFilterNet for noise suppression
* Automatic gain control
* High-pass filter around 70–100 Hz

In browser-to-browser WebRTC, retain built-in `echoCancellation`, but test whether browser noise suppression conflicts with your custom processing.

### 3. Fundamental-frequency estimation

The system needs to estimate the speaker’s pitch, or fundamental frequency \(F_0\), before changing it naturally.

Useful algorithms:

* YIN or pYIN: reliable classical algorithms
* CREPE: neural pitch estimation
* RMVPE: strong for neural voice conversion
* Harvest/DIO from WORLD vocoder

For lightweight browser processing, YIN is practical. For a server or native application, RMVPE is generally stronger.

### 4. Pitch transformation

Changes perceived voice height while preserving timing.

Possible algorithms:

| Algorithm         |           Quality |  Latency | Best use                 |
| ----------------- | ----------------: | -------: | ------------------------ |
| PSOLA             |   High for speech |      Low | Real-time speech         |
| WSOLA             |              Good | Very low | Time/pitch processing    |
| Phase vocoder     |     Moderate–high | Moderate | General audio            |
| WORLD vocoder     |              High | Moderate | Server/native processing |
| Neural conversion | Highest potential |   Higher | Strong anonymization     |

For WebRTC, use PSOLA or a carefully tuned phase vocoder. A basic playback-rate change is unsuitable because it also changes speaking speed.

### 5. Formant transformation

This is crucial. Formants represent the resonances created by the vocal tract and are strongly associated with perceived vocal identity.

Useful approaches:

* LPC—Linear Predictive Coding
* Cepstral envelope estimation
* WORLD spectral-envelope transformation
* Phase-vocoder formant preservation/shifting
* Neural speaker-embedding removal

Pitch and formants should be controlled separately. For example:

```text
Pitch:   -3.7 semitones
Formant: +12%
```

Changing only pitch often produces the recognizable “same person with a voice filter” effect.

### 6. Spectral-envelope transformation

Alter the overall vocal timbre while preserving consonants and word clarity.

Possible methods:

* LPC spectral warping
* Mel-frequency spectral-envelope shifting
* Vocal-tract-length perturbation
* Frequency-axis warping

A common frequency-warping model is:

$$
f' = \alpha f
$$

where \(\alpha\) might be approximately `0.88–1.12`. Extreme values reduce intelligibility.

### 7. Prosody transformation

People can be recognized through rhythm and delivery even after pitch and formants change.

Transform subtly:

* Pitch contour
* Speaking-rate microvariations
* Energy contour
* Syllable timing
* Pauses

Do not flatten all prosody; it produces a robotic voice. Instead, normalize the contour and apply small controlled changes.

### 8. Dynamic parameter randomization

A single fixed transformation creates a consistent anonymous identity that may eventually be linked across calls.

Generate a transformation profile per call:

```javascript
{
  pitchSemitones: -3.6,
  formantScale: 1.09,
  spectralWarp: 0.94,
  prosodyScale: 1.04
}
```

Smoothly interpolate parameters rather than changing them suddenly. Abrupt changes cause clicking, warbling and unnatural speech.

If callers should remain recognizable to the same counsellor across sessions, derive the profile from a protected pseudonymous identifier. Otherwise, randomize it for every call.

### 9. Artifact suppression

Voice transformation introduces metallic ringing, phase distortion and clicks. Clean the result using:

* Phase locking
* Transient preservation
* Overlap-add windowing
* Spectral smoothing
* De-essing
* Limiting
* Click suppression

Use Hann windows with overlapping frames when implementing STFT-based processing.

### 10. Output normalization and encoding

Before sending the processed audio:

* Apply gentle compression
* Set a limiter around −1 dBFS
* Prevent clipping
* Maintain 48 kHz audio
* Let WebRTC encode using Opus
* Use discontinuous transmission carefully, because it can clip soft speech

## Best architecture

For a strong first version running entirely in the browser:

```text
Microphone
→ WebRTC echo cancellation
→ VAD
→ noise suppression
→ YIN pitch detection
→ PSOLA pitch shifting
→ LPC formant/spectral warping
→ subtle prosody adjustment
→ compressor and limiter
→ Opus/WebRTC
```

This can achieve low latency, but it will still sound like a processed human voice.

For higher-quality anonymization:

```text
Microphone
→ cleanup
→ content/speech encoder
→ speaker-identity removal
→ synthetic anonymous speaker embedding
→ neural vocoder
→ WebRTC
```

Candidate model families include:

* FreeVC
* OpenVoice-style voice conversion
* AutoVC
* StarGAN-VC
* ContentVec or HuBERT content encoders
* HiFi-GAN or BigVGAN vocoders

However, these models require careful optimization using ONNX Runtime, Core ML, TensorRT or WebGPU. Unoptimized neural conversion can add several hundred milliseconds of latency.

## What I would use for Zumbarl

I would build two stages:

1. Start with WebRTC VAD + RNNoise + PSOLA + LPC formant shifting. It is affordable, device-side and low-latency.
2. Later introduce an optimized neural anonymizer that converts all callers into several generic, non-celebrity synthetic voices.

Measure three things during development:

* Intelligibility: word-error rate using speech recognition
* Naturalness: listener ratings or MOS
* Privacy: whether a speaker-recognition model can still match the processed voice to the original

The privacy test is essential. A filter that sounds different to humans may still retain enough biometric information for speaker-recognition software. There is no flawless guarantee, but the goal should be a low speaker-verification match rate while maintaining acceptable word intelligibility.
