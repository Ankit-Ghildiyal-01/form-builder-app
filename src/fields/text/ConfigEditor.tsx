import { FormRow, FormRowPair, NumberInput, TextInput } from '../../components/ui/Controls'
import type { ConfigEditorProps } from '../types'
import type { TextFieldConfig } from '../../types'

export function TextConfigEditor({ field, onChange }: ConfigEditorProps<TextFieldConfig>) {
  function set<K extends keyof TextFieldConfig>(key: K, value: TextFieldConfig[K]) {
    onChange({ ...field, [key]: value })
  }

  return (
    <>
      <FormRow label="Placeholder">
        <TextInput
          value={field.placeholder}
          placeholder="e.g. Enter your full name"
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
        label="Prefix & suffix"
        hint="Static text shown inside the input, e.g. https:// and .com"
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
