import { FormRow, FormRowPair, TextInput } from '../../components/ui/Controls'
import { Toggle } from '../../components/ui/Toggle'
import type { ConfigEditorProps } from '../types'
import type { DateFieldConfig } from '../../types'

export function DateConfigEditor({ field, onChange }: ConfigEditorProps<DateFieldConfig>) {
  function set<K extends keyof DateFieldConfig>(key: K, value: DateFieldConfig[K]) {
    onChange({ ...field, [key]: value })
  }

  return (
    <>
      {/*
        Not wrapped in a FormRow: Toggle renders its own title and hint line,
        so a row label here would caption it twice.
      */}
      <Toggle
        checked={field.prefillToday}
        label="Pre-fill with today's date"
        hint="A new form opens with this field already set to today. The answer stays editable, and someone can clear it like any other value."
        onChange={(checked) => set('prefillToday', checked)}
      />

      {/*
        This is configuration only. The pre-fill itself is applied by the fill
        page when it opens a *new* instance, never here and never on an
        existing or re-opened instance, where it would overwrite a saved answer.
        Do not move that behaviour into this editor.
      */}

      <FormRow
        label="Earliest & latest date"
        hint="Dates outside this range are rejected when the form is submitted. Leave either side blank for no limit."
      >
        <FormRowPair>
          <TextInput
            type="date"
            value={field.min ?? ''}
            onChange={(event) =>
              // The control reports "no date" as the empty string; the config
              // models that as `null` so "unset" has exactly one representation.
              set('min', event.target.value === '' ? null : event.target.value)
            }
          />
          <TextInput
            type="date"
            value={field.max ?? ''}
            onChange={(event) =>
              set('max', event.target.value === '' ? null : event.target.value)
            }
          />
        </FormRowPair>
      </FormRow>
    </>
  )
}
