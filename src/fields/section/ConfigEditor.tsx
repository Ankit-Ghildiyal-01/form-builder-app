import { FormRow, Segmented, type SegmentedOption } from '../../components/ui/Controls'
import type { ConfigEditorProps } from '../types'
import type { SectionFieldConfig, SectionSize } from '../../types'

const SIZE_OPTIONS: ReadonlyArray<SegmentedOption<SectionSize>> = [
  { value: 'xs', label: 'XS' },
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'XL' },
]

/**
 * The generic Label control does double duty here: for a section it is the
 * heading text that gets rendered, not a caption, so the Size hint says so.
 */
export function SectionConfigEditor({ field, onChange }: ConfigEditorProps<SectionFieldConfig>) {
  function set<K extends keyof SectionFieldConfig>(key: K, value: SectionFieldConfig[K]) {
    onChange({ ...field, [key]: value })
  }

  return (
    <>
      <FormRow
        label="Size"
        hint="Sets the heading level and visual weight, from an XS caption-like label up to an XL group break. The Label above is rendered as this section's heading text."
      >
        <Segmented
          options={SIZE_OPTIONS}
          value={field.size}
          onChange={(value) => set('size', value)}
          label="Section size"
        />
      </FormRow>

      {/*
        Nothing else belongs here. A section validates nothing, so a Required
        toggle would be inert, and every other common control is already
        rendered by the generic panel.
      */}
    </>
  )
}
