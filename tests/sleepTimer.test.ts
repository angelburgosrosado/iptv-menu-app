/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePlayerStore } from '../src/store/usePlayerStore';

describe('Sleep Timer & Playback Automation Engine', () => {
  beforeEach(() => {
    usePlayerStore.getState().cancelSleepTimer();
  });

  it('should initialize with sleep timer inactive and zero duration', () => {
    const store = usePlayerStore.getState();
    expect(store.sleepTimer.isActive).toBe(false);
    expect(store.sleepTimer.durationMinutes).toBe(0);
    expect(store.sleepTimer.remainingSeconds).toBe(0);
    expect(store.sleepTimer.audioDuckRatio).toBe(1.0);
    expect(store.sleepTimer.dimRatio).toBe(0.0);
  });

  it('should start a sleep timer with preset duration and default options', () => {
    const store = usePlayerStore.getState();
    store.setSleepTimer(30);

    const updated = usePlayerStore.getState().sleepTimer;
    expect(updated.isActive).toBe(true);
    expect(updated.durationMinutes).toBe(30);
    expect(updated.remainingSeconds).toBe(1800);
    expect(updated.audioFadeOut).toBe(true);
    expect(updated.bedtimeDimming).toBe(true);
    expect(updated.endAction).toBe('pause');
    expect(updated.audioDuckRatio).toBe(1.0);
    expect(updated.dimRatio).toBe(0.0);
  });

  it('should support custom duration and options overrides', () => {
    const store = usePlayerStore.getState();
    store.setSleepTimer(45, {
      audioFadeOut: false,
      bedtimeDimming: false,
      endAction: 'close'
    });

    const updated = usePlayerStore.getState().sleepTimer;
    expect(updated.isActive).toBe(true);
    expect(updated.durationMinutes).toBe(45);
    expect(updated.remainingSeconds).toBe(2700);
    expect(updated.audioFadeOut).toBe(false);
    expect(updated.bedtimeDimming).toBe(false);
    expect(updated.endAction).toBe('close');
  });

  it('should decrement remaining seconds on tickSleepTimer', () => {
    const store = usePlayerStore.getState();
    store.setSleepTimer(10); // 600 seconds

    store.tickSleepTimer();
    expect(usePlayerStore.getState().sleepTimer.remainingSeconds).toBe(599);

    store.tickSleepTimer();
    expect(usePlayerStore.getState().sleepTimer.remainingSeconds).toBe(598);
  });

  it('should not tick if sleep timer is inactive', () => {
    const store = usePlayerStore.getState();
    store.tickSleepTimer();
    expect(usePlayerStore.getState().sleepTimer.remainingSeconds).toBe(0);
  });

  it('should calculate progressive audio duck ratio during final 60 seconds when audioFadeOut is enabled', () => {
    const store = usePlayerStore.getState();
    // Start with 62 seconds remaining
    store.setSleepTimer(2, { audioFadeOut: true });
    usePlayerStore.setState({
      sleepTimer: {
        ...usePlayerStore.getState().sleepTimer,
        remainingSeconds: 61
      }
    });

    store.tickSleepTimer(); // remaining: 60s
    expect(usePlayerStore.getState().sleepTimer.remainingSeconds).toBe(60);
    expect(usePlayerStore.getState().sleepTimer.audioDuckRatio).toBe(1.0);

    // Jump to 30s remaining
    usePlayerStore.setState({
      sleepTimer: {
        ...usePlayerStore.getState().sleepTimer,
        remainingSeconds: 31
      }
    });

    store.tickSleepTimer(); // remaining: 30s
    expect(usePlayerStore.getState().sleepTimer.remainingSeconds).toBe(30);
    expect(usePlayerStore.getState().sleepTimer.audioDuckRatio).toBeCloseTo(0.5, 2);

    // Jump to 6s remaining
    usePlayerStore.setState({
      sleepTimer: {
        ...usePlayerStore.getState().sleepTimer,
        remainingSeconds: 7
      }
    });

    store.tickSleepTimer(); // remaining: 6s
    expect(usePlayerStore.getState().sleepTimer.remainingSeconds).toBe(6);
    expect(usePlayerStore.getState().sleepTimer.audioDuckRatio).toBeCloseTo(0.1, 2);
  });

  it('should ramp up bedtime dim ratio during final 120 seconds when bedtimeDimming is enabled', () => {
    const store = usePlayerStore.getState();
    store.setSleepTimer(5, { bedtimeDimming: true });
    usePlayerStore.setState({
      sleepTimer: {
        ...usePlayerStore.getState().sleepTimer,
        remainingSeconds: 121
      }
    });

    store.tickSleepTimer(); // 120s remaining
    expect(usePlayerStore.getState().sleepTimer.dimRatio).toBeCloseTo(0.0, 2);

    usePlayerStore.setState({
      sleepTimer: {
        ...usePlayerStore.getState().sleepTimer,
        remainingSeconds: 61
      }
    });

    store.tickSleepTimer(); // 60s remaining
    // (120 - 60) / 120 * 0.88 = 0.44
    expect(usePlayerStore.getState().sleepTimer.dimRatio).toBeCloseTo(0.44, 2);
  });

  it('should extend sleep timer by specified minutes', () => {
    const store = usePlayerStore.getState();
    store.setSleepTimer(15); // 900s
    expect(usePlayerStore.getState().sleepTimer.remainingSeconds).toBe(900);

    store.extendSleepTimer(5); // +300s -> 1200s
    expect(usePlayerStore.getState().sleepTimer.remainingSeconds).toBe(1200);
    expect(usePlayerStore.getState().sleepTimer.durationMinutes).toBe(20);

    store.extendSleepTimer(15); // +900s -> 2100s
    expect(usePlayerStore.getState().sleepTimer.remainingSeconds).toBe(2100);
    expect(usePlayerStore.getState().sleepTimer.durationMinutes).toBe(35);
  });

  it('should start timer when extendSleepTimer is called while timer is inactive', () => {
    const store = usePlayerStore.getState();
    expect(store.sleepTimer.isActive).toBe(false);

    store.extendSleepTimer(15);
    expect(usePlayerStore.getState().sleepTimer.isActive).toBe(true);
    expect(usePlayerStore.getState().sleepTimer.remainingSeconds).toBe(900);
  });

  it('should cancel sleep timer and reset audio ducking and dimming', () => {
    const store = usePlayerStore.getState();
    store.setSleepTimer(30);
    usePlayerStore.setState({
      sleepTimer: {
        ...usePlayerStore.getState().sleepTimer,
        remainingSeconds: 20,
        audioDuckRatio: 0.33,
        dimRatio: 0.75
      }
    });

    store.cancelSleepTimer();

    const updated = usePlayerStore.getState().sleepTimer;
    expect(updated.isActive).toBe(false);
    expect(updated.durationMinutes).toBe(0);
    expect(updated.remainingSeconds).toBe(0);
    expect(updated.audioDuckRatio).toBe(1.0);
    expect(updated.dimRatio).toBe(0.0);
  });

  it('should execute expiration action and deactivate when countdown hits zero', () => {
    const store = usePlayerStore.getState();
    const closePiPSpy = vi.spyOn(store, 'closePiP');

    store.setSleepTimer(1, { endAction: 'close' });
    usePlayerStore.setState({
      sleepTimer: {
        ...usePlayerStore.getState().sleepTimer,
        remainingSeconds: 1
      }
    });

    store.tickSleepTimer(); // reaches 0

    const updated = usePlayerStore.getState().sleepTimer;
    expect(updated.isActive).toBe(false);
    expect(updated.remainingSeconds).toBe(0);
    expect(closePiPSpy).toHaveBeenCalled();

    closePiPSpy.mockRestore();
  });
});
