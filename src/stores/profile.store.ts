import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { File } from 'expo-file-system';

const PHOTO_URI_KEY = 'profile_photo_uri';
const PHOTO_CB_KEY = 'profile_photo_cb';

interface ProfileState {
  photoUri: string | null;
  photoHydrated: boolean;
  photoCacheBuster: number;
  setPhotoUri: (uri: string | null) => void;
  hydratePhotoUri: () => Promise<void>;
  bumpPhotoCacheBuster: () => void;
  clearPhoto: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  photoUri: null,
  photoHydrated: false,
  photoCacheBuster: 0,

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
      const [storedUri, storedCb] = await Promise.all([
        SecureStore.getItemAsync(PHOTO_URI_KEY),
        SecureStore.getItemAsync(PHOTO_CB_KEY),
      ]);
      const cb = storedCb ? Number(storedCb) : 0;
      set({
        photoUri: storedUri,
        photoCacheBuster: Number.isFinite(cb) ? cb : 0,
        photoHydrated: true,
      });
    } catch {
      set({ photoHydrated: true });
    }
  },

  bumpPhotoCacheBuster: () => {
    const next = Date.now();
    SecureStore.setItemAsync(PHOTO_CB_KEY, String(next)).catch(() => {});
    set({ photoCacheBuster: next });
  },

  clearPhoto: () => {
    const current = get().photoUri;
    if (current && current.startsWith('file://')) {
      try { new File(current).delete(); } catch {}
    }
    SecureStore.deleteItemAsync(PHOTO_URI_KEY).catch(() => {});
    SecureStore.deleteItemAsync(PHOTO_CB_KEY).catch(() => {});
    set({ photoUri: null, photoCacheBuster: 0 });
  },
}));
