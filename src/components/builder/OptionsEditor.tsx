import { IconButton } from '../ui/Button'
import { TextInput } from '../ui/Controls'
import { createId } from '../../lib/id'
import type { SelectOption } from '../../types'
import './OptionsEditor.css'

interface OptionsEditorProps {
  options: SelectOption[]
  onChange: (options: SelectOption[]) => void
  /** Shown under the list, e.g. "used for the dropdown labels". */
  hint?: string
}

/**
 * Add / edit / remove / reorder an option list, shared by Single and Multi
 * Select so the two stay identical.
 *
 * Reordering uses up/down buttons rather than drag-and-drop: for a list this
 * short it is faster with a keyboard, works on touch with no gesture polyfill,
 * and needs none of the drop-target bookkeeping the field canvas uses.
 */
export function OptionsEditor({ options, onChange, hint }: OptionsEditorProps) {
  function update(id: string, label: string) {
    onChange(options.map((option) => (option.id === id ? { ...option, label } : option)))
  }

  function remove(id: string) {
    onChange(options.filter((option) => option.id !== id))
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= options.length) return
    const next = [...options]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    onChange(next)
  }

  function add() {
    onChange([...options, { id: createId(), label: `Option ${options.length + 1}` }])
  }

  return (
    <div className="options-editor">
      {options.length === 0 && (
        <p className="options-editor__empty">
          No options yet. Add at least one so the field can be answered.
        </p>
      )}

      <ul className="options-editor__list">
        {options.map((option, index) => (
          <li key={option.id} className="options-editor__row">
            <span className="options-editor__index" aria-hidden="true">
              {index + 1}
            </span>
            <TextInput
              value={option.label}
              aria-label={`Option ${index + 1} label`}
              placeholder={`Option ${index + 1}`}
              onChange={(event) => update(option.id, event.target.value)}
            />
            <span className="options-editor__actions">
              <IconButton
                icon="chevron-up"
                label={`Move option ${index + 1} up`}
                size="sm"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              />
              <IconButton
                icon="chevron-down"
                label={`Move option ${index + 1} down`}
                size="sm"
                disabled={index === options.length - 1}
                onClick={() => move(index, 1)}
              />
              <IconButton
                icon="trash"
                label={`Remove option ${index + 1}`}
                size="sm"
                variant="danger"
                onClick={() => remove(option.id)}
              />
            </span>
          </li>
        ))}
      </ul>

      <button type="button" className="options-editor__add" onClick={add}>
        Add option
      </button>

      {hint && <p className="options-editor__hint">{hint}</p>}
    </div>
  )
}
