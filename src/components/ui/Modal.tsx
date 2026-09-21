import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconButton } from './Button'
import './Modal.css'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg' | 'xl'
}

/**
 * The dialog behind the preview and every confirmation. Handles the three things
 * a hand-rolled modal usually forgets: Escape to dismiss, background scroll lock,
 * and moving focus into the dialog so keyboard users are not left behind.
 *
 * It deliberately does not wrap its children in a `<form>`: the preview embeds
 * a complete form of its own, and nested forms are invalid HTML.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'lg',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus the dialog itself rather than the first control, so screen readers
    // announce the title before the content.
    dialogRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="modal">
      <div className="modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        className={`modal__dialog modal__dialog--${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <header className="modal__header">
          <div className="modal__heading">
            <h2 className="modal__title">{title}</h2>
            {description && <p className="modal__description">{description}</p>}
          </div>
          <IconButton icon="close" label="Close preview" onClick={onClose} />
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}
