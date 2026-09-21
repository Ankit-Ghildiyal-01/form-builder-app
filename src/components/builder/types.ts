import type { FieldId, FieldType } from '../../types'

/**
 * What is currently being dragged: the palette adds a new field, the canvas
 * reorders an existing one, and the canvas has to know which.
 *
 * Held in React state rather than read from `dataTransfer`, whose payload is
 * only readable on `drop`, and the insertion indicator needs it *during*
 * `dragover`.
 */
export type DragPayload =
  | { kind: 'new'; fieldType: FieldType }
  | { kind: 'move'; fieldId: FieldId }
