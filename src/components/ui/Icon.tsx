/**
 * Inline SVG icon set.
 *
 * A closed union of names rather than a free-form string, so a typo in a field
 * definition's `icon` is a compile error. Every glyph is a 24x24 stroke drawing
 * that inherits `currentColor`, which keeps icons themeable from CSS alone.
 */

import type { ReactNode } from 'react'

export type IconName =
  // Field types
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'file'
  | 'section'
  | 'calculation'
  // Interface
  | 'plus'
  | 'trash'
  | 'copy'
  | 'check'
  | 'close'
  | 'alert'
  | 'info'
  | 'lock'
  | 'clock'
  | 'eye-off'
  | 'grip'
  | 'sliders'
  | 'download'
  | 'arrow-left'
  | 'chevron-up'
  | 'chevron-down'
  | 'pencil'
  | 'play'
  | 'save'
  | 'grid'
  | 'inbox'
  | 'layers'
  | 'list'

/** Filled dots helper for the drag handle. */
const DOT = 'M0 0h.01'

const PATHS: Record<IconName, ReactNode> = {
  /* ---- Field types ------------------------------------------------------ */
  text: (
    <>
      <path d="M4 7V5h16v2" />
      <path d="M12 5v14" />
      <path d="M9 19h6" />
    </>
  ),
  textarea: (
    <>
      <path d="M4 6h16" />
      <path d="M4 11h16" />
      <path d="M4 16h9" />
    </>
  ),
  number: (
    <>
      <path d="M9.5 3.5 8 20.5" />
      <path d="M16 3.5l-1.5 17" />
      <path d="M4 9h16" />
      <path d="M3 15h16" />
    </>
  ),
  date: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M3 11h18" />
      <path d="M8 15h.01" />
      <path d="M12 15h.01" />
    </>
  ),
  select: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
    </>
  ),
  multiselect: (
    <>
      <path d="M3 7l2 2 3-3" />
      <path d="M3 16l2 2 3-3" />
      <path d="M12 8h9" />
      <path d="M12 17h9" />
    </>
  ),
  file: (
    <>
      <path d="M20.4 11.1 11.2 20.3a5 5 0 0 1-7.1-7.1l9.2-9.2a3.5 3.5 0 0 1 5 5l-9.2 9.1a2 2 0 0 1-2.8-2.8l8.5-8.5" />
    </>
  ),
  section: (
    <>
      <path d="M3 6v12" />
      <path d="M3 12h7" />
      <path d="M10 6v12" />
      <path d="M15 9h6" />
      <path d="M15 13h6" />
      <path d="M15 17h4" />
    </>
  ),
  calculation: (
    <>
      <path d="M18 5H7l6 7-6 7h11" />
    </>
  ),

  /* ---- Interface -------------------------------------------------------- */
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </>
  ),
  check: <path d="M4 12.5 9 17.5 20 6.5" />,
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5" />
      <path d="M12 16.5h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 7.5h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.2 2" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.7A9.9 9.9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.6 17.6 0 0 1-3.3 4.2" />
      <path d="M6.4 7A17.4 17.4 0 0 0 2.5 12S6 18.5 12 18.5a9.6 9.6 0 0 0 4.2-.95" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  grip: (
    <>
      <circle cx="9" cy="6" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="1.4" fill="currentColor" stroke="none" />
      <path d={DOT} />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
      <circle cx="9" cy="7" r="2.2" fill="var(--surface)" />
      <circle cx="15" cy="12" r="2.2" fill="var(--surface)" />
      <circle cx="7" cy="17" r="2.2" fill="var(--surface)" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <path d="M7.5 11 12 15.5 16.5 11" />
      <path d="M4 20h16" />
    </>
  ),
  'arrow-left': (
    <>
      <path d="M19 12H5" />
      <path d="M11 18l-6-6 6-6" />
    </>
  ),
  'chevron-up': <path d="M6 15l6-6 6 6" />,
  'chevron-down': <path d="M6 9l6 6 6-6" />,
  pencil: (
    <>
      <path d="M4 20h4L20 8l-4-4L4 16v4Z" />
      <path d="M14 6l4 4" />
    </>
  ),
  play: <path d="M7 4.5v15l12-7.5-12-7.5Z" />,
  save: (
    <>
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M8 4v6h8V4" />
      <path d="M8 20v-6h8v6" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 13h4l2 3h4l2-3h4" />
      <path d="M4 13l3-8h10l3 8v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6Z" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l9 4.5-9 4.5-9-4.5L12 3Z" />
      <path d="M3 12.5 12 17l9-4.5" />
      <path d="M3 16.5 12 21l9-4.5" />
    </>
  ),
  list: (
    <>
      <path d="M9 6h12" />
      <path d="M9 12h12" />
      <path d="M9 18h12" />
      <path d="M4 6h.01" />
      <path d="M4 12h.01" />
      <path d="M4 18h.01" />
    </>
  ),
}

interface IconProps {
  name: IconName
  size?: number
  className?: string
  /** Decorative by default; pass a label to expose it to assistive tech. */
  label?: string
}

export function Icon({ name, size = 18, className, label }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}
