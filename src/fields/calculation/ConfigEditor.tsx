import {
  FormRow,
  Segmented,
  type SegmentedOption,
} from '../../components/ui/Controls'
import { AGGREGATION_LABELS, calculationSources } from '../../lib/values'
import type { ConfigEditorProps } from '../types'
import type { Aggregation, CalculationFieldConfig, FieldId } from '../../types'
import '../shared.css'

/** Palette order for the aggregation control; labels come from the engine. */
const AGGREGATION_ORDER: readonly Aggregation[] = ['sum', 'average', 'min', 'max']

const AGGREGATION_OPTIONS: ReadonlyArray<SegmentedOption<Aggregation>> = AGGREGATION_ORDER.map(
  (kind) => ({ value: kind, label: AGGREGATION_LABELS[kind] }),
)

/**
 * Segmented is generic over `string`, so the 0–4 decimals are carried as their
 * own text and converted back with `Number` on the way into the config.
 */
const DECIMAL_OPTIONS: ReadonlyArray<SegmentedOption<string>> = ['0', '1', '2', '3', '4'].map(
  (digits) => ({ value: digits, label: digits }),
)

export function CalculationConfigEditor({
  field,
  onChange,
  siblings,
}: ConfigEditorProps<CalculationFieldConfig>) {
  function set<K extends keyof CalculationFieldConfig>(
    key: K,
    value: CalculationFieldConfig[K],
  ) {
    onChange({ ...field, [key]: value })
  }

  // The engine decides who is eligible (Number fields only, never this field),
  // so the picker and the maths can never drift apart.
  const candidates = calculationSources(siblings, field.id)

  function toggleSource(sourceId: FieldId) {
    // A new array either way: mutating the existing one in place would keep the
    // same reference and the config panel would not re-render.
    set(
      'sourceFieldIds',
      field.sourceFieldIds.includes(sourceId)
        ? field.sourceFieldIds.filter((id) => id !== sourceId)
        : [...field.sourceFieldIds, sourceId],
    )
  }

  return (
    <>
      <FormRow
        label="Source fields"
        hint="The value updates live as these fields are filled in."
      >
        {candidates.length === 0 ? (
          <p className="form-row__hint">
            No Number fields to source yet. Add one to the form first.
          </p>
        ) : (
          <div className="field-options">
            {candidates.map((candidate) => {
              const checked = field.sourceFieldIds.includes(candidate.id)
              return (
                <label
                  key={candidate.id}
                  className={`field-option${checked ? ' field-option--selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="field-option__control"
                    checked={checked}
                    onChange={() => toggleSource(candidate.id)}
                  />
                  <span className="field-option__text">
                    <span className="field-option__label">{candidate.label}</span>
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </FormRow>

      <FormRow label="Aggregation">
        <Segmented
          label="Aggregation"
          options={AGGREGATION_OPTIONS}
          value={field.aggregation}
          onChange={(next) => set('aggregation', next)}
        />
      </FormRow>

      <FormRow label="Decimal places">
        <Segmented
          label="Decimal places"
          options={DECIMAL_OPTIONS}
          value={String(field.decimals)}
          onChange={(next) => set('decimals', Number(next))}
        />
      </FormRow>
    </>
  )
}
