import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full bg-white rounded-t-2xl border-t border-[#E4E8E4] max-h-[88vh] overflow-y-auto pb-10">
        <div className="w-9 h-1 bg-[#E4E8E4] rounded-full mx-auto mt-3 mb-4" />
        <div className="px-4">
          <h2 className="text-[16px] font-bold mb-4 text-[#1A1E1A]">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  )
}
