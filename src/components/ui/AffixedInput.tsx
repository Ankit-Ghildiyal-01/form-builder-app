import type { ReactNode } from 'react'
import './AffixedInput.css'

interface AffixedInputProps {
  /** Static text rendered before the input, e.g. `https://` or `$`. */
  prefix?: string
  /** Static text rendered after the input, e.g. `.com` or `kg`. */
  suffix?: string
  invalid?: boolean
  disabled?: boolean
  children: ReactNode
}

/**
 * Wraps a control with static prefix / suffix text so the three pieces read as
 * one input: the inner control's border and focus ring are suppressed and drawn
 * on the group instead. Used by the text and number fields.
 */
export function AffixedInput({
  prefix,
  suffix,
  invalid = false,
  disabled = false,
  children,
}: AffixedInputProps) {
  const classes = [
    'affix',
    invalid ? 'affix--invalid' : '',
    disabled ? 'affix--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      {prefix && <span className="affix__addon">{prefix}</span>}
      <span className="affix__control">{children}</span>
      {suffix && <span className="affix__addon affix__addon--suffix">{suffix}</span>}
    </div>
  )
}
