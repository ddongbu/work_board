import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      owner: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      setOwner: (owner) => set({ owner }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
