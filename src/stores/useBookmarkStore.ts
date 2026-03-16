import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface Bookmark {
  id: string;
  name: string;
  offsetX: number;
  offsetY: number;
  zoom: number;
}

interface BookmarkStore {
  bookmarks: Bookmark[];
  addBookmark: (name: string, offsetX: number, offsetY: number, zoom: number) => void;
  removeBookmark: (id: string) => void;
}

export const useBookmarkStore = create<BookmarkStore>()(
  immer((set) => ({
    bookmarks: [],
    addBookmark: (name, offsetX, offsetY, zoom) =>
      set((state) => {
        state.bookmarks.push({ id: crypto.randomUUID(), name, offsetX, offsetY, zoom });
      }),
    removeBookmark: (id) =>
      set((state) => {
        state.bookmarks = state.bookmarks.filter((b) => b.id !== id);
      }),
  })),
);