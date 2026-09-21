import { Icon } from '../ui/Icon'
import { allDefinitions } from '../../fields/registry'
import type { FieldType } from '../../types'
import type { DragPayload } from './types'
import './FieldPalette.css'

interface FieldPaletteProps {
  /** Click-to-add appends to the end of the form. */
  onAdd: (type: FieldType) => void
  onDragStart: (payload: DragPayload) => void
  onDragEnd: () => void
}

/**
 * The catalogue of available field types, read from the registry so a new module
 * appears here the moment it exists.
 *
 * Each entry supports drag (to place a field precisely) and click (to append),
 * because dragging is not reachable from a keyboard.
 */
export function FieldPalette({ onAdd, onDragStart, onDragEnd }: FieldPaletteProps) {
  const definitions = allDefinitions()
  const inputFields = definitions.filter((definition) => definition.capturesValue)
  const displayFields = definitions.filter((definition) => !definition.capturesValue)

  function renderItem(type: FieldType) {
    const definition = definitions.find((candidate) => candidate.type === type)
    if (!definition) return null

    return (
      <li key={definition.type}>
        <button
          type="button"
          className="palette-item"
          draggable
          onClick={() => onAdd(definition.type)}
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = 'copy'
            // Set for interoperability; the canvas reads the React state copy.
            event.dataTransfer.setData('text/plain', definition.type)
            onDragStart({ kind: 'new', fieldType: definition.type })
          }}
          onDragEnd={onDragEnd}
        >
          <span className="palette-item__icon" aria-hidden="true">
            <Icon name={definition.icon} size={16} />
          </span>
          <span className="palette-item__text">
            <span className="palette-item__name">{definition.name}</span>
            <span className="palette-item__description">{definition.description}</span>
          </span>
        </button>
      </li>
    )
  }

  return (
    <div className="palette">
      <div className="palette__group">
        <h3 className="palette__heading">Fields</h3>
        <ul className="palette__list">
          {inputFields.map((definition) => renderItem(definition.type))}
        </ul>
      </div>

      <div className="palette__group">
        <h3 className="palette__heading">Layout &amp; derived</h3>
        <ul className="palette__list">
          {displayFields.map((definition) => renderItem(definition.type))}
        </ul>
      </div>

      <p className="palette__hint">
        Drag onto the canvas to place a field, or click to add it to the end.
      </p>
    </div>
  )
}
