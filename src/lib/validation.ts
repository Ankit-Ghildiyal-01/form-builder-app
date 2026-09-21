/**
 * Validation engine: pure functions over (field, value, required), so the same
 * rules drive the inline errors in Fill Mode, the builder's preview and the
 * submit guard.
 *
 * Only *visible* fields are ever validated. `required` comes from the resolved
 * field state, where a hidden field is already never required, and
 * `validateForm` skips hidden fields entirely.
 */

import type { FieldConfig, FieldId, FieldState, FieldValue, FileMeta } from '../types'
import { isEmptyValue } from './conditions'

/** `Array.isArray` alone leaves `string[] | FileMeta[]`; these narrow further. */
function asStringArray(value: FieldValue): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : []
}

function asFileMetaArray(value: FieldValue): FileMeta[] {
  return Array.isArray(value)
    ? value.filter(
        (entry): entry is FileMeta =>
          typeof entry === 'object' && entry !== null && 'name' in entry && 'size' in entry,
      )
    : []
}

export interface ValidationError {
  fieldId: FieldId
  message: string
}

function countDecimals(value: number): number {
  const text = String(value)
  const dot = text.indexOf('.')
  if (dot === -1) return 0
  return text.length - dot - 1
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Returns an error message, or `null` when the value is acceptable. */
export function validateFieldValue(
  field: FieldConfig,
  value: FieldValue,
  required: boolean,
): string | null {
  // Display-only and read-only fields can never fail validation.
  if (field.type === 'section' || field.type === 'calculation') return null

  if (isEmptyValue(value)) {
    return required ? `${field.label} is required.` : null
  }

  switch (field.type) {
    case 'text':
    case 'textarea': {
      const text = typeof value === 'string' ? value : ''
      const length = text.length
      if (field.minLength !== null && length < field.minLength) {
        return `${field.label} must be at least ${field.minLength} characters.`
      }
      if (field.maxLength !== null && length > field.maxLength) {
        return `${field.label} must be at most ${field.maxLength} characters.`
      }
      return null
    }

    case 'number': {
      const numeric = typeof value === 'number' ? value : Number(value)
      if (Number.isNaN(numeric)) return `${field.label} must be a number.`
      if (field.min !== null && numeric < field.min) {
        return `${field.label} must be at least ${field.min}.`
      }
      if (field.max !== null && numeric > field.max) {
        return `${field.label} must be at most ${field.max}.`
      }
      if (countDecimals(numeric) > field.decimals) {
        return field.decimals === 0
          ? `${field.label} must be a whole number.`
          : `${field.label} must have at most ${field.decimals} decimal places.`
      }
      return null
    }

    case 'date': {
      const date = typeof value === 'string' ? value : ''
      if (field.min !== null && date !== '' && date < field.min) {
        return `${field.label} must be on or after ${field.min}.`
      }
      if (field.max !== null && date !== '' && date > field.max) {
        return `${field.label} must be on or before ${field.max}.`
      }
      return null
    }

    case 'select': {
      const selected = typeof value === 'string' ? value : ''
      if (!field.options.some((option) => option.id === selected)) {
        return `${field.label} has an invalid selection.`
      }
      return null
    }

    case 'multiselect': {
      const selected = asStringArray(value)
      if (field.minSelections !== null && selected.length < field.minSelections) {
        return `${field.label} requires at least ${field.minSelections} ${
          field.minSelections === 1 ? 'selection' : 'selections'
        }.`
      }
      if (field.maxSelections !== null && selected.length > field.maxSelections) {
        return `${field.label} allows at most ${field.maxSelections} ${
          field.maxSelections === 1 ? 'selection' : 'selections'
        }.`
      }
      return null
    }

    case 'file': {
      const files = asFileMetaArray(value)
      if (field.maxFiles !== null && files.length > field.maxFiles) {
        return `${field.label} allows at most ${field.maxFiles} ${
          field.maxFiles === 1 ? 'file' : 'files'
        }.`
      }
      if (field.allowedTypes.length > 0) {
        const rejected = files.filter((file) => !isAllowedFile(file.name, field.allowedTypes))
        if (rejected.length > 0) {
          return `${field.label} only accepts ${field.allowedTypes.join(', ')}.`
        }
      }
      return null
    }

    default:
      return null
  }
}

export function isAllowedFile(fileName: string, allowedTypes: string[]): boolean {
  if (allowedTypes.length === 0) return true
  const normalized = fileName.toLowerCase()
  return allowedTypes.some((type) =>
    type.startsWith('.') ? normalized.endsWith(type) : normalized.endsWith(`.${type}`),
  )
}

export function formatFileSize(bytes: number): string {
  return formatBytes(bytes)
}

/**
 * Validates a whole form. Hidden fields are skipped, so a field hidden by
 * conditional logic can never block submission even if it is marked required.
 */
export function validateForm(
  fields: FieldConfig[],
  values: Record<FieldId, FieldValue>,
  states: Map<FieldId, FieldState>,
): ValidationError[] {
  const errors: ValidationError[] = []

  for (const field of fields) {
    const state = states.get(field.id)
    if (!state?.visible) continue

    const message = validateFieldValue(field, values[field.id] ?? null, state.required)
    if (message) errors.push({ fieldId: field.id, message })
  }

  return errors
}
