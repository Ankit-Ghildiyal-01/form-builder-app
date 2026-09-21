/**
 * Builds the document model for the PDF export.
 *
 * Separate from the component that renders it, so the content rules are legible
 * without wading through markup: only fields visible at submit time appear,
 * in form order, with section headers kept as headings and values rendered by
 * each field's own `formatValue`, so an option shows its label rather than an
 * internal id, and a number keeps its unit.
 */

import { getDefinition } from '../fields/registry'
import type { FieldConfig, FieldId, FieldValue, FormInstance, SectionSize } from '../types'

export type PrintRow =
  | { kind: 'section'; id: FieldId; label: string; size: SectionSize }
  | { kind: 'value'; id: FieldId; label: string; value: string; multiline: boolean }

export interface PrintModel {
  title: string
  submittedAt: string
  rows: PrintRow[]
  /** Caveats rendered under the table, e.g. about file attachments. */
  notes: string[]
}

function hasAttachments(field: FieldConfig, value: FieldValue): boolean {
  return field.type === 'file' && Array.isArray(value) && value.length > 0
}

export function buildPrintModel(
  title: string,
  submittedAt: string,
  fields: FieldConfig[],
  values: Record<FieldId, FieldValue>,
  visibleFieldIds: FieldId[],
): PrintModel {
  const rows: PrintRow[] = []
  // A submitted instance records which fields were visible at submit time, so
  // an export always reproduces that submission rather than re-evaluating
  // today's conditional logic against it.
  const visible = new Set(visibleFieldIds)
  const visibleFields = fields.filter((field) => visible.has(field.id))
  const notes: string[] = []

  for (const field of visibleFields) {
    const value = values[field.id] ?? null

    if (field.type === 'section') {
      rows.push({ kind: 'section', id: field.id, label: field.label, size: field.size })
      continue
    }

    const definition = getDefinition(field.type)
    rows.push({
      kind: 'value',
      id: field.id,
      label: field.label,
      value: definition.formatValue(field, value),
      // Multi-line answers keep their line breaks in the export rather than
      // being flattened into one run-on line.
      multiline: field.type === 'textarea',
    })

    if (hasAttachments(field, value)) {
      notes.push(
        'File attachments are listed by name and size only. Files are never uploaded, so their contents are not embedded in this export.',
      )
    }
  }

  return { title, submittedAt, rows, notes }
}

/**
 * Builds the export for an already-submitted instance.
 *
 * Everything comes from the instance's own snapshot (its frozen field list and
 * its recorded visible ids), so re-downloading an old response reproduces the
 * document exactly as it was, even if the template has been edited or deleted
 * since.
 */
export function printModelForInstance(instance: FormInstance): PrintModel {
  return buildPrintModel(
    instance.templateTitle,
    instance.submittedAt,
    instance.fields,
    instance.values,
    instance.visibleFieldIds,
  )
}
