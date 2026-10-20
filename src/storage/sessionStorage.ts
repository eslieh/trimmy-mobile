import * as SecureStore from 'expo-secure-store';
import type { User } from '../api/types';
import type { AppMode, OwnedBusiness, StaffSession } from '../store/useOwnedBusinessStore';

// What the app needs to reopen where the user left off, before (or without)
// any network: who's signed in, which mode they were in, and the workplace
// that mode runs on. Kept small (well under SecureStore's ~2 KB comfort
// limit) and next to the tokens; cleared with them on logout.
export type SessionSnapshot = {
  user: User;
  mode: AppMode;
  business: OwnedBusiness | null;
  staffSession: StaffSession | null;
};

const KEY = 'trimmy.session.v1';

export const sessionStorage = {
  async load(): Promise<SessionSnapshot | null> {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      return raw ? (JSON.parse(raw) as SessionSnapshot) : null;
    } catch {
      return null; // unreadable (e.g. an older shape): start from the server instead
    }
  },
  async save(snapshot: SessionSnapshot): Promise<void> {
    try {
      await SecureStore.setItemAsync(KEY, JSON.stringify(snapshot));
    } catch {
      // Best-effort: the next launch just asks the server.
    }
  },
  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(KEY).catch(() => {});
  },
};
