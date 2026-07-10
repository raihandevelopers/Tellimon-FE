import { useEffect, useRef } from 'react'
import { HiOutlineDownload, HiOutlineX } from 'react-icons/hi'

export default function RecordingPlayerModal({ open, onClose, call, audioUrl, filename, onDownload }) {
  const audioRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  useEffect(() => {
    if (open && audioRef.current) {
      audioRef.current.load()
      audioRef.current.play().catch(() => {})
    }
  }, [open, audioUrl])

  if (!open || !call) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-border p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink">Call Recording</h2>
            <p className="text-sm text-gray-500 mt-1 truncate">
              {call.caller} → {call.buyerNumber || 'buyer'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">DID {call.did || '—'} · {call.durationFormatted || '0:00'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 shrink-0"
            aria-label="Close player"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <audio
          ref={audioRef}
          key={audioUrl}
          src={audioUrl}
          controls
          controlsList="nodownload"
          className="w-full"
          preload="auto"
        >
          Your browser does not support audio playback.
        </audio>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 mt-5">
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-border rounded-xl hover:bg-gray-50"
          >
            <HiOutlineDownload className="w-4 h-4" />
            Download
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold bg-brand text-ink rounded-xl hover:bg-brand-dark"
          >
            Close
          </button>
        </div>
        {filename && (
          <p className="text-[10px] text-gray-400 mt-3 font-mono truncate">{filename}</p>
        )}
      </div>
    </div>
  )
}
