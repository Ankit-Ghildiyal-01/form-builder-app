import { defineField } from '../types'
import { DateConfigEditor } from './ConfigEditor'
import { DateFillInput } from './FillInput'
import type { DateFieldConfig } from '../../types'

// The generic is passed explicitly; see the note on `defineField`. Without it
// `createDefault`'s literal (`prefillToday: false`, `min: null`) is what `T`
// infers to, and the `ConfigEditor` below would no longer match.
export default defineField<DateFieldConfig>({
  type: 'date',
  name: 'Date',
  description: 'A calendar date',
  icon: 'date',
  order: 40,
  capturesValue: true,
  supportsRequired: true,
  ownsLabel: false,

  createDefault: (id) => ({
    id,
    type: 'date',
    label: '',
    prefillToday: false,
    min: null,
    max: null,
    conditions: [],
    defaultVisible: true,
    defaultRequired: false,
  }),

  ConfigEditor: DateConfigEditor,
  FillInput: DateFillInput,

  // The stored value is ISO `yyyy-mm-dd`: unambiguous, but machine-shaped.
  // Localising it here means the PDF export, the instance table and any future
  // summary all read the same way without each re-implementing the conversion.
  formatValue: (_field, value) => {
    if (typeof value !== 'string' || value.trim() === '') return '—'

    // The explicit `T00:00:00` is load-bearing. A bare `new Date('2025-03-12')`
    // is parsed as UTC midnight, which is the *previous* day for every user west
    // of Greenwich once rendered in local time. Appending a time makes the
    // string parse as local midnight, so the printed day always matches the
    // day the user picked.
    const date = new Date(`${value}T00:00:00`)

    // A hand-edited or corrupted stored value must degrade to a dash rather
    // than print "Invalid Date" on a submitted record.
    if (Number.isNaN(date.getTime())) return '—'

    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  },
})
