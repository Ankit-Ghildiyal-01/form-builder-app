import type { FillInputProps } from '../types'
import type { SectionFieldConfig, SectionSize } from '../../types'
import './styles.css'

/**
 * Real headings rather than a styled `div` with `role="heading"`, so the form
 * exposes an outline screen-reader users can navigate by level. The top level is
 * `h2`, never `h1`: the page hosting the form owns its single `h1`.
 */
const HEADING_ELEMENTS: Record<SectionSize, 'h2' | 'h3' | 'h4' | 'h5' | 'h6'> = {
  xs: 'h6',
  sm: 'h5',
  md: 'h4',
  lg: 'h3',
  xl: 'h2',
}

/** Shown when the heading text is blank, so an empty heading never renders. */
const FALLBACK_HEADING = 'Untitled section'

// Only `field` is destructured, and that is the point: a section stores no
// value, reports no change, and can never be invalid. `inputId` is unused
// because a heading is not a label target and the section renders no focusable
// control, and `ownsLabel` means the shell does not emit one either.
export function SectionFillInput({ field }: FillInputProps<SectionFieldConfig>) {
  const Heading = HEADING_ELEMENTS[field.size]
  const text = field.label.trim() === '' ? FALLBACK_HEADING : field.label

  return (
    <Heading className={`section-header section-header--${field.size}`}>{text}</Heading>
  )
}
