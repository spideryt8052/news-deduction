/**
 * TruthShield Audio & Beat Studio Service
 * 
 * Provides:
 * 1. Procedural Web Audio Beat Synthesizer (Lo-Fi Chill, Breaking News Pulse, Cinematic Drama, Boom-Bap, Zen)
 * 2. Real-time background music playback with volume ducking for narration
 * 3. Offline Audio Mixing: Combines voice narration + background beat into downloadable 16-bit 44.1kHz stereo WAV
 * 4. Custom Beat Audio File importer (MP3 / WAV)
 * 5. Suno AI song template / prompt builder
 */

// Beat Presets Definition
export const BEAT_PRESETS = [
  {
    id: 'none',
    name: 'Voice Only (नो बीट)',
    bpm: 0,
    desc: 'Pure clean voice narration without music',
    color: 'from-gray-500 to-gray-700',
    icon: 'mic',
  },
  {
    id: 'lofi',
    name: 'Lo-Fi Chill (लो-फाई चिल)',
    bpm: 80,
    desc: 'Soft jazz Rhodes chords, vinyl warmth & relaxing drum groove',
    color: 'from-purple-500 to-indigo-600',
    icon: 'headphones',
  },
  {
    id: 'news',
    name: 'Breaking News Pulse (न्यूज़ पल्स)',
    bpm: 120,
    desc: 'Electronic broadcast bassline & fast synth clockwork ticks',
    color: 'from-blue-500 to-cyan-600',
    icon: 'radio',
  },
  {
    id: 'cinematic',
    name: 'Cinematic Ambient (सिनेमैटिक)',
    bpm: 72,
    desc: 'Deep atmospheric string pad swells & dramatic piano tone',
    color: 'from-amber-500 to-rose-600',
    icon: 'film',
  },
  {
    id: 'hiphop',
    name: 'Boom-Bap Beat (हिप-हॉप बीट)',
    bpm: 92,
    desc: 'Punchy kick, snappy rimshot & walking sub-bass rhythm',
    color: 'from-emerald-500 to-teal-700',
    icon: 'music',
  },
  {
    id: 'meditation',
    name: 'Zen Meditation (ज़ेन ध्यान)',
    bpm: 60,
    desc: '432Hz ambient soothing drone & Tibetan harmonic bells',
    color: 'from-teal-400 to-emerald-600',
    icon: 'sparkles',
  },
  {
    id: 'custom',
    name: 'Custom Beat (अपनी बीट)',
    bpm: 0,
    desc: 'Upload any MP3 or WAV audio track from your device',
    color: 'from-fuchsia-500 to-pink-600',
    icon: 'upload',
  }
];

class AudioStudioService {
  constructor() {
    this.audioCtx = null;
    this.activeSource = null;
    this.activeGain = null;
    this.isPlayingBeat = false;
    this.customAudioBuffer = null;
  }

  // Ensure an AudioContext is created on user interaction
  getAudioContext() {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx({ sampleRate: 44100 });
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Synthesize a procedural beat loop into an AudioBuffer using OfflineAudioContext
   */
  async synthesizeBeatBuffer(beatId, durationSec = 16, sampleRate = 44100) {
    if (beatId === 'none') return null;

    if (beatId === 'custom' && this.customAudioBuffer) {
      return this.customAudioBuffer;
    }

    const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
      2,
      Math.floor(sampleRate * durationSec),
      sampleRate
    );

    const dest = offlineCtx.destination;

    if (beatId === 'lofi') {
      this._buildLofiBeat(offlineCtx, dest, durationSec);
    } else if (beatId === 'news') {
      this._buildNewsPulseBeat(offlineCtx, dest, durationSec);
    } else if (beatId === 'cinematic') {
      this._buildCinematicBeat(offlineCtx, dest, durationSec);
    } else if (beatId === 'hiphop') {
      this._buildHiphopBeat(offlineCtx, dest, durationSec);
    } else if (beatId === 'meditation') {
      this._buildMeditationBeat(offlineCtx, dest, durationSec);
    } else {
      this._buildLofiBeat(offlineCtx, dest, durationSec);
    }

    return await offlineCtx.startRendering();
  }

  // --- Procedural Synthesizer Generators ---

