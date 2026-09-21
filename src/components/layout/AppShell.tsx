import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { paths } from '../../routes'
import './AppShell.css'

interface AppShellProps {
  /** Optional back link, shown in place of the brand. */
  back?: { label: string; to: string }
  title?: ReactNode
  subtitle?: ReactNode
  /** Primary actions, right-aligned in the bar. */
  actions?: ReactNode
  /**
   * Removes page padding and the content max-width so a full-height layout
   * (the builder's three panels) can own the viewport.
   */
  flush?: boolean
  children: ReactNode
}

/**
 * The single page frame: top bar, optional titles and actions, and a content
 * region. Every page uses it, so headers, spacing and the back affordance are
 * consistent without each page re-implementing them.
 */
export function AppShell({
  back,
  title,
  subtitle,
  actions,
  flush = false,
  children,
}: AppShellProps) {
  return (
    <div className={`app-shell${flush ? ' app-shell--flush' : ''}`}>
      <header className="app-shell__bar">
        <div className="app-shell__bar-inner">
          {back ? (
            <Link to={back.to} className="app-shell__back">
              <Icon name="arrow-left" size={16} />
              <span>{back.label}</span>
            </Link>
          ) : (
            <Link to={paths.templates} className="app-shell__brand">
              <span className="app-shell__brand-mark" aria-hidden="true">
                <Icon name="layers" size={16} />
              </span>
              <span>Form Builder</span>
            </Link>
          )}

          {title && (
            <div className="app-shell__titles">
              <h1 className="app-shell__title">{title}</h1>
              {subtitle && <p className="app-shell__subtitle">{subtitle}</p>}
            </div>
          )}

          <div className="app-shell__actions">{actions}</div>
        </div>
      </header>

      <main className="app-shell__main">{children}</main>
    </div>
  )
}

/** Centred, width-limited content column. */
export function Page({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className={`page${wide ? ' page--wide' : ''}`}>
      <div className="page__inner">{children}</div>
    </div>
  )
}
