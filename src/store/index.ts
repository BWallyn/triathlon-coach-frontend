import { create } from 'zustand'
import type { ViewMode } from '../types'

interface AppStore {
  weekOffset: number
  viewMode: ViewMode
  activePage: 'plan' | 'food' | 'courses'
  setWeekOffset: (offset: number) => void
  shiftWeek: (delta: number) => void
  setViewMode: (mode: ViewMode) => void
  setActivePage: (page: 'plan' | 'food' | 'courses') => void
}

export const useAppStore = create<AppStore>((set) => ({
  weekOffset: 0,
  viewMode: 'B',
  activePage: 'plan',
  setWeekOffset: (offset) => set({ weekOffset: offset }),
  shiftWeek: (delta) => set((s) => ({ weekOffset: s.weekOffset + delta })),
  setViewMode: (mode) => set({ viewMode: mode }),
  setActivePage: (page) => set({ activePage: page }),
}))
