import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import './EmptyState.css'

interface EmptyStateProps {
  icon: IconName
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true">
        <Icon name={icon} size={22} />
      </span>
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__description">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  )
}
