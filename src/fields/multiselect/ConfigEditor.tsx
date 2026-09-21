import { FormRow, FormRowPair, NumberInput } from '../../components/ui/Controls'
import { OptionsEditor } from '../../components/builder/OptionsEditor'
import type { ConfigEditorProps } from '../types'
import type { MultiSelectFieldConfig } from '../../types'

export function MultiSelectConfigEditor({
  field,
  onChange,
}: ConfigEditorProps<MultiSelectFieldConfig>) {
  function set<K extends keyof MultiSelectFieldConfig>(key: K, value: MultiSelectFieldConfig[K]) {
    onChange({ ...field, [key]: value })
  }

  return (
    <>
      <FormRow label="Options">
        {/* The same editor Single Select uses, so the two option lists the
            builder shows are one implementation rather than two that drift. */}
        <OptionsEditor
          options={field.options}
          onChange={(options) => set('options', options)}
          hint="Respondents tick one or more of these."
        />
      </FormRow>

      <FormRow label="Selection limits" hint="Leave either side blank for no limit.">
        <FormRowPair>
          {/*
            Each bound constrains the other on blur, so a minimum above the
            maximum is corrected on the spot rather than stored as a range that
            can never be satisfied.
          */}
          <NumberInput
            value={field.minSelections}
            integer
            min={0}
            max={field.maxSelections ?? undefined}
            placeholder="Min"
            onChange={(value) => set('minSelections', value)}
          />
          <NumberInput
            value={field.maxSelections}
            integer
            min={field.minSelections ?? 0}
            placeholder="Max"
            onChange={(value) => set('maxSelections', value)}
          />
        </FormRowPair>
      </FormRow>
    </>
  )
}
