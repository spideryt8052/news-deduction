/**
 * TruthShield Smart Document Speech & Part Streamer
 * 
 * Splits long documents (PDF/DOCX/Articles) into ~450-word parts.
 * Features:
 * 1. Sentence-boundary chunking (~450 words per part)
 * 2. Instant playback of Part 1 (< 1 second)
 * 3. Smart pre-fetching of upcoming parts in the background
 * 4. Auto-advancing continuous playback from Part 1 to Part N
 * 5. Interactive Part selection & skipping
 * 6. Master Full-Document MP3 concatenation & single-part downloads
 */

import { toHumanSpeechText } from './voiceService';

export function splitTextIntoWordChunks(rawText, targetWordCount = 450, lang = 'hi') {
  if (!rawText || !rawText.trim()) return [];

  const langKey = (lang || 'hi').split('-')[0].toLowerCase();
  const cleanedText = toHumanSpeechText(rawText, { conversational: false, lang: langKey });
  if (!cleanedText) return [];

  // Match sentences using Unicode punctuation (. ! ? । \n)
  const sentenceRegex = /[^.!?।\n]+[.!?।\n]+|[^.!?।\n]+$/gu;
  const rawSentences = cleanedText.match(sentenceRegex) || [cleanedText];

  const chunks = [];
  let currentSentences = [];
  let currentWordCount = 0;

  for (const s of rawSentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;

    const words = trimmed.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    if (currentWordCount + wordCount > targetWordCount && currentSentences.length > 0) {
      chunks.push({
        index: chunks.length,
        text: currentSentences.join(' '),
        wordCount: currentWordCount,
      });
      currentSentences = [trimmed];
      currentWordCount = wordCount;
    } else {
      currentSentences.push(trimmed);
      currentWordCount += wordCount;
    }
  }

  if (currentSentences.length > 0) {
    chunks.push({
      index: chunks.length,
      text: currentSentences.join(' '),
      wordCount: currentWordCount,
    });
  }

  const total = chunks.length;
  return chunks.map(c => ({
    ...c,
    totalParts: total,
    preview: c.text.slice(0, 75).trim() + (c.text.length > 75 ? '...' : '')
  }));
}

class SmartDocumentPlayer {
  constructor() {
    this.parts = [];
    this.currentPartIndex = 0;
    this.audioCache = new Map(); // index -> { blob, blobUrl }
    this.audio = null;
    this.isPlaying = false;
    this.lang = 'hi';
    this.gender = 'female';
    this.sessionToken = 0;
    this.onPartChangeCallback = null;
    this.onStateChangeCallback = null;

    if (typeof window !== 'undefined') {
      try {
        this.audio = new Audio();
      } catch (e) {
        this.audio = null;
      }
    }
  }

  init(text, lang = 'hi', gender = 'female', targetWordCount = 450) {
    this.stop();
    this.clearCache();
    this.lang = lang;
    this.gender = gender;
    this.parts = splitTextIntoWordChunks(text, targetWordCount, lang);
    this.currentPartIndex = 0;
    return this.parts;
  }

  clearCache() {
    for (const item of this.audioCache.values()) {
      if (item && item.blobUrl) {
        try { URL.revokeObjectURL(item.blobUrl); } catch (_) {}
      }
    }
    this.audioCache.clear();
  }

  /**
   * Fetch audio blob for a specific part via backend POST API
   */
  async fetchPartAudio(index) {
    if (this.audioCache.has(index)) {
      return this.audioCache.get(index);
    }

    const part = this.parts[index];
    if (!part) return null;

    const base = (typeof window !== 'undefined' && import.meta.env?.VITE_API_URL) || '';
    const cleanBase = base ? base.replace(/\/$/, '') : '';
    const langKey = (this.lang || 'hi').split('-')[0].toLowerCase();

    const res = await fetch(`${cleanBase}/api/omnivoice/audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: part.text,
        lang_id: langKey,
        voice_gender: this.gender,
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to synthesize Part ${index + 1}: status ${res.status}`);
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const result = { blob, blobUrl };
    this.audioCache.set(index, result);
    return result;
  }

