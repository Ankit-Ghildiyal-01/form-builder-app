import { FormRow, FormRowPair, NumberInput, Segmented, TextInput } from '../../components/ui/Controls'
import type { SegmentedOption } from '../../components/ui/Controls'
import type { ConfigEditorProps } from '../types'
import type { NumberFieldConfig } from '../../types'

/**
 * `Segmented` is generic over `string`, so the decimal count is presented in its
 * string form and converted back on change. Typing the array here pins the
 * generic to plain `string` rather than inferring a five-member literal union
 * that `String(field.decimals)` could not satisfy.
 */
const DECIMAL_OPTIONS: ReadonlyArray<SegmentedOption<string>> = [
  { value: '0', label: '0' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
]

export function NumberConfigEditor({ field, onChange }: ConfigEditorProps<NumberFieldConfig>) {
  function set<K extends keyof NumberFieldConfig>(key: K, value: NumberFieldConfig[K]) {
    onChange({ ...field, [key]: value })
  }

  return (
    <>
      <FormRow label="Allowed range" hint="Leave either side blank for no limit.">
        <FormRowPair>
          {/*
            The cross-constraints make each bound act as the other's limit on
            blur, so a min above the max is corrected on the spot rather than
            saved as an empty range the user only discovers at fill time.
          */}
          <NumberInput
            value={field.min}
            max={field.max ?? undefined}
            placeholder="Min"
            onChange={(value) => set('min', value)}
          />
          <NumberInput
            value={field.max}
            min={field.min ?? undefined}
            placeholder="Max"
            onChange={(value) => set('max', value)}
          />
        </FormRowPair>
      </FormRow>

      <FormRow label="Decimal places" hint="Also controls rounding on export.">
        <Segmented
          label="Decimal places"
          options={DECIMAL_OPTIONS}
          value={String(field.decimals)}
          onChange={(next) => set('decimals', Number(next))}
        />
      </FormRow>

      <FormRow
        label="Prefix & suffix"
        hint="Static text shown inside the input, e.g. $ and kg"
      >
        <FormRowPair>
          <TextInput
            value={field.prefix}
            placeholder="Prefix"
            onChange={(event) => set('prefix', event.target.value)}
          />
          <TextInput
            value={field.suffix}
            placeholder="Suffix"
            onChange={(event) => set('suffix', event.target.value)}
          />
        </FormRowPair>
      </FormRow>
    </>
  )
}
