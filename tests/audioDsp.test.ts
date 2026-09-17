/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore } from '../src/store/usePlayerStore';
import { audioDspEngine, DSP_PRESETS, AUDIO_DSP_PRESETS, DEFAULT_DSP_CONFIG } from '../src/utils/audioDspEngine';
import { AudioDspPreset } from '../src/types/iptv';

describe('Audio Equalizer & Sound Normalization DSP Engine', () => {
  beforeEach(() => {
    usePlayerStore.getState().resetDsp();
  });

  describe('Store State and Mutations', () => {
    it('should initialize with default DSP configuration', () => {
      const state = usePlayerStore.getState().audioDsp;
      expect(state.enabled).toBe(false);
      expect(state.preset).toBe('flat');
      expect(state.bands.subBass).toBe(0);
      expect(state.bands.lowMid).toBe(0);
      expect(state.bands.mid).toBe(0);
      expect(state.bands.upperMid).toBe(0);
      expect(state.bands.high).toBe(0);
      expect(state.normalization).toBe(true);
      expect(state.dialogueEnhancer).toBe(false);
      expect(state.preampGain).toBe(1.0);
    });

    it('should enable and disable DSP processing', () => {
      const store = usePlayerStore.getState();
      store.setDspEnabled(true);
      expect(usePlayerStore.getState().audioDsp.enabled).toBe(true);

      store.setDspEnabled(false);
      expect(usePlayerStore.getState().audioDsp.enabled).toBe(false);
    });

    it('should apply bass_boost preset accurately', () => {
      const store = usePlayerStore.getState();
      store.setDspPreset('bass_boost');

      const state = usePlayerStore.getState().audioDsp;
      expect(state.enabled).toBe(true);
      expect(state.preset).toBe('bass_boost');
      expect(state.bands.subBass).toBe(DSP_PRESETS.bass_boost.subBass);
      expect(state.bands.lowMid).toBe(DSP_PRESETS.bass_boost.lowMid);
      expect(state.bands.mid).toBe(DSP_PRESETS.bass_boost.mid);
      expect(state.bands.upperMid).toBe(DSP_PRESETS.bass_boost.upperMid);
      expect(state.bands.high).toBe(DSP_PRESETS.bass_boost.high);
    });

    it('should apply vocal_clarity preset accurately', () => {
      const store = usePlayerStore.getState();
      store.setDspPreset('vocal_clarity');

      const state = usePlayerStore.getState().audioDsp;
      expect(state.enabled).toBe(true);
      expect(state.preset).toBe('vocal_clarity');
      expect(state.bands.subBass).toBe(DSP_PRESETS.vocal_clarity.subBass);
      expect(state.bands.lowMid).toBe(DSP_PRESETS.vocal_clarity.lowMid);
      expect(state.bands.mid).toBe(DSP_PRESETS.vocal_clarity.mid);
      expect(state.bands.upperMid).toBe(DSP_PRESETS.vocal_clarity.upperMid);
      expect(state.bands.high).toBe(DSP_PRESETS.vocal_clarity.high);
    });

    it('should apply night_mode preset accurately', () => {
      const store = usePlayerStore.getState();
      store.setDspPreset('night_mode');

      const state = usePlayerStore.getState().audioDsp;
      expect(state.enabled).toBe(true);
      expect(state.preset).toBe('night_mode');
      expect(state.bands.subBass).toBe(DSP_PRESETS.night_mode.subBass);
      expect(state.bands.lowMid).toBe(DSP_PRESETS.night_mode.lowMid);
      expect(state.bands.mid).toBe(DSP_PRESETS.night_mode.mid);
      expect(state.bands.upperMid).toBe(DSP_PRESETS.night_mode.upperMid);
      expect(state.bands.high).toBe(DSP_PRESETS.night_mode.high);
    });

    it('should apply treble_boost preset accurately', () => {
      const store = usePlayerStore.getState();
      store.setDspPreset('treble_boost');

      const state = usePlayerStore.getState().audioDsp;
      expect(state.enabled).toBe(true);
      expect(state.preset).toBe('treble_boost');
      expect(state.bands.subBass).toBe(DSP_PRESETS.treble_boost.subBass);
      expect(state.bands.lowMid).toBe(DSP_PRESETS.treble_boost.lowMid);
      expect(state.bands.mid).toBe(DSP_PRESETS.treble_boost.mid);
      expect(state.bands.upperMid).toBe(DSP_PRESETS.treble_boost.upperMid);
      expect(state.bands.high).toBe(DSP_PRESETS.treble_boost.high);
    });

    it('should switch preset to custom when an individual band is adjusted', () => {
      const store = usePlayerStore.getState();
      store.setDspPreset('bass_boost');
      expect(usePlayerStore.getState().audioDsp.preset).toBe('bass_boost');

      store.setDspBand('mid', 5);
      const state = usePlayerStore.getState().audioDsp;
      expect(state.enabled).toBe(true);
      expect(state.preset).toBe('custom');
      expect(state.bands.mid).toBe(5);
      expect(state.bands.subBass).toBe(6); // retains previous unmodified bands
    });

    it('should clamp band gain values strictly between -12 dB and +12 dB', () => {
      const store = usePlayerStore.getState();

      store.setDspBand('high', 25);
      expect(usePlayerStore.getState().audioDsp.bands.high).toBe(12);

      store.setDspBand('subBass', -30);
      expect(usePlayerStore.getState().audioDsp.bands.subBass).toBe(-12);
    });

    it('should toggle normalization independently and auto-enable dsp', () => {
      const store = usePlayerStore.getState();
      expect(store.audioDsp.normalization).toBe(true);

      store.toggleNormalization();
      expect(usePlayerStore.getState().audioDsp.normalization).toBe(false);
      expect(usePlayerStore.getState().audioDsp.enabled).toBe(true);

      store.toggleNormalization();
      expect(usePlayerStore.getState().audioDsp.normalization).toBe(true);
    });

    it('should toggle dialogue enhancer independently and auto-enable dsp', () => {
      const store = usePlayerStore.getState();
      expect(store.audioDsp.dialogueEnhancer).toBe(false);

      store.toggleDialogueEnhancer();
      expect(usePlayerStore.getState().audioDsp.dialogueEnhancer).toBe(true);
      expect(usePlayerStore.getState().audioDsp.enabled).toBe(true);

      store.toggleDialogueEnhancer();
      expect(usePlayerStore.getState().audioDsp.dialogueEnhancer).toBe(false);
    });

    it('should adjust preamp gain and clamp strictly between 0.5x and 2.0x', () => {
      const store = usePlayerStore.getState();

      store.setPreampGain(1.5);
      expect(usePlayerStore.getState().audioDsp.preampGain).toBe(1.5);
      expect(usePlayerStore.getState().audioDsp.enabled).toBe(true);

      // Clamp upper bound
      store.setPreampGain(5.0);
      expect(usePlayerStore.getState().audioDsp.preampGain).toBe(2.0);

      // Clamp lower bound
      store.setPreampGain(0.1);
      expect(usePlayerStore.getState().audioDsp.preampGain).toBe(0.5);
    });

    it('should completely reset DSP state back to factory defaults on resetDsp', () => {
      const store = usePlayerStore.getState();
      store.setDspEnabled(true);
      store.setDspPreset('bass_boost');
      store.setDspBand('mid', 7);
      store.toggleDialogueEnhancer();
      store.setPreampGain(1.8);

      store.resetDsp();
      const state = usePlayerStore.getState().audioDsp;
      expect(state.enabled).toBe(false);
      expect(state.preset).toBe('flat');
      expect(state.bands.subBass).toBe(0);
      expect(state.bands.lowMid).toBe(0);
      expect(state.bands.mid).toBe(0);
      expect(state.bands.upperMid).toBe(0);
      expect(state.bands.high).toBe(0);
      expect(state.normalization).toBe(true);
      expect(state.dialogueEnhancer).toBe(false);
      expect(state.preampGain).toBe(1.0);
    });
  });

  describe('Audio DSP Engine & Presets Catalog', () => {
    it('should export all official standard presets in DSP_PRESETS and AUDIO_DSP_PRESETS', () => {
      const presets: Exclude<AudioDspPreset, 'custom'>[] = ['flat', 'bass_boost', 'vocal_clarity', 'night_mode', 'treble_boost'];
      presets.forEach((p) => {
        expect(DSP_PRESETS[p]).toBeDefined();
        expect(AUDIO_DSP_PRESETS[p]).toBeDefined();
        expect(DSP_PRESETS[p].subBass).toBeDefined();
        expect(DSP_PRESETS[p].lowMid).toBeDefined();
        expect(DSP_PRESETS[p].mid).toBeDefined();
        expect(DSP_PRESETS[p].upperMid).toBeDefined();
        expect(DSP_PRESETS[p].high).toBeDefined();
      });
    });

    it('should safely manage applyConfig without errors even in non-browser/headless environments', () => {
      expect(() => {
        audioDspEngine.applyConfig(usePlayerStore.getState().audioDsp);
      }).not.toThrow();
    });

    it('should safely manage getFrequencyData without crashing and return Uint8Array', () => {
      const data = audioDspEngine.getFrequencyData();
      expect(data instanceof Uint8Array).toBe(true);
      expect(data.length).toBe(32);
    });

    it('should track active config inside engine singleton via getConfig', () => {
      const newConfig = {
        ...usePlayerStore.getState().audioDsp,
        enabled: true,
        preset: 'treble_boost' as AudioDspPreset,
        preampGain: 1.4
      };
      audioDspEngine.applyConfig(newConfig);
      const retrieved = audioDspEngine.getConfig();
      expect(retrieved.enabled).toBe(true);
      expect(retrieved.preset).toBe('treble_boost');
      expect(retrieved.preampGain).toBe(1.4);
    });

    it('should provide isSupported check', () => {
      expect(typeof audioDspEngine.isSupported()).toBe('boolean');
    });
  });
});
