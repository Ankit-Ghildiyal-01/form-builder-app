import { defineField } from '../types'
import type { TextareaFieldConfig } from '../../types'
import { TextareaConfigEditor } from './ConfigEditor'
import { TextareaFillInput } from './FillInput'

/*
  The generic is passed explicitly (`defineField<TextareaFieldConfig>`) for the
  reason documented on `defineField` itself: left to inference, `createDefault`'s
  object literal becomes the candidate for `T`, its `minLength: null` never
  widens, and the `ConfigEditor` below stops matching the narrowed config.
*/
export default defineField<TextareaFieldConfig>({
  type: 'textarea',
  name: 'Multi-line Text',
  description: 'Longer free-text answer',
  icon: 'textarea',
  order: 20,
  capturesValue: true,
  supportsRequired: true,
  ownsLabel: false,

  createDefault: (id) => ({
    id,
    type: 'textarea',
    label: '',
    placeholder: '',
    minLength: null,
    maxLength: null,
    rows: 4,
    conditions: [],
    defaultVisible: true,
    defaultRequired: false,
  }),

  ConfigEditor: TextareaConfigEditor,
  FillInput: TextareaFillInput,

  // The single-line field reproduces its affixes here because they are part of
  // how the answer reads; a textarea has none, so the stored string is already
  // the whole answer and is passed through untouched.
  formatValue: (_field, value) =>
    typeof value === 'string' && value.trim() !== '' ? value : '—',
})
