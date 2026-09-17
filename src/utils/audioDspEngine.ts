/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AudioDspConfig, AudioDspPreset, AudioDspBands } from '../types/iptv';

export const DSP_PRESETS: Record<Exclude<AudioDspPreset, 'custom'>, AudioDspBands> = {
  flat: {
    subBass: 0,
    lowMid: 0,
    mid: 0,
    upperMid: 0,
    high: 0,
  },
  bass_boost: {
    subBass: 6,
    lowMid: 3,
    mid: 0,
    upperMid: -1,
    high: -1,
  },
  vocal_clarity: {
    subBass: -3,
    lowMid: -1,
    mid: 4,
    upperMid: 4,
    high: 2,
  },
  night_mode: {
    subBass: -4,
    lowMid: -2,
    mid: 2,
    upperMid: 2,
    high: -3,
  },
  treble_boost: {
    subBass: -2,
    lowMid: 0,
    mid: 1,
    upperMid: 4,
    high: 6,
  },
};

export const AUDIO_DSP_PRESETS = DSP_PRESETS;

export const DEFAULT_DSP_CONFIG: AudioDspConfig = {
  enabled: false,
  preset: 'flat',
  bands: { ...DSP_PRESETS.flat },
  normalization: true,
  dialogueEnhancer: false,
  preampGain: 1.0,
};

class AudioDspEngine {
  private audioCtx: AudioContext | null = null;
  private sourceMap = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();
  private activeConfig: AudioDspConfig = { ...DEFAULT_DSP_CONFIG };
  
  // Nodes
  private preampGainNode: GainNode | null = null;
  private band60Node: BiquadFilterNode | null = null;
  private band250Node: BiquadFilterNode | null = null;
  private band1000Node: BiquadFilterNode | null = null;
  private band4000Node: BiquadFilterNode | null = null;
  private band14000Node: BiquadFilterNode | null = null;
  private dialogueNode: BiquadFilterNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private bypassGainNode: GainNode | null = null;
  private dspGainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private masterGainNode: GainNode | null = null;

