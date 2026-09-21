import { useState, type DragEvent } from 'react'
import { Icon } from '../ui/Icon'
import { IconButton } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { getDefinition } from '../../fields/registry'
import type { FieldConfig, FieldId, FieldType, FormTemplate } from '../../types'
import type { DragPayload } from './types'
import './BuilderCanvas.css'

interface BuilderCanvasProps {
  template: FormTemplate
  selectedId: FieldId | null
  drag: DragPayload | null
  onSelect: (fieldId: FieldId) => void
  onAddAt: (type: FieldType, index: number) => void
  onMove: (from: number, to: number) => void
  onDuplicate: (fieldId: FieldId) => void
  onDelete: (fieldId: FieldId) => void
  onDragStateChange: (payload: DragPayload | null) => void
}

/**
 * The ordered list of fields.
 *
 * Rows show structure, not live controls. Real inputs would make selecting a
 * row fight with using it, and a builder view has no answers to fill in anyway.
 * That is what the live preview is for.
 *
 * Reordering is deliberately available two ways: drag-and-drop for a pointer,
 * and up/down buttons as the keyboard-accessible path (and the only one that
 * works on touch without a gesture polyfill).
 */
export function BuilderCanvas({
  template,
  selectedId,
  drag,
  onSelect,
  onAddAt,
  onMove,
  onDuplicate,
  onDelete,
  onDragStateChange,
}: BuilderCanvasProps) {
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  const fields = template.fields

  function reset() {
    setDropIndex(null)
    onDragStateChange(null)
  }

  function handleRowDragOver(event: DragEvent<HTMLLIElement>, index: number) {
    if (!drag) return
    event.preventDefault()
    event.dataTransfer.dropEffect = drag.kind === 'new' ? 'copy' : 'move'

    const rect = event.currentTarget.getBoundingClientRect()
    const isAfterMidpoint = event.clientY > rect.top + rect.height / 2
    setDropIndex(isAfterMidpoint ? index + 1 : index)
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()

    if (!drag || dropIndex === null) {
      reset()
      return
    }

    if (drag.kind === 'new') {
      onAddAt(drag.fieldType, dropIndex)
    } else {
      const from = fields.findIndex((field) => field.id === drag.fieldId)
      // Removing the dragged row first shifts everything below it up by one.
      const to = from < dropIndex ? dropIndex - 1 : dropIndex
      if (from !== -1 && from !== to) onMove(from, to)
    }

    reset()
  }

  if (fields.length === 0) {
    return (
      <div
        className={`canvas canvas--empty${drag ? ' canvas--dropping' : ''}`}
        onDragOver={(event) => {
          if (!drag) return
          event.preventDefault()
          event.dataTransfer.dropEffect = drag.kind === 'new' ? 'copy' : 'move'
          // An empty canvas is one drop zone with no row to sit before or after,
          // so 0 is the only index it can mean. Without this the index stays null
          // and `handleDrop` refuses the field, which is why dragging into an
          // empty form used to do nothing while a click still worked.
          setDropIndex(0)
        }}
        onDrop={handleDrop}
      >
        <EmptyState
          icon="layers"
          title="This form is empty"
          description="Drag a field type from the left, or click one to add it. You can reorder fields at any time."
        />
      </div>
    )
  }

  return (
    <div
      className={`canvas${drag ? ' canvas--dropping' : ''}`}
      onDragOver={(event) => {
        if (!drag) return
        event.preventDefault()
        // Only claim the drop when the pointer is past the last row's midpoint,
        // so descending into the rows does not immediately retarget the end.
        const rows = event.currentTarget.querySelectorAll('[data-field-row]')
        if (rows.length === 0) setDropIndex(0)
        else if (event.target === event.currentTarget) setDropIndex(fields.length)
      }}
      onDrop={handleDrop}
    >
      <ol className="canvas__list">
        {fields.map((field, index) => (
          <CanvasRow
            key={field.id}
            field={field}
            index={index}
            total={fields.length}
            selected={field.id === selectedId}
            showDropBefore={dropIndex === index}
            showDropAfter={dropIndex === index + 1 && index === fields.length - 1}
            onSelect={onSelect}
            onMove={onMove}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move'
              event.dataTransfer.setData('text/plain', field.id)
              onDragStateChange({ kind: 'move', fieldId: field.id })
            }}
            onDragEnd={reset}
            onDragOver={handleRowDragOver}
          />
        ))}
      </ol>
    </div>
  )
}

interface CanvasRowProps {
  field: FieldConfig
  index: number
  total: number
  selected: boolean
  showDropBefore: boolean
  showDropAfter: boolean
  onSelect: (fieldId: FieldId) => void
  onMove: (from: number, to: number) => void
  onDuplicate: (fieldId: FieldId) => void
  onDelete: (fieldId: FieldId) => void
  onDragStart: (event: DragEvent<HTMLLIElement>) => void
  onDragEnd: () => void
  onDragOver: (event: DragEvent<HTMLLIElement>, index: number) => void
}

function CanvasRow({
  field,
  index,
  total,
  selected,
  showDropBefore,
  showDropAfter,
  onSelect,
  onMove,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
}: CanvasRowProps) {
  const definition = getDefinition(field.type)
  const conditionCount = field.conditions.length
  // Surfaced here as well as in the config panel: a blank label is what blocks
  // saving, so it has to be findable without clicking through every field.
  const unlabelled = field.label.trim() === ''

  return (
    <li
      data-field-row
      id={`canvas-row-${field.id}`}
      className={`canvas-row${selected ? ' canvas-row--selected' : ''}${
        showDropBefore ? ' canvas-row--drop-before' : ''
      }${showDropAfter ? ' canvas-row--drop-after' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(event) => onDragOver(event, index)}
      onClick={() => onSelect(field.id)}
    >
      <span className="canvas-row__handle" aria-hidden="true">
        <Icon name="grip" size={16} />
      </span>

      <span className="canvas-row__icon" aria-hidden="true">
        <Icon name={definition.icon} size={16} />
      </span>

      <div className="canvas-row__main">
        <span className="canvas-row__label">{field.label || 'Untitled field'}</span>
        <span className="canvas-row__meta">
          <span className="canvas-row__type">{definition.name}</span>
          {unlabelled && (
            <span className="canvas-row__tag canvas-row__tag--danger">Needs a label</span>
          )}
          {!field.defaultVisible && <span className="canvas-row__tag">Hidden by default</span>}
          {field.defaultRequired && <span className="canvas-row__tag">Required</span>}
          {conditionCount > 0 && (
            <span className="canvas-row__tag canvas-row__tag--accent">
              {conditionCount === 1 ? '1 condition' : `${conditionCount} conditions`}
            </span>
          )}
        </span>
      </div>

      <span className="canvas-row__actions">
        <IconButton
          icon="chevron-up"
          label={`Move ${field.label || 'field'} up`}
          size="sm"
          disabled={index === 0}
          onClick={() => onMove(index, index - 1)}
        />
        <IconButton
          icon="chevron-down"
          label={`Move ${field.label || 'field'} down`}
          size="sm"
          disabled={index === total - 1}
          onClick={() => onMove(index, index + 1)}
        />
        <IconButton
          icon="copy"
          label={`Duplicate ${field.label || 'field'}`}
          size="sm"
          onClick={() => onDuplicate(field.id)}
        />
        <IconButton
          icon="trash"
          label={`Delete ${field.label || 'field'}`}
          size="sm"
          variant="danger"
          onClick={() => onDelete(field.id)}
        />
      </span>
    </li>
  )
}
