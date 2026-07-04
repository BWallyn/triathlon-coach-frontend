import { create } from 'zustand'
import type { ViewMode, Page } from '../types'

interface AppStore {
  weekOffset: number
  viewMode: ViewMode
  activePage: Page
  setWeekOffset: (offset: number) => void
  shiftWeek: (delta: number) => void
  setViewMode: (mode: ViewMode) => void
  setActivePage: (page: Page) => void
}

export const useAppStore = create<AppStore>((set) => ({
  weekOffset: 0,
  viewMode: 'B',
  activePage: 'dashboard',
  setWeekOffset: (offset) => set({ weekOffset: offset }),
  shiftWeek: (delta) => set((s) => ({ weekOffset: s.weekOffset + delta })),
  setViewMode: (mode) => set({ viewMode: mode }),
  setActivePage: (page) => set({ activePage: page }),
}))