import { createId } from '../../lib/id'
import { defineField } from '../types'
import { MultiSelectConfigEditor } from './ConfigEditor'
import { MultiSelectFillInput } from './FillInput'
import type { MultiSelectFieldConfig } from '../../types'

/*
  The config type is stated explicitly rather than inferred. Inference takes its
  candidate from `createDefault`'s object literal, which pins `minSelections` to
  `null`; `ConfigEditorProps<T>` is contravariant in `T`, so an editor that
  accepts the real (wider) config is then rejected for not accepting that
  narrowed literal.
*/
export default defineField<MultiSelectFieldConfig>({
  type: 'multiselect',
  name: 'Multi Select',
  description: 'Pick one or more options',
  icon: 'multiselect',
  order: 60,
  capturesValue: true,
  supportsRequired: true,
  ownsLabel: false,

  createDefault: (id) => ({
    id,
    type: 'multiselect',
    label: '',
    // Option ids are generated rather than derived from the labels, so renaming
    // an option never invalidates an answer that already references it.
    options: [1, 2, 3].map((index) => ({ id: createId(), label: `Option ${index}` })),
    minSelections: null,
    maxSelections: null,
    conditions: [],
    defaultVisible: true,
    defaultRequired: false,
  }),

  ConfigEditor: MultiSelectConfigEditor,
  FillInput: MultiSelectFillInput,

  /*
    The export lists option *labels*, not the internal ids that are actually
    stored: an id is an implementation detail that means nothing to whoever
    reads the PDF or the instance table. An id with no matching option (the
    option was removed after the answer was recorded) falls back to the raw id
    so an edited template never silently swallows part of an answer.
  */
  formatValue: (field, value) => {
    const ids = Array.isArray(value)
      ? value.filter((entry): entry is string => typeof entry === 'string')
      : []

    if (ids.length === 0) return '—'

    return ids
      .map((id) => field.options.find((option) => option.id === id)?.label ?? id)
      .join(', ')
  },
})