  /**
   * Silently pre-fetch the next part in background
   */
  prefetchNext(currentIndex) {
    const nextIndex = currentIndex + 1;
    if (nextIndex < this.parts.length && !this.audioCache.has(nextIndex)) {
      this.fetchPartAudio(nextIndex).catch(err => {
        console.warn(`Background prefetch for Part ${nextIndex + 1} notice:`, err);
      });
    }
  }

  /**
   * Play specific part index and queue next parts sequentially
   */
  async playPart(index, { onPartChange, onEnd, onError, onStart } = {}) {
    if (index < 0 || index >= this.parts.length) {
      if (onEnd) onEnd();
      return;
    }

    this.sessionToken++;
    const currentSession = this.sessionToken;
    this.currentPartIndex = index;

    if (onPartChange) {
      this.onPartChangeCallback = onPartChange;
      onPartChange(index, this.parts[index]);
    }

    try {
      this.isPlaying = true;
      if (onStart) onStart(index);

      // 1. Fetch current part (instant if cached)
      const cached = await this.fetchPartAudio(index);
      if (this.sessionToken !== currentSession) return;
      if (!cached || !cached.blobUrl) throw new Error('Audio data empty');

      // 2. Immediately kick off background prefetch for the next part!
      this.prefetchNext(index);

      // 3. Play current part audio
      if (!this.audio) this.audio = new Audio();
      this.audio.src = cached.blobUrl;
      this.audio.currentTime = 0;

      this.audio.onended = () => {
        if (this.sessionToken !== currentSession) return;
        const nextIdx = index + 1;
        if (nextIdx < this.parts.length) {
          // Auto-advance seamlessly to the next part!
          this.playPart(nextIdx, { onPartChange, onEnd, onError });
        } else {
          this.isPlaying = false;
          this.currentPartIndex = 0;
          if (onEnd) onEnd();
        }
      };

      this.audio.onerror = (e) => {
        if (this.sessionToken !== currentSession) return;
        console.warn(`Playback error on Part ${index + 1}:`, e);
        this.isPlaying = false;
        if (onError) onError(`Playback failed on Part ${index + 1}`);
      };

      await this.audio.play();
    } catch (err) {
      if (this.sessionToken !== currentSession) return;
      console.warn(`SmartStream play error on Part ${index + 1}:`, err);
      this.isPlaying = false;
      if (onError) onError(err.message || 'Audio playback error.');
    }
  }

  pause() {
    if (this.audio && !this.audio.paused) {
      try { this.audio.pause(); } catch (_) {}
    }
    this.isPlaying = false;
  }

  resume() {
    if (this.audio && this.audio.paused && this.audio.src) {
      this.audio.play().then(() => {
        this.isPlaying = true;
      }).catch(e => console.warn('Resume failed:', e));
    }
  }

  stop() {
    this.sessionToken++;
    this.isPlaying = false;
    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.audio.removeAttribute('src');
      } catch (_) {}
    }
  }

  /**
   * Download single part audio MP3
   */
  async downloadPart(index, customFilename = null) {
    const cached = await this.fetchPartAudio(index);
    if (!cached || !cached.blobUrl) return;

    const safeName = customFilename || `truthshield-part-${index + 1}-${this.lang}-${this.gender}.mp3`;
    const a = document.createElement('a');
    a.href = cached.blobUrl;
    a.download = safeName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) document.body.removeChild(a);
    }, 500);
  }

  /**
   * Fetch all remaining parts and concatenate into a single full-length document MP3
   */
  async downloadFullCombinedAudio(filename = null, onProgress = null) {
    const total = this.parts.length;
    const blobs = [];

    for (let i = 0; i < total; i++) {
      if (onProgress) onProgress(i + 1, total);
      const audioData = await this.fetchPartAudio(i);
      if (audioData && audioData.blob) {
        blobs.push(audioData.blob);
      }
    }

    if (blobs.length === 0) return;

    // Concatenate all MP3 frame streams into one master MP3 file
    const combinedBlob = new Blob(blobs, { type: 'audio/mpeg' });
    const blobUrl = URL.createObjectURL(combinedBlob);
    const safeName = filename || `truthshield-full-document-${this.lang}-${this.gender}.mp3`;

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = safeName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 1500);
  }
}

export const smartDocumentPlayer = new SmartDocumentPlayer();
export default smartDocumentPlayer;
