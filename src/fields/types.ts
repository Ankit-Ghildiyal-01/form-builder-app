/**
 * The field-module contract.
 *
 * One folder per field type under `src/fields/<type>/`, exporting a definition,
 * a `ConfigEditor` (Builder Mode) and a `FillInput` (Fill Mode). Everything else
 * in the app is generic over this contract, so adding an 11th type means writing
 * one folder and adding one member to the `FieldConfig` union.
 *
 * The `T` generic keeps each module fully typed: inside the text field's
 * `ConfigEditor` the parameter is a `TextFieldConfig`, so `field.rows` is a
 * compile error rather than a runtime surprise.
 */

import type { ComponentType } from 'react'
import type { FieldConfig, FieldId, FieldValue } from '../types'
import type { IconName } from '../components/ui/Icon'

export interface ConfigEditorProps<T extends FieldConfig> {
  field: T
  onChange: (next: T) => void
  /** The form's other fields, so pickers can filter their own candidates. */
  siblings: FieldConfig[]
}

export interface FillInputProps<T extends FieldConfig> {
  field: T
  value: FieldValue | null
  onChange: (value: FieldValue) => void
  error: string | null
  /** DOM id for the wrapping `<label htmlFor>`. */
  inputId: string
  disabled?: boolean
}

export interface FieldDefinition<T extends FieldConfig> {
  /** Must match the field config's discriminant. */
  type: T['type']
  /** Palette name, e.g. "Single Line Text". */
  name: string
  /** One-line palette hint. */
  description: string
  icon: IconName
  /**
   * Position in the builder palette. Declared rather than derived from import
   * order, which would make the palette non-deterministic.
   */
  order: number
  /** False for display-only (section) and derived (calculation) fields. */
  capturesValue: boolean
  /** Whether the Required controls apply to this field type. */
  supportsRequired: boolean
  /**
   * True when the module renders its own visible title, so the field shell must
   * suppress the label it would otherwise add. Only the Section Header needs
   * this: its `label` *is* the heading, not a caption above a control.
   */
  ownsLabel: boolean
  createDefault: (id: FieldId) => T
  ConfigEditor: ComponentType<ConfigEditorProps<T>>
  FillInput: ComponentType<FillInputProps<T>>
  /** Plain-text rendering of a stored value, for the PDF and read-only views. */
  formatValue: (field: T, value: FieldValue) => string
}

/**
 * A definition with its precise field type erased, for the registry map.
 *
 * The erasure is sound because a definition is only ever registered under its
 * own `type` and reached by dispatching on that same discriminant. Keeping the
 * one cast here is the point: the alternative is every field module accepting
 * the full union and narrowing internally.
 */
export type RegisteredFieldDefinition = FieldDefinition<FieldConfig>

/**
 * Identity helper that keeps a definition's precise field type.
 *
 * Pass the type argument explicitly (`defineField<TextFieldConfig>({...})`).
 * Without it TypeScript infers `T` from the `createDefault` literal, which
 * widens `[]` to `never[]` and `0` to `number`, so `T` collapses to a narrower
 * shape and the components, typed for the real config, no longer match.
 */
export function defineField<T extends FieldConfig>(
  definition: FieldDefinition<T>,
): FieldDefinition<T> {
  return definition
}
