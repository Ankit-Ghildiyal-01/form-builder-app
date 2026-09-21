import { useState, type DragEvent } from 'react'
import { IconButton } from '../../components/ui/Button'
import { formatFileSize, isAllowedFile } from '../../lib/validation'
import type { FillInputProps } from '../types'
import type { FileFieldConfig, FileMeta } from '../../types'
import '../shared.css'
import './styles.css'

/**
 * Copies a picked `File` down to the metadata the app is allowed to keep.
 * The contents are never read: there is no `FileReader` here and no upload
 * anywhere in the project, so the `File` object stops at this boundary.
 */
function toMeta(file: File): FileMeta {
  return { name: file.name, size: file.size, type: file.type }
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many
}

/** "Accepts .pdf, .jpg, up to 3 files" / "Any file type, no limit". */
function constraintHint(field: FileFieldConfig): string {
  const types =
    field.allowedTypes.length > 0 ? `Accepts ${field.allowedTypes.join(', ')}` : 'Any file type'
  const limit =
    field.maxFiles === null
      ? 'no limit'
      : `up to ${field.maxFiles} ${plural(field.maxFiles, 'file', 'files')}`
  return `${types} · ${limit}`
}

export function FileFillInput({
  field,
  value,
  onChange,
  error,
  inputId,
  disabled = false,
}: FillInputProps<FileFieldConfig>) {
  const files: FileMeta[] = Array.isArray(value)
    ? value.filter((entry): entry is FileMeta => typeof entry !== 'string')
    : []

  const [dragging, setDragging] = useState(false)
  // Local, not part of the value: the warning describes *this* interaction
  // (what was just turned away), and must not be stored with the answer.
  const [warning, setWarning] = useState<string | null>(null)

  function addFiles(incoming: FileList | null) {
    if (disabled || !incoming) return
    const candidates = Array.from(incoming)

    const rejected = candidates.filter((file) => !isAllowedFile(file.name, field.allowedTypes))
    const allowed = candidates.filter((file) => isAllowedFile(file.name, field.allowedTypes))

    const max = field.maxFiles
    const room = max === null ? allowed.length : Math.max(0, max - files.length)
    const kept = allowed.slice(0, room)
    const overflow = allowed.length - kept.length

    const messages: string[] = []
    if (rejected.length > 0) {
      messages.push(
        `${rejected.length} ${plural(rejected.length, 'file was', 'files were')} ignored. Only ` +
          `${field.allowedTypes.join(', ')} accepted.`,
      )
    }
    if (overflow > 0 && max !== null) {
      messages.push(
        `${overflow} ${plural(overflow, 'file was', 'files were')} ignored. ` +
          `At most ${max} ${plural(max, 'file is', 'files are')} allowed.`,
      )
    }
    setWarning(messages.length > 0 ? messages.join(' ') : null)

    if (kept.length > 0) onChange([...files, ...kept.map(toMeta)])
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    // Leaving the zone for one of its own children also fires dragleave, so only
    // clear the highlight once the pointer has genuinely left the label.
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
  }

  return (
    <>
      <label
        className={[
          'field-drop',
          dragging ? 'field-drop--active' : '',
          disabled ? 'field-drop--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onDragOver={(event) => {
          // Without this the browser treats a drop as navigation and leaves the app.
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={handleDragLeave}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          addFiles(event.dataTransfer.files)
        }}
      >
        <input
          id={inputId}
          type="file"
          multiple
          className="field-drop__input"
          // Lets the OS picker filter to the configured extensions up front;
          // the check in `addFiles` still runs, because drag and drop bypasses it.
          accept={field.allowedTypes.join(',')}
          disabled={disabled}
          aria-describedby={error ? `${inputId}-error` : undefined}
          onChange={(event) => {
            addFiles(event.target.files)
            // A file input's value cannot be set programmatically, so it stays
            // uncontrolled. Clearing it afterwards is what lets the *same* file
            // fire a change event a second time: the browser only reports a
            // change when the selection differs from the current value.
            event.target.value = ''
          }}
        />
        <span className="field-drop__title">
          {dragging ? 'Drop to attach' : 'Click to attach files'}
        </span>
        <span className="field-drop__hint">{constraintHint(field)}</span>
      </label>

      {warning && <p className="field-limit field-limit--reached">{warning}</p>}

      {files.length > 0 && (
        <ul className="field-files">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="field-file">
              <span className="field-file__name" title={file.name}>
                {file.name}
              </span>
              <span className="field-file__meta">{formatFileSize(file.size)}</span>
              <IconButton
                icon="trash"
                size="sm"
                label={`Remove ${file.name}`}
                disabled={disabled}
                onClick={() => onChange(files.filter((_, position) => position !== index))}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
