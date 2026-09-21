/**
 * Domain model for the whole application.
 *
 * The field model is a discriminated union on `type`, and that single choice is
 * what makes the rest of the app type-safe: any `switch (field.type)` narrows to
 * the exact config shape, so reading a field-specific property from the wrong
 * field is a compile error.
 *
 * Adding a field type means adding its config here and a folder under
 * `src/fields/`: the registry discovers it and every surface picks it up.
 */

/* ---- Values -------------------------------------------------------------- */

export interface FileMeta {
  name: string
  size: number
  type: string
}

/** Any value a field can hold; which member applies is the field's `type`. */
export type FieldValue = string | number | string[] | FileMeta[] | null

/** Maps a field type to the value shape it stores. Used to keep fill-mode code honest. */
export type FieldValueFor<T extends FieldType> = T extends 'number' | 'calculation'
  ? number | null
  : T extends 'multiselect'
    ? string[]
    : T extends 'file'
      ? FileMeta[]
      : string

/* ---- Conditional logic --------------------------------------------------- */

export type ConditionOperator =
  // text / textarea
  | 'equals'
  | 'not-equals'
  | 'contains'
  // number
  | 'greater-than'
  | 'less-than'
  | 'within-range'
  // multiselect
  | 'contains-any'
  | 'contains-all'
  | 'contains-none'
  // date
  | 'before'
  | 'after'

export type ConditionEffect = 'show' | 'hide' | 'require' | 'unrequire'

/** The comparison operand, tagged so the value editor and evaluator agree. */
export type ConditionValue =
  | { kind: 'text'; text: string }
  | { kind: 'number'; value: number | null }
  | { kind: 'range'; min: number | null; max: number | null }
  /** Covers both select (exactly one id) and multiselect (one or more ids). */
  | { kind: 'selection'; optionIds: string[] }
  | { kind: 'date'; date: string }

export interface Condition {
  id: string
  /** Never this field's own id; enforced in the builder's target picker. */
  targetFieldId: FieldId
  operator: ConditionOperator
  value: ConditionValue
  effect: ConditionEffect
}

/** Resolved runtime state of a field, after conditional logic is applied. */
export interface FieldState {
  visible: boolean
  required: boolean
}

/* ---- Field configuration ------------------------------------------------- */

export type FieldId = string

export interface SelectOption {
  id: string
  label: string
}

/**
 * What every field carries: identity, the conditional-logic model, and the
 * defaults that apply when no rule decides the outcome.
 */
export interface BaseFieldConfig {
  id: FieldId
  label: string
  conditions: Condition[]
  defaultVisible: boolean
  defaultRequired: boolean
}

export interface TextFieldConfig extends BaseFieldConfig {
  type: 'text'
  placeholder: string
  minLength: number | null
  maxLength: number | null
  /** Static text rendered before the input, e.g. `https://`. */
  prefix: string
  /** Static text rendered after the input, e.g. `.com`. */
  suffix: string
}

export interface TextareaFieldConfig extends BaseFieldConfig {
  type: 'textarea'
  placeholder: string
  minLength: number | null
  maxLength: number | null
  rows: number
}

export interface NumberFieldConfig extends BaseFieldConfig {
  type: 'number'
  min: number | null
  max: number | null
  /** 0–4. */
  decimals: number
  prefix: string
  suffix: string
}

export interface DateFieldConfig extends BaseFieldConfig {
  type: 'date'
  /** When true, a new form instance opens with this field set to today. */
  prefillToday: boolean
  /** ISO `yyyy-mm-dd`. */
  min: string | null
  max: string | null
}

export type SelectDisplay = 'radio' | 'dropdown' | 'tiles'

export interface SelectFieldConfig extends BaseFieldConfig {
  type: 'select'
  options: SelectOption[]
  display: SelectDisplay
}

export interface MultiSelectFieldConfig extends BaseFieldConfig {
  type: 'multiselect'
  options: SelectOption[]
  minSelections: number | null
  maxSelections: number | null
}

export interface FileFieldConfig extends BaseFieldConfig {
  type: 'file'
  /** Normalised lowercase extensions, e.g. `['.pdf', '.png']`. Empty means any. */
  allowedTypes: string[]
  maxFiles: number | null
}

export type SectionSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** Display-only grouping element. Captures no value. Uses `label` as its heading. */
export interface SectionFieldConfig extends BaseFieldConfig {
  type: 'section'
  size: SectionSize
}

export type Aggregation = 'sum' | 'average' | 'min' | 'max'

export interface CalculationFieldConfig extends BaseFieldConfig {
  type: 'calculation'
  /** Number fields only. A calculation may never source another calculation. */
  sourceFieldIds: FieldId[]
  aggregation: Aggregation
  decimals: number
}

export type FieldConfig =
  | TextFieldConfig
  | TextareaFieldConfig
  | NumberFieldConfig
  | DateFieldConfig
  | SelectFieldConfig
  | MultiSelectFieldConfig
  | FileFieldConfig
  | SectionFieldConfig
  | CalculationFieldConfig

export type FieldType = FieldConfig['type']

/** Field types that collect a value from the user. Excludes section + calculation. */
export type InputFieldType = Exclude<FieldType, 'section' | 'calculation'>

/** Fields that can be a calculation source. */
export type NumericFieldType = 'number'

/* ---- Persistence --------------------------------------------------------- */

export interface FormTemplate {
  id: string
  title: string
  description: string
  fields: FieldConfig[]
  createdAt: string
  updatedAt: string
}

/**
 * A submitted form.
 *
 * `fields` and `templateTitle` are a snapshot taken at submit time, not a
 * reference to the live template: editing a template afterwards must not rewrite
 * the historical record, so a re-downloaded PDF reproduces what was submitted.
 */
export interface FormInstance {
  id: string
  templateId: string
  templateTitle: string
  /** Snapshot of the template's fields at submit time. */
  fields: FieldConfig[]
  values: Record<FieldId, FieldValue>
  /** Only fields that were visible at submit. Hidden values are never persisted. */
  visibleFieldIds: FieldId[]
  submittedAt: string
}

export const STORAGE_VERSION = 1

export interface StorageSchema {
  version: number
  templates: FormTemplate[]
  instances: FormInstance[]
}
