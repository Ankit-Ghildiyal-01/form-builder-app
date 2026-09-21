import { AGGREGATION_LABELS, formatCalculationValue } from '../../lib/values'
import type { FillInputProps } from '../types'
import type { CalculationFieldConfig } from '../../types'
import '../shared.css'
import './styles.css'

/**
 * A calculation is read-only: it has no control, captures nothing, and is
 * recomputed by the fill page before rendering, which is what makes the number
 * track its sources live. So this component only formats the value it is handed;
 * `lib/values.ts` stays the single source of truth for the result.
 *
 * Only the props it reads are destructured: it never reports a change back.
 */
export function CalculationFillInput({
  field,
  value,
  error,
  inputId,
  disabled = false,
}: FillInputProps<CalculationFieldConfig>) {
  // The fill page already resolved this, so a non-number means "no result"
  // (a stale value from an older build) rather than something to parse.
  const display = formatCalculationValue(typeof value === 'number' ? value : null, field.decimals)

  const sourceCount = field.sourceFieldIds.length
  // The em dash `formatCalculationValue` yields for `null` is the right thing to
  // show when no source has a value: rendering `0` would claim the user typed
  // zeroes into fields they left blank.
  const note =
    sourceCount === 0
      ? 'Auto-calculated · no source fields configured'
      : `Auto-calculated · ${AGGREGATION_LABELS[field.aggregation]} of ${sourceCount} field${
          sourceCount === 1 ? '' : 's'
        }`

  return (
    <>
      {/* No focusable control, so the shell's caption points at this container
          rather than dangling: the row still reads as one labelled group. */}
      <div
        id={inputId}
        className="field-readonly"
        aria-describedby={error ? `${inputId}-error` : undefined}
        aria-disabled={disabled || undefined}
      >
        <span className="field-readonly__value">{display}</span>
        <span className="field-readonly__note">{note}</span>
      </div>
    </>
  )
}
