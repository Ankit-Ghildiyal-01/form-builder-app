import { formatCalculationValue } from '../../lib/values'
import type { CalculationFieldConfig } from '../../types'
import { defineField } from '../types'
import { CalculationConfigEditor } from './ConfigEditor'
import { CalculationFillInput } from './FillInput'

/*
  The generic is passed explicitly; see the note on `defineField`. Without it
  `sourceFieldIds: []` and `aggregation: 'sum'` are inferred as literal types and
  become the field config, making `ConfigEditor` (which takes the real
  `CalculationFieldConfig`) a mismatch.
*/
export default defineField<CalculationFieldConfig>({
  type: 'calculation',
  name: 'Calculation',
  description: 'Derived value from number fields',
  icon: 'calculation',
  order: 90,
  // Nothing is captured: the value is derived from other fields on every render
  // and never stored as user input, so a calculation is absent from the palette's
  // "collects a value" group and from validation.
  capturesValue: false,
  // "Required" is meaningless for a value the user cannot type: asking them to
  // complete it would be asking for something no control can produce.
  supportsRequired: false,
  // It still shows an ordinary caption above its value, so the generic shell
  // keeps ownership of the label.
  ownsLabel: false,

  createDefault: (id) => ({
    id,
    type: 'calculation',
    label: '',
    sourceFieldIds: [],
    aggregation: 'sum',
    decimals: 2,
    conditions: [],
    defaultVisible: true,
    defaultRequired: false,
  }),

  ConfigEditor: CalculationConfigEditor,
  FillInput: CalculationFillInput,

  // Reuses the live UI's formatter rather than re-formatting here, so the PDF
  // and the instance tables can never disagree with the number that was on
  // screen, including the em dash for "no result".
  formatValue: (field, value) =>
    formatCalculationValue(typeof value === 'number' ? value : null, field.decimals),
})