  private currentMediaElement: HTMLMediaElement | null = null;
  private isInitialized = false;

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.AudioContext || (window as any).webkitAudioContext);
  }

  public getConfig(): AudioDspConfig {
    return { ...this.activeConfig };
  }

  private getOrCreateAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!this.audioCtx) {
      this.audioCtx = new AudioContextClass();
    }

    if (this.audioCtx.state === 'suspended') {
      const resume = () => {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
      };
      window.addEventListener('click', resume, { once: true });
      window.addEventListener('keydown', resume, { once: true });
      window.addEventListener('touchstart', resume, { once: true });
    }

    return this.audioCtx;
  }

  public attachMediaElement(element: HTMLMediaElement, config: AudioDspConfig) {
    if (typeof window === 'undefined' || !element) return;
    const ctx = this.getOrCreateAudioContext();
    if (!ctx) return;

    if (this.currentMediaElement === element && this.isInitialized) {
      this.applyConfig(config);
      return;
    }

    try {
      let sourceNode = this.sourceMap.get(element);
      if (!sourceNode) {
        sourceNode = ctx.createMediaElementSource(element);
        this.sourceMap.set(element, sourceNode);
      }

      this.currentMediaElement = element;

      // Create Nodes if not already present
      if (!this.isInitialized) {
        this.preampGainNode = ctx.createGain();

        // 5 EQ bands
        this.band60Node = ctx.createBiquadFilter();
        this.band60Node.type = 'lowshelf';
        this.band60Node.frequency.value = 60;

        this.band250Node = ctx.createBiquadFilter();
        this.band250Node.type = 'peaking';
        this.band250Node.frequency.value = 250;
        this.band250Node.Q.value = 1.0;

        this.band1000Node = ctx.createBiquadFilter();
        this.band1000Node.type = 'peaking';
        this.band1000Node.frequency.value = 1000;
        this.band1000Node.Q.value = 1.0;

        this.band4000Node = ctx.createBiquadFilter();
        this.band4000Node.type = 'peaking';
        this.band4000Node.frequency.value = 4000;
        this.band4000Node.Q.value = 1.0;

        this.band14000Node = ctx.createBiquadFilter();
        this.band14000Node.type = 'highshelf';
        this.band14000Node.frequency.value = 14000;

        // Dialogue Booster (2.5 kHz peaking)
        this.dialogueNode = ctx.createBiquadFilter();
        this.dialogueNode.type = 'peaking';
        this.dialogueNode.frequency.value = 2500;
        this.dialogueNode.Q.value = 1.4;
        this.dialogueNode.gain.value = 0;

        // Dynamics Compressor for Loudness Normalization
        this.compressorNode = ctx.createDynamicsCompressor();
        this.compressorNode.threshold.value = -24;
        this.compressorNode.knee.value = 30;
        this.compressorNode.ratio.value = 12;
        this.compressorNode.attack.value = 0.003;
        this.compressorNode.release.value = 0.25;

        // Real-time Analyser
        this.analyserNode = ctx.createAnalyser();
        this.analyserNode.fftSize = 64;
        this.analyserNode.smoothingTimeConstant = 0.8;

        // Crossfade Gain Nodes for instantaneous A/B bypass
        this.bypassGainNode = ctx.createGain();
        this.dspGainNode = ctx.createGain();
        this.masterGainNode = ctx.createGain();

        // Wiring:
        // Source -> Preamp -> [DSP chain] -> dspGainNode -> masterGainNode -> Analyser -> Destination
        // Source -> bypassGainNode ------------------------> masterGainNode -> Analyser -> Destination
        sourceNode.connect(this.bypassGainNode);
        sourceNode.connect(this.preampGainNode);

        this.preampGainNode
          .connect(this.band60Node)
          .connect(this.band250Node)
          .connect(this.band1000Node)
          .connect(this.band4000Node)
          .connect(this.band14000Node)
          .connect(this.dialogueNode)
          .connect(this.compressorNode)
          .connect(this.dspGainNode);

        this.bypassGainNode.connect(this.masterGainNode);
        this.dspGainNode.connect(this.masterGainNode);

        this.masterGainNode.connect(this.analyserNode);
        this.analyserNode.connect(ctx.destination);

        this.isInitialized = true;
      }

      this.applyConfig(config);
    } catch (err) {
      console.warn('Web Audio DSP initialization note:', err);
    }
  }

  public applyConfig(config: AudioDspConfig) {
    this.activeConfig = { ...config };
    if (!this.audioCtx || !this.isInitialized) return;
    const now = this.audioCtx.currentTime;
    const ramp = 0.04; // 40ms anti-pop smoothing

    try {
      if (config.enabled) {
        this.dspGainNode?.gain.setTargetAtTime(1.0, now, ramp);
        this.bypassGainNode?.gain.setTargetAtTime(0.0, now, ramp);
      } else {
        this.dspGainNode?.gain.setTargetAtTime(0.0, now, ramp);
        this.bypassGainNode?.gain.setTargetAtTime(1.0, now, ramp);
      }

      // Preamp Gain
      this.preampGainNode?.gain.setTargetAtTime(config.preampGain ?? 1.0, now, ramp);

      // EQ Bands
      this.band60Node?.gain.setTargetAtTime(config.bands.subBass, now, ramp);
      this.band250Node?.gain.setTargetAtTime(config.bands.lowMid, now, ramp);
      this.band1000Node?.gain.setTargetAtTime(config.bands.mid, now, ramp);
      this.band4000Node?.gain.setTargetAtTime(config.bands.upperMid, now, ramp);
      this.band14000Node?.gain.setTargetAtTime(config.bands.high, now, ramp);

      // Dialogue Enhancer (+5 dB at 2.5 kHz when enabled)
      const dialogueGain = config.dialogueEnhancer ? 5.0 : 0.0;
      this.dialogueNode?.gain.setTargetAtTime(dialogueGain, now, ramp);

      // Normalization Compressor
      if (this.compressorNode) {
        const threshold = config.normalization ? -24 : 0;
        const ratio = config.normalization ? 12 : 1;
        this.compressorNode.threshold.setTargetAtTime(threshold, now, ramp);
        this.compressorNode.ratio.setTargetAtTime(ratio, now, ramp);
      }
    } catch (err) {
      // ignore param setting errors during context transition
    }
  }

  public getFrequencyData(array?: Uint8Array): Uint8Array {
    const target = array || new Uint8Array(32);
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(target);
    }
    return target;
  }

  public resumeContext(): void {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }
}

export const audioDspEngine = new AudioDspEngine();
