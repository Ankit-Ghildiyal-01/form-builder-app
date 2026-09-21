import type { ReactNode } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  confirmLabel: string
  onClose: () => void
  onConfirm: () => void
  children: ReactNode
}

/**
 * The confirmation step in front of anything destructive.
 *
 * The caller keeps ownership of the record being deleted and its `.confirm-copy`
 * body, so the open/closed lifecycle stays where the state already lives.
 */
export function ConfirmDialog({
  open,
  title,
  confirmLabel,
  onClose,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  )
}
