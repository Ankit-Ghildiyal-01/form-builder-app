import { defineField } from '../types'
import { NumberConfigEditor } from './ConfigEditor'
import { NumberFillInput } from './FillInput'
import type { NumberFieldConfig } from '../../types'

export default defineField<NumberFieldConfig>({
  type: 'number',
  name: 'Number',
  description: 'Numeric answer with optional limits',
  icon: 'number',
  order: 30,
  capturesValue: true,
  supportsRequired: true,
  ownsLabel: false,

  createDefault: (id) => ({
    id,
    type: 'number',
    label: '',
    min: null,
    max: null,
    decimals: 0,
    prefix: '',
    suffix: '',
    conditions: [],
    defaultVisible: true,
    defaultRequired: false,
  }),

  ConfigEditor: NumberConfigEditor,
  FillInput: NumberFillInput,

  // `$` and `kg` are not decoration around the answer: they are what the answer
  // means, so they are reproduced in the export alongside the digit, matching how
  // the text field treats its affixes. The configured decimal count is applied
  // here too, which is why the builder warns that it rounds on export.
  formatValue: (field, value) =>
    typeof value === 'number' && Number.isFinite(value)
      ? `${field.prefix}${value.toFixed(field.decimals)}${field.suffix}`
      : '—',
})
