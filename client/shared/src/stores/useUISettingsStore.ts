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
  toggleNotifications: () => void;
  setMessagePreviewEnabled: (enabled: boolean) => void;
  toggleMessagePreview: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
  setVibrateEnabled: (enabled: boolean) => void;
  toggleVibrate: () => void;
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

  toggleNotifications: () => {
    set((state) => ({ notificationsEnabled: !state.notificationsEnabled }));
  },

  setMessagePreviewEnabled: (enabled: boolean) => {
    set({ messagePreviewEnabled: enabled });
  },

  toggleMessagePreview: () => {
    set((state) => ({ messagePreviewEnabled: !state.messagePreviewEnabled }));
  },

  setSoundEnabled: (enabled: boolean) => {
    set({ soundEnabled: enabled });
  },

  toggleSound: () => {
    set((state) => ({ soundEnabled: !state.soundEnabled }));
  },

  setVibrateEnabled: (enabled: boolean) => {
    set({ vibrateEnabled: enabled });
  },

  toggleVibrate: () => {
    set((state) => ({ vibrateEnabled: !state.vibrateEnabled }));
  },

  resetSettings: () => {
    set(defaultSettings);
  },
}));
