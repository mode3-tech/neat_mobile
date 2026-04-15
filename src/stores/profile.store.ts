import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const PHOTO_URI_KEY = 'profile_photo_uri';

interface ProfileState {
  photoUri: string | null;
  photoHydrated: boolean;
  setPhotoUri: (uri: string | null) => void;
  hydratePhotoUri: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  photoUri: null,
  photoHydrated: false,

  setPhotoUri: (uri) => {
    if (uri) {
      SecureStore.setItemAsync(PHOTO_URI_KEY, uri).catch(() => {});
    } else {
      SecureStore.deleteItemAsync(PHOTO_URI_KEY).catch(() => {});
    }
    set({ photoUri: uri });
  },

  hydratePhotoUri: async () => {
    try {
      const stored = await SecureStore.getItemAsync(PHOTO_URI_KEY);
      set({ photoUri: stored, photoHydrated: true });
    } catch {
      set({ photoHydrated: true });
    }
  },
}));
