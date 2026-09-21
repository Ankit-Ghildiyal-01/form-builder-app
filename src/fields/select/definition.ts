import { createId } from '../../lib/id'
import { defineField } from '../types'
import type { SelectFieldConfig } from '../../types'
import { SelectConfigEditor } from './ConfigEditor'
import { SelectFillInput } from './FillInput'

/*
  The generic is passed explicitly. Left to inference, `createDefault`'s object
  literal is the first candidate for `T`, and because the literal is checked
  against an unresolved type parameter its `display: 'radio'` never widens to
  `SelectDisplay`, so `T` collapses to that one literal shape and the `ConfigEditor`
  below stops matching. Naming the config here pins `T` to the real type.
*/
export default defineField<SelectFieldConfig>({
  type: 'select',
  name: 'Single Select',
  description: 'Pick one option from a list',
  icon: 'select',
  order: 50,
  capturesValue: true,
  supportsRequired: true,
  ownsLabel: false,

  // The three defaults are created up front, with fresh ids, so a newly dropped
  // field is answerable immediately: an empty option list would render as a
  // configuration warning until the builder visited the config panel.
  createDefault: (id) => ({
    id,
    type: 'select',
    label: '',
    options: [
      { id: createId(), label: 'Option 1' },
      { id: createId(), label: 'Option 2' },
      { id: createId(), label: 'Option 3' },
    ],
    display: 'radio',
    conditions: [],
    defaultVisible: true,
    defaultRequired: false,
  }),

  ConfigEditor: SelectConfigEditor,
  FillInput: SelectFillInput,

  // The export must show the human label, never the internal option id: the id
  // is a generated UUID, meaningless in a PDF or an instance table. A value that
  // no longer matches an option (its choice was deleted after submission) falls
  // back to the raw string so a historical record still prints something.
  formatValue: (field, value) =>
    typeof value === 'string' && value !== ''
      ? (field.options.find((option) => option.id === value)?.label ?? value)
      : '—',
})
