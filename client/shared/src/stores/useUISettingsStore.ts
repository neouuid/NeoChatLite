import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

interface UISettingsState {
  theme: Theme;
  chatBackground: string | null;
  notificationsEnabled: boolean;
  messagePreviewEnabled: boolean;
  soundEnabled: boolean;
  vibrateEnabled: boolean;

  // Actions
  setTheme: (theme: Theme) => void;
  setChatBackground: (background: string | null) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setMessagePreviewEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setVibrateEnabled: (enabled: boolean) => void;
  resetSettings: () => void;
}

const defaultSettings = {
  theme: 'system' as Theme,
  chatBackground: null,
  notificationsEnabled: true,
  messagePreviewEnabled: true,
  soundEnabled: true,
  vibrateEnabled: true,
};

export const useUISettingsStore = create<UISettingsState>((set, get) => ({
  ...defaultSettings,

  setTheme: (theme: Theme) => {
    set({ theme });
  },

  setChatBackground: (background: string | null) => {
    set({ chatBackground: background });
  },

  setNotificationsEnabled: (enabled: boolean) => {
    set({ notificationsEnabled: enabled });
  },

  setMessagePreviewEnabled: (enabled: boolean) => {
    set({ messagePreviewEnabled: enabled });
  },

  setSoundEnabled: (enabled: boolean) => {
    set({ soundEnabled: enabled });
  },

  setVibrateEnabled: (enabled: boolean) => {
    set({ vibrateEnabled: enabled });
  },

  resetSettings: () => {
    set(defaultSettings);
  },
}));
