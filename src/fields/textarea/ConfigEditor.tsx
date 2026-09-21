import { FormRow, FormRowPair, NumberInput, TextInput } from '../../components/ui/Controls'
import type { ConfigEditorProps } from '../types'
import type { TextareaFieldConfig } from '../../types'

export function TextareaConfigEditor({
  field,
  onChange,
}: ConfigEditorProps<TextareaFieldConfig>) {
  function set<K extends keyof TextareaFieldConfig>(key: K, value: TextareaFieldConfig[K]) {
    onChange({ ...field, [key]: value })
  }

  return (
    <>
      <FormRow label="Placeholder">
        <TextInput
          value={field.placeholder}
          placeholder="e.g. Tell us more about your project"
          onChange={(event) => set('placeholder', event.target.value)}
        />
      </FormRow>

      <FormRow label="Character length" hint="Leave either side blank for no limit.">
        <FormRowPair>
          <NumberInput
            value={field.minLength}
            integer
            min={0}
            placeholder="Min"
            onChange={(value) => set('minLength', value)}
          />
          <NumberInput
            value={field.maxLength}
            integer
            min={0}
            placeholder="Max"
            onChange={(value) => set('maxLength', value)}
          />
        </FormRowPair>
      </FormRow>

      <FormRow
        label="Number of visible rows"
        hint="Only changes how tall the box renders. It does not limit how much can be typed."
      >
        <NumberInput
          value={field.rows}
          integer
          min={2}
          max={20}
          onChange={(value) => {
            // `rows` is a plain number, so a cleared box keeps the last valid
            // count rather than storing null; NumberInput restores the display
            // on blur from the value it is still being handed.
            if (value !== null) set('rows', value)
          }}
        />
      </FormRow>
    </>
  )
}
