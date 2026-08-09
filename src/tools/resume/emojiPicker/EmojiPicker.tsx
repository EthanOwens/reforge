import { useEffect, useRef } from 'react'
import { EMOJI_OPTIONS } from './emojiOptions'
import './EmojiPicker.css'

interface EmojiPickerProps {
  isOpen: boolean
  currentValue: string
  onSelect: (emoji: string) => void
  onReset: () => void
  onClose: () => void
  label?: string
  // The trigger element that opens/closes this picker (e.g. the icon
  // button). Clicks on it must be excluded from the outside-click-closes
  // logic below, since the trigger's own `onClick` handler is already
  // responsible for toggling `isOpen` — without this, a click on an
  // already-open trigger would close-then-reopen the popover instead of
  // just closing it (mousedown closes it first, then click re-toggles it
  // open again before either handler can observe the other's effect).
  triggerRef: React.RefObject<HTMLElement | null>
}

// A small floating popover offering a curated set of emoji to replace a
// section/contact icon. Positioned via `position: absolute` relative to a
// `position: relative` trigger wrapper in the caller — no portal/floating-UI
// library needed for something this simple.
function EmojiPicker({ isOpen, currentValue, onSelect, onReset, onClose, label, triggerRef }: EmojiPickerProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target)) return
      if (triggerRef.current?.contains(target)) return
      onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousedown', handlePointerDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handlePointerDown)
    }
  }, [isOpen, onClose, triggerRef])

  if (!isOpen) return null

  return (
    <div
      className="emoji-picker-popover"
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label={label ?? 'Choose an icon'}
    >
      <div className="emoji-picker-grid">
        {EMOJI_OPTIONS.map((emoji) => (
          <button
            type="button"
            key={emoji}
            className={`emoji-picker-option${emoji === currentValue ? ' selected' : ''}`}
            onClick={() => onSelect(emoji)}
            aria-label={`Use ${emoji} icon`}
          >
            {emoji}
          </button>
        ))}
      </div>
      <button type="button" className="emoji-picker-reset" onClick={onReset}>
        Reset to default
      </button>
    </div>
  )
}

export default EmojiPicker
