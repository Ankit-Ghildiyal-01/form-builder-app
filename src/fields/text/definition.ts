import { defineField } from '../types'
import type { TextFieldConfig } from '../../types'
import { TextConfigEditor } from './ConfigEditor'
import { TextFillInput } from './FillInput'

export default defineField<TextFieldConfig>({
  type: 'text',
  name: 'Single Line Text',
  description: 'Short free-text answer',
  icon: 'text',
  order: 10,
  capturesValue: true,
  supportsRequired: true,
  ownsLabel: false,

  createDefault: (id) => ({
    id,
    type: 'text',
    label: '',
    placeholder: '',
    minLength: null,
    maxLength: null,
    prefix: '',
    suffix: '',
    conditions: [],
    defaultVisible: true,
    defaultRequired: false,
  }),

  ConfigEditor: TextConfigEditor,
  FillInput: TextFillInput,

  // Affixes are part of how the answer reads on a filled form, so they are
  // reproduced in the export rather than dropped as decoration.
  formatValue: (field, value) =>
    typeof value === 'string' && value.trim() !== ''
      ? `${field.prefix}${value}${field.suffix}`
      : '—',
})
