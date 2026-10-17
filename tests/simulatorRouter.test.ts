import { describe, it, expect, beforeEach } from 'vitest';
import { simRouter } from '../src/shims/expo-router';

describe('Simulator Navigation Router & Modal Engine', () => {
  beforeEach(() => {
    simRouter.closeModal();
    simRouter.replace('/');
  });

  it('should initialize with index screen and closed modal', () => {
    expect(simRouter.currentScreen()).toBe('index');
    expect(simRouter.isModalOpen()).toBe(false);
  });

  it('should automatically open modal when launching player route', () => {
    simRouter.push('/player/test-channel-1');
    expect(simRouter.currentScreen()).toBe('player/[id]');
    expect(simRouter.currentParams()).toEqual({ id: 'test-channel-1' });
    expect(simRouter.isModalOpen()).toBe(true);
  });

  it('should parse embedded query parameters like catchupUrl and catchupTitle without corrupting channel id', () => {
    const rawUrl = 'https://proxy.test/stream.m3u8';
    simRouter.push(
      `/player/ch-42?catchupUrl=${encodeURIComponent(rawUrl)}&catchupTitle=${encodeURIComponent('Evening News')}`
    );

    expect(simRouter.currentScreen()).toBe('player/[id]');
    const params = simRouter.currentParams();
    expect(params.id).toBe('ch-42');
    expect(params.catchupUrl).toBe(rawUrl);
    expect(params.catchupTitle).toBe('Evening News');
    expect(simRouter.isModalOpen()).toBe(true);
  });

  it('should allow opening and closing the simulator modal programmatically', () => {
    expect(simRouter.isModalOpen()).toBe(false);
    simRouter.openModal('/player/cnn-live');
    expect(simRouter.isModalOpen()).toBe(true);
    expect(simRouter.currentParams().id).toBe('cnn-live');

    simRouter.closeModal();
    expect(simRouter.isModalOpen()).toBe(false);
  });

  it('should notify subscribers when modal open state changes', () => {
    let capturedModalState = false;
    const unsubscribe = simRouter.subscribe((_screen, _params, isModalOpen) => {
      capturedModalState = isModalOpen;
    });

    simRouter.push('/player/espn-hd');
    expect(capturedModalState).toBe(true);

    simRouter.closeModal();
    expect(capturedModalState).toBe(false);

    unsubscribe();
  });
});
