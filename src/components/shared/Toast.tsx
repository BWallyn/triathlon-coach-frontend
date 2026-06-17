import { useState, useEffect, createContext, useContext, useCallback } from 'react'

interface ToastCtx {
  showToast: (msg: string) => void
}

const Ctx = createContext<ToastCtx>({ showToast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null)

  const showToast = useCallback((m: string) => {
    setMsg(m)
    setTimeout(() => setMsg(null), 2500)
  }, [])

  return (
    <Ctx.Provider value={{ showToast }}>
      {children}
      {msg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#1A1E1A] text-white text-[13px] px-4 py-2 rounded-full z-50 whitespace-nowrap shadow-lg animate-fade-in">
          {msg}
        </div>
      )}
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
