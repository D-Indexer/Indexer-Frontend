import { create } from 'zustand'
import type { Portfolio } from '@/types'

interface PortfolioState {
  portfolios: Portfolio[]
  currentPortfolio: Portfolio | null
  setPortfolios: (portfolios: Portfolio[]) => void
  setCurrentPortfolio: (portfolio: Portfolio) => void
  addPortfolio: (portfolio: Portfolio) => void
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  portfolios: [],
  currentPortfolio: null,
  setPortfolios: (portfolios) => set({ portfolios }),
  setCurrentPortfolio: (portfolio) => set({ currentPortfolio: portfolio }),
  addPortfolio: (portfolio) =>
    set((state) => ({ portfolios: [...state.portfolios, portfolio] })),
}))
