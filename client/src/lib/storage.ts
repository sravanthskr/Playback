// Local storage utilities for persisting video player settings and state

export interface VideoPlayerState {
  currentVideoId: number | null;
  currentSubtitleId: number | null;
  playbackRate: number;
  volume: number;
  showTimeRemaining: boolean;
  videoPosition: number;
  lastPlayed: string;
  speedHotkey?: string;
}

export interface VideoSettings {
  [videoId: string]: {
    position: number;
    playbackRate: number;
    subtitle: number | null;
    lastPlayed: string;
  };
}

const STORAGE_KEYS = {
  PLAYER_STATE: 'videoPlayerState',
  VIDEO_SETTINGS: 'videoSettings',
};

export const savePlayerState = (state: VideoPlayerState) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYER_STATE, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save player state:', error);
  }
};

export const loadPlayerState = (): VideoPlayerState | null => {
  try {
    const state = localStorage.getItem(STORAGE_KEYS.PLAYER_STATE);
    return state ? JSON.parse(state) : null;
  } catch (error) {
    console.error('Failed to load player state:', error);
    return null;
  }
};

export const saveVideoSettings = (videoId: number, settings: VideoSettings[string]) => {
  try {
    const allSettings: VideoSettings = loadAllVideoSettings();
    allSettings[videoId.toString()] = settings;
    localStorage.setItem(STORAGE_KEYS.VIDEO_SETTINGS, JSON.stringify(allSettings));
  } catch (error) {
    console.error('Failed to save video settings:', error);
  }
};

export const loadVideoSettings = (videoId: number): VideoSettings[string] | null => {
  try {
    const allSettings = loadAllVideoSettings();
    return allSettings[videoId.toString()] || null;
  } catch (error) {
    console.error('Failed to load video settings:', error);
    return null;
  }
};

export const loadAllVideoSettings = (): VideoSettings => {
  try {
    const settings = localStorage.getItem(STORAGE_KEYS.VIDEO_SETTINGS);
    return settings ? JSON.parse(settings) : {};
  } catch (error) {
    console.error('Failed to load all video settings:', error);
    return {};
  }
};

export const clearPlayerState = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.PLAYER_STATE);
  } catch (error) {
    console.error('Failed to clear player state:', error);
  }
};

export const clearVideoSettings = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.VIDEO_SETTINGS);
  } catch (error) {
    console.error('Failed to clear video settings:', error);
  }
};