  _buildLofiBeat(ctx, dest, duration) {
    const bpm = 80;
    const beatLen = 60 / bpm; // 0.75s per beat
    const totalBeats = Math.floor(duration / beatLen);

    // Subtle vinyl warmth background noise
    this._addVinylCrackle(ctx, dest, duration, 0.03);

    // Chords (Dm7 -> G7 -> Cmaj7 -> Am7)
    const chordPitches = [
      [293.66, 349.23, 440.00, 523.25], // Dm7 (D4, F4, A4, C5)
      [246.94, 293.66, 392.00, 440.00], // G7  (B3, D4, G4, A4)
      [261.63, 329.63, 392.00, 493.88], // Cmaj7 (C4, E4, G4, B4)
      [220.00, 261.63, 329.63, 392.00], // Am7 (A3, C4, E4, G4)
    ];

    for (let bar = 0; bar < Math.ceil(totalBeats / 4); bar++) {
      const chordIdx = bar % 4;
      const startTime = bar * 4 * beatLen;
      if (startTime >= duration) break;

      const chord = chordPitches[chordIdx];
      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.045, startTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, Math.min(duration, startTime + 3.8 * beatLen));

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        osc.start(startTime);
        osc.stop(Math.min(duration, startTime + 4 * beatLen));
      });
    }

    // Drum Loop (Kick on 1 & 3, Snare on 2 & 4, Hi-hat on 8ths)
    for (let beat = 0; beat < totalBeats; beat++) {
      const t = beat * beatLen;
      if (t >= duration) break;

      const step = beat % 4;
      if (step === 0 || step === 2) {
        this._synthKick(ctx, dest, t, 0.45);
      }
      if (step === 1 || step === 3) {
        this._synthSnare(ctx, dest, t, 0.28, true);
      }

      // Hi-hats on 8th notes
      this._synthHiHat(ctx, dest, t, 0.12);
      if (t + beatLen * 0.5 < duration) {
        this._synthHiHat(ctx, dest, t + beatLen * 0.5, 0.08);
      }
    }
  }

  _buildNewsPulseBeat(ctx, dest, duration) {
    const bpm = 120;
    const beatLen = 60 / bpm; // 0.5s
    const totalSteps = Math.floor(duration / (beatLen / 2)); // 16th/8th steps

    // Drone bassline pulse
    const bassPitches = [110, 110, 123.47, 98]; // A2, B2, G2
    for (let b = 0; b < Math.floor(duration / beatLen); b++) {
      const t = b * beatLen;
      const freq = bassPitches[Math.floor(b / 4) % bassPitches.length];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, Math.min(duration, t + beatLen * 0.9));

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(t);
      osc.stop(Math.min(duration, t + beatLen));

      // Kick on every beat for news urgency
      this._synthKick(ctx, dest, t, 0.35);
    }

    // High tech clockwork tick arpeggio
    for (let s = 0; s < totalSteps; s++) {
      const t = s * (beatLen / 2);
      if (t >= duration) break;
      this._synthTick(ctx, dest, t, 0.09, 1400 + (s % 4) * 200);
    }
  }

  _buildCinematicBeat(ctx, dest, duration) {
    const bpm = 72;
    const beatLen = 60 / bpm;
    const chordLen = beatLen * 4; // ~3.33s per chord

    const chords = [
      [146.83, 220.00, 261.63, 349.23], // Dm (D3, A3, C4, F4)
      [130.81, 196.00, 261.63, 329.63], // C  (C3, G3, C4, E4)
      [116.54, 174.61, 233.08, 293.66], // Bb (Bb2, F3, Bb3, D4)
      [110.00, 164.81, 220.00, 261.63], // Am (A2, E3, A3, C4)
    ];

    const totalChords = Math.ceil(duration / chordLen);
    for (let c = 0; c < totalChords; c++) {
      const t = c * chordLen;
      if (t >= duration) break;

      const chord = chords[c % chords.length];
      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, t);
        filter.frequency.linearRampToValueAtTime(700, Math.min(duration, t + chordLen * 0.5));
        filter.frequency.linearRampToValueAtTime(320, Math.min(duration, t + chordLen));

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.04, t + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, Math.min(duration, t + chordLen * 0.98));

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        osc.start(t);
        osc.stop(Math.min(duration, t + chordLen));
      });

      // Dramatic deep sub boom at start of each cinematic phrase
      this._synthDeepBoom(ctx, dest, t, 0.4);
    }
  }

  _buildHiphopBeat(ctx, dest, duration) {
    const bpm = 92;
    const beatLen = 60 / bpm; // 0.65s
    const totalBeats = Math.floor(duration / beatLen);

    for (let b = 0; b < totalBeats; b++) {
      const t = b * beatLen;
      if (t >= duration) break;
      const step = b % 4;

      if (step === 0 || step === 2) {
        this._synthKick(ctx, dest, t, 0.55);
      }
      if (step === 1 || step === 3) {
        this._synthSnare(ctx, dest, t, 0.4, false);
      }

      // Fast rolling hi-hats
      this._synthHiHat(ctx, dest, t, 0.15);
      if (t + beatLen * 0.5 < duration) {
        this._synthHiHat(ctx, dest, t + beatLen * 0.5, 0.12);
      }
      if (step === 3 && t + beatLen * 0.75 < duration) {
        this._synthHiHat(ctx, dest, t + beatLen * 0.75, 0.09); // roll
      }
    }
  }

  _buildMeditationBeat(ctx, dest, duration) {
    // 432Hz Pure A and 528Hz Solfeggio Love frequency drone
    const freqs = [108, 216, 432, 528];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, 0);

      gain.gain.setValueAtTime(0.001, 0);
      gain.gain.linearRampToValueAtTime(0.05 / (idx + 1), 2.0);
      gain.gain.setValueAtTime(0.05 / (idx + 1), duration - 2.0);
      gain.gain.linearRampToValueAtTime(0.001, duration);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(0);
      osc.stop(duration);
    });

    // Soft singing bowl harmonics every 6 seconds
    for (let t = 0; t < duration; t += 6.0) {
      this._synthSingingBowl(ctx, dest, t, 0.08);
    }
  }

  // --- Drum & Percussion Synthesis Helpers ---

  _synthKick(ctx, dest, time, volume = 0.4) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.25);
  }

  _synthSnare(ctx, dest, time, volume = 0.3, isLofi = false) {
    // Noise buffer
    const bufferSize = ctx.sampleRate * 0.18;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = isLofi ? 'lowpass' : 'bandpass';
    filter.frequency.setValueAtTime(isLofi ? 1400 : 2200, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (isLofi ? 0.12 : 0.18));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(time);
    noise.stop(time + 0.2);

    // Subtle tone body
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.frequency.setValueAtTime(180, time);
    oscGain.gain.setValueAtTime(volume * 0.35, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  _synthHiHat(ctx, dest, time, volume = 0.1) {
    const bufferSize = Math.floor(ctx.sampleRate * 0.04);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(time);
    noise.stop(time + 0.05);
  }

  _synthTick(ctx, dest, time, volume = 0.08, freq = 1600) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.025);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.03);
  }

  _synthDeepBoom(ctx, dest, time, volume = 0.35) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(75, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.8);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.2);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 1.3);
  }

  _synthSingingBowl(ctx, dest, time, volume = 0.08) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(576, time); // D5 harmonic
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 4.5);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 4.6);
  }

  _addVinylCrackle(ctx, dest, duration, volume = 0.02) {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Periodic clicks & noise
      data[i] = Math.random() < 0.003 ? (Math.random() * 2 - 1) * 0.8 : (Math.random() * 2 - 1) * 0.05;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, 0);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, 0);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(0);
    noise.stop(duration);
  }

  /**
   * Play beat loop in real-time alongside speech
   */
  async playLiveBeat(beatId, volume = 0.22) {
    this.stopLiveBeat();
    if (beatId === 'none') return;

    try {
      const ctx = this.getAudioContext();
      const beatBuffer = await this.synthesizeBeatBuffer(beatId, 16, ctx.sampleRate);
      if (!beatBuffer) return;

      const source = ctx.createBufferSource();
      source.buffer = beatBuffer;
      source.loop = true;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.3);

      source.connect(gain);
      gain.connect(ctx.destination);

      source.start(0);

      this.activeSource = source;
      this.activeGain = gain;
      this.isPlayingBeat = true;
    } catch (e) {
      console.warn('Could not start live beat:', e);
    }
  }

  /**
   * Stop real-time beat playback with smooth fadeout
   */
  stopLiveBeat() {
    if (this.activeGain && this.audioCtx && this.isPlayingBeat) {
      try {
        const fadeTime = 0.3;
        this.activeGain.gain.linearRampToValueAtTime(0.001, this.audioCtx.currentTime + fadeTime);
        setTimeout(() => {
          if (this.activeSource) {
            try { this.activeSource.stop(); } catch (_) {}
            this.activeSource = null;
          }
          this.activeGain = null;
          this.isPlayingBeat = false;
        }, fadeTime * 1000);
      } catch (_) {
        this.isPlayingBeat = false;
      }
    } else {
      this.isPlayingBeat = false;
    }
  }

  /**
   * Load a custom user MP3 / WAV beat file into AudioBuffer
   */
  async loadCustomBeatFile(file) {
    const ctx = this.getAudioContext();
    const arrayBuffer = await file.arrayBuffer();
    this.customAudioBuffer = await ctx.decodeAudioData(arrayBuffer);
    return {
      duration: this.customAudioBuffer.duration,
      channels: this.customAudioBuffer.numberOfChannels,
      sampleRate: this.customAudioBuffer.sampleRate,
    };
  }

  /**
   * Offline Audio Mixer:
   * Merges speech narration audio buffer with the background beat into a single 16-bit 44.1kHz stereo WAV Blob.
   */
  async mixVoiceAndBeatToWav({
    voiceArrayBuffer,
    beatId = 'lofi',
    beatVolume = 0.22,
    voiceVolume = 1.0,
  }) {
    const ctx = this.getAudioContext();
    const voiceBuffer = await ctx.decodeAudioData(voiceArrayBuffer);
    const duration = voiceBuffer.duration + 0.5; // add 0.5s tail for clean finish
    const sampleRate = 44100;

    const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
      2,
      Math.ceil(sampleRate * duration),
      sampleRate
    );

    // 1. Connect Voice Audio
    const voiceSource = offlineCtx.createBufferSource();
    voiceSource.buffer = voiceBuffer;
    const voiceGain = offlineCtx.createGain();
    voiceGain.gain.setValueAtTime(voiceVolume, 0);
    voiceSource.connect(voiceGain);
    voiceGain.connect(offlineCtx.destination);
    voiceSource.start(0);

    // 2. Synthesize & Connect Background Beat (if not 'none')
    if (beatId !== 'none') {
      const beatBuffer = await this.synthesizeBeatBuffer(beatId, Math.ceil(duration), sampleRate);
      if (beatBuffer) {
        const beatSource = offlineCtx.createBufferSource();
        beatSource.buffer = beatBuffer;
        beatSource.loop = true;

        const beatGain = offlineCtx.createGain();
        beatGain.gain.setValueAtTime(beatVolume, 0);
        // Smooth fade-out during the last 0.6 seconds
        beatGain.gain.setValueAtTime(beatVolume, Math.max(0, duration - 0.6));
        beatGain.gain.linearRampToValueAtTime(0.001, duration);

        beatSource.connect(beatGain);
        beatGain.connect(offlineCtx.destination);
        beatSource.start(0);
        beatSource.stop(duration);
      }
    }

    const mixedAudioBuffer = await offlineCtx.startRendering();
    const wavArrayBuffer = this._audioBufferToWav(mixedAudioBuffer);
    return new Blob([wavArrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Convert an AudioBuffer to standard 16-bit stereo PCM WAV ArrayBuffer
   */
  _audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const wavBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(wavBuffer);

    function writeString(offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // 16-bit
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    const channels = [];
    for (let c = 0; c < numChannels; c++) {
      channels.push(buffer.getChannelData(c));
    }

    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let c = 0; c < numChannels; c++) {
        let sample = Math.max(-1, Math.min(1, channels[c][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return wavBuffer;
  }

  /**
   * Generate a structured Suno AI song template from given text/story/news
   */
  createSunoPrompt(rawText, genre = 'Hindi Lo-Fi Pop', tempo = '85 bpm') {
    const cleanLines = rawText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 5);

    const verse1 = cleanLines.slice(0, 3).join('\n') || 'चलते रहे हम सच की राह पर,\nहर खबर को परखा हमने नजर भर।';
    const chorus = 'सच को पहचानो, झूठ को जानो,\nतथ्यों की रोशनी में सच को मानो।';
    const verse2 = cleanLines.slice(3, 6).join('\n') || 'सोशल मीडिया के शोर में संभलना है,\nसच्चाई के साथ आगे निकलना है।';
    const outro = 'यह है सच की आवाज़... TruthShield.';

    return `[Style of Music: ${genre}, ${tempo}, acoustic guitar, Rhodes piano, deep sub bass, clear vocal narration, warm atmosphere]

[Verse 1]
${verse1}

[Chorus]
${chorus}

[Verse 2]
${verse2}

[Outro]
${outro}`;
  }
}

export const audioStudio = new AudioStudioService();
export default audioStudio;

