import { defineField } from '../types'
import { FileConfigEditor } from './ConfigEditor'
import { FileFillInput } from './FillInput'
import { formatFileSize } from '../../lib/validation'
import type { FieldValue, FileFieldConfig, FileMeta } from '../../types'

/** Narrows a stored value to the metadata list this field owns. */
function attachedFiles(value: FieldValue): FileMeta[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is FileMeta => typeof entry !== 'string')
    : []
}

// The generic is passed explicitly; see the note on `defineField`. Without it
// the literal (`allowedTypes: never[]`, `maxFiles: null`) is what `T` infers to,
// and the ConfigEditor's contravariant props then fail to match it.
export default defineField<FileFieldConfig>({
  type: 'file',
  name: 'File Upload',
  description: 'Attach one or more files',
  icon: 'file',
  order: 70,
  capturesValue: true,
  supportsRequired: true,
  ownsLabel: false,

  createDefault: (id) => ({
    id,
    type: 'file',
    label: '',
    allowedTypes: [],
    maxFiles: null,
    conditions: [],
    defaultVisible: true,
    defaultRequired: false,
  }),

  ConfigEditor: FileConfigEditor,
  FillInput: FileFillInput,

  // The file contents are never read or uploaded, only name, size and MIME
  // type, so the export has nothing but the metadata to describe.
  // Sizes are part of what the answer means ("which file, how big"), so they
  // belong in the text rather than being dropped as decoration.
  formatValue: (_field, value) => {
    const files = attachedFiles(value)
    if (files.length === 0) return '—'
    return files.map((file) => `${file.name} (${formatFileSize(file.size)})`).join('; ')
  },
})
