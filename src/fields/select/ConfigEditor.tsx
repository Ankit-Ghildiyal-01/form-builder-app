import { FormRow, Segmented } from '../../components/ui/Controls'
import type { SegmentedOption } from '../../components/ui/Controls'
import { OptionsEditor } from '../../components/builder/OptionsEditor'
import type { ConfigEditorProps } from '../types'
import type { SelectDisplay, SelectFieldConfig } from '../../types'

/**
 * Typing the array pins `Segmented`'s generic to `SelectDisplay` rather than
 * letting it widen to `string`, which is what makes `set('display', …)` accept
 * the result without a cast.
 */
const DISPLAY_OPTIONS: ReadonlyArray<SegmentedOption<SelectDisplay>> = [
  { value: 'radio', label: 'Radio' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'tiles', label: 'Tiles' },
]

export function SelectConfigEditor({ field, onChange }: ConfigEditorProps<SelectFieldConfig>) {
  function set<K extends keyof SelectFieldConfig>(key: K, value: SelectFieldConfig[K]) {
    onChange({ ...field, [key]: value })
  }

  return (
    <>
      <FormRow
        label="Display type"
        hint="All three show the same options and save the same answer. Pick whichever reads best on the form."
      >
        <Segmented
          label="Display type"
          options={DISPLAY_OPTIONS}
          value={field.display}
          onChange={(display) => set('display', display)}
        />
      </FormRow>

      {/*
        The same editor Multi Select uses, so an option added here and one added
        there behave identically, including the ids, which are what both fields
        actually store.
      */}
      <FormRow label="Options">
        <OptionsEditor
          options={field.options}
          onChange={(options) => set('options', options)}
        />
      </FormRow>
    </>
  )
}
