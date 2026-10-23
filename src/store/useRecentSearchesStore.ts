import { create } from 'zustand';

const MAX_RECENT_SEARCHES = 5;

type RecentSearchesState = {
  queries: string[];
  addSearch: (query: string) => void;
  clear: () => void;
};

// Client-only, in-memory (resets on app restart) — powers the "Recents"
// section of the Search sheet. Only non-empty text queries are recorded;
// a category-only search doesn't add an entry.
export const useRecentSearchesStore = create<RecentSearchesState>((set) => ({
  queries: [],
  addSearch: (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    set((state) => ({
      queries: [trimmed, ...state.queries.filter((q) => q.toLowerCase() !== trimmed.toLowerCase())].slice(
        0,
        MAX_RECENT_SEARCHES,
      ),
    }));
  },
  clear: () => set({ queries: [] }),
}));
