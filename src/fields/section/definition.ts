import { defineField } from '../types'
import type { SectionFieldConfig } from '../../types'
import { SectionConfigEditor } from './ConfigEditor'
import { SectionFillInput } from './FillInput'

// The generic is passed explicitly; see the note on `defineField`. Left to
// inference, `createDefault`'s literal narrows the config to `size: 'md'` and
// the `ConfigEditor` below no longer matches.
export default defineField<SectionFieldConfig>({
  type: 'section',
  name: 'Section Header',
  description: 'Group and label part of the form',
  icon: 'section',
  order: 80,
  // A section is a display element: it groups and labels the fields beneath it
  // but never collects an answer.
  capturesValue: false,
  supportsRequired: false,
  // The only module that renders its own visible title. `label` *is* the
  // heading, not a caption above a control, so the generic shell must not add
  // a second one.
  ownsLabel: true,

  createDefault: (id) => ({
    id,
    type: 'section',
    label: '',
    size: 'md',
    conditions: [],
    defaultVisible: true,
    defaultRequired: false,
  }),

  ConfigEditor: SectionConfigEditor,
  FillInput: SectionFillInput,

  // The export layer special-cases sections and renders them as headings
  // rather than as a label/value row, so there is nothing to format here. The
  // empty string is deliberate: '—' is the convention for *a question that went
  // unanswered*, and a section is not a question, so showing that dash would
  // suggest something is missing.
  formatValue: () => '',
})
