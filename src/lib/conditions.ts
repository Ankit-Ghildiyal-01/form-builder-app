/**
 * Conditional logic engine.
 *
 * Conditions are grouped by *effect* and every group is OR'd: any matching
 * `hide` hides the field, else any matching `show` shows it, else the field
 * falls back to `defaultVisible` (and the same for `require` / `unrequire`).
 * **OR within a group, defaults when nothing matches, and a negative effect
 * outranks a positive one.**
 *
 * A `show` rule is the one effect that changes who decides, and only once it has
 * something to go on. While the field it watches is empty there is nothing to
 * match, so the declared default keeps applying. The moment that field has an
 * answer, the show group takes over and the field is shown only while a rule
 * matches: read as "shown when X", a rule that could leave the field visible
 * when X is false would not be worth writing.
 *
 * Strict AND was rejected: "show this when the answer is X *or* Y" would need
 * the condition set duplicated, and one false condition would silently switch
 * off every hide rule. Making the negative win is the conservative choice.
 *
 * Two rules follow, both enforced here so no consumer can forget them:
 *
 *   - A hidden field is never required, so it cannot block submission or leak
 *     into the export.
 *   - An unanswered target matches nothing, so defaults apply. This is also
 *     what stops an untouched form lighting up every `does not equal` rule.
 *
 * Chains resolve depth-first with memoisation, judging each condition against
 * the target's *effective* value; a dependency cycle falls back to declared
 * defaults rather than looping.
 */

import type {
  Condition,
  ConditionOperator,
  ConditionValue,
  FieldConfig,
  FieldId,
  FieldState,
  FieldType,
  FieldValue,
} from '../types'

/* ---- Operator catalogue -------------------------------------------------- */

/**
 * Which operators each target field type supports.
 *
 * `calculation` sits alongside `number` because a calculation *is* a number to
 * the user. `file` and `section` are absent because there is nothing meaningful
 * to compare against.
 */
export const OPERATORS_BY_TARGET_TYPE: Partial<Record<FieldType, ConditionOperator[]>> = {
  text: ['equals', 'not-equals', 'contains'],
  textarea: ['equals', 'not-equals', 'contains'],
  number: ['equals', 'greater-than', 'less-than', 'within-range'],
  calculation: ['equals', 'greater-than', 'less-than', 'within-range'],
  date: ['equals', 'before', 'after'],
  select: ['equals', 'not-equals'],
  multiselect: ['contains-any', 'contains-all', 'contains-none'],
}

/** Field types that may be used as a condition target, in palette order. */
export const CONDITION_TARGET_TYPES: FieldType[] = [
  'text',
  'textarea',
  'number',
  'date',
  'select',
  'multiselect',
  'calculation',
]

export function operatorsFor(targetType: FieldType): ConditionOperator[] {
  return OPERATORS_BY_TARGET_TYPE[targetType] ?? []
}

export function canBeConditionTarget(field: FieldConfig): boolean {
  return operatorsFor(field.type).length > 0
}

export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: 'equals',
  'not-equals': 'does not equal',
  contains: 'contains',
  'greater-than': 'is greater than',
  'less-than': 'is less than',
  'within-range': 'is within range',
  'contains-any': 'contains any of',
  'contains-all': 'contains all of',
  'contains-none': 'contains none of',
  before: 'is before',
  after: 'is after',
}

/**
 * The operand shape an operator needs. Single source of truth shared by the
 * condition editor (to render the right control) and the evaluator (to
 * interpret it), so the two can never drift apart.
 */
export function valueKindFor(operator: ConditionOperator): ConditionValue['kind'] {
  switch (operator) {
    case 'equals':
    case 'not-equals':
    case 'contains':
      return 'text'
    case 'greater-than':
    case 'less-than':
      return 'number'
    case 'within-range':
      return 'range'
    case 'contains-any':
    case 'contains-all':
    case 'contains-none':
      return 'selection'
    case 'before':
    case 'after':
      return 'date'
  }
}

/**
 * `equals` / `not-equals` need a different operand for select (one option) than
 * for text (free text), so the target type refines the generic mapping.
 */
export function resolveValueKind(
  targetType: FieldType,
  operator: ConditionOperator,
): ConditionValue['kind'] {
  if (targetType === 'select' && (operator === 'equals' || operator === 'not-equals')) {
    return 'selection'
  }
  if (targetType === 'date' && operator === 'equals') {
    return 'date'
  }
  return valueKindFor(operator)
}

export function emptyValueForKind(kind: ConditionValue['kind']): ConditionValue {
  switch (kind) {
    case 'text':
      return { kind: 'text', text: '' }
    case 'number':
      return { kind: 'number', value: null }
    case 'range':
      return { kind: 'range', min: null, max: null }
    case 'selection':
      return { kind: 'selection', optionIds: [] }
    case 'date':
      return { kind: 'date', date: '' }
  }
}

/* ---- Value coercion ------------------------------------------------------ */

export function isEmptyValue(value: FieldValue | null | undefined): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (typeof value === 'number') return Number.isNaN(value)
  if (Array.isArray(value)) return value.length === 0
  return false
}

function asString(value: FieldValue | null): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}

function asNumber(value: FieldValue | null): number | null {
  if (typeof value === 'number') return Number.isNaN(value) ? null : value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

/**
 * Both selection shapes as a list: a Single Select stores one option id as a
 * bare string, a Multi Select stores an array. Without the string case the
 * `equals` operator could never match a Single Select and `not-equals` always
 * would.
 */
function asStringArray(value: FieldValue | null): string[] {
  if (typeof value === 'string') return value === '' ? [] : [value]
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

/* ---- Evaluation ---------------------------------------------------------- */

/**
 * Evaluates a single condition. `targetValue` must already be the target's
 * *effective* value (i.e. `null` when the target is hidden).
 */
export function matchCondition(
  condition: Condition,
  targetValue: FieldValue | null,
): boolean {
  // An unanswered target never satisfies a condition, so defaults apply.
  if (isEmptyValue(targetValue)) return false

  const { operator, value } = condition

  switch (value.kind) {
    case 'text': {
      // Case-insensitive: users do not think of "Yes" and "yes" as different.
      const actual = asString(targetValue).trim().toLowerCase()
      const expected = value.text.trim().toLowerCase()
      if (operator === 'equals') return actual === expected
      if (operator === 'not-equals') return actual !== expected
      if (operator === 'contains') return expected !== '' && actual.includes(expected)
      return false
    }

    case 'number': {
      const actual = asNumber(targetValue)
      if (actual === null || value.value === null) return false
      if (operator === 'equals') return actual === value.value
      if (operator === 'greater-than') return actual > value.value
      if (operator === 'less-than') return actual < value.value
      return false
    }

    case 'range': {
      const actual = asNumber(targetValue)
      if (actual === null) return false
      // An unbounded range is meaningless, so require at least one bound.
      if (value.min === null && value.max === null) return false
      if (value.min !== null && actual < value.min) return false
      if (value.max !== null && actual > value.max) return false
      return true
    }

    case 'selection': {
      const selected = asStringArray(targetValue)
      const expected = value.optionIds
      if (expected.length === 0) return false
      if (operator === 'equals') return selected.length === 1 && selected[0] === expected[0]
      if (operator === 'not-equals') return !(selected.length === 1 && selected[0] === expected[0])
      if (operator === 'contains-any') return expected.some((id) => selected.includes(id))
      if (operator === 'contains-all') return expected.every((id) => selected.includes(id))
      if (operator === 'contains-none') return !expected.some((id) => selected.includes(id))
      return false
    }

    case 'date': {
      // ISO `yyyy-mm-dd` sorts lexicographically, so string comparison is correct.
      const actual = asString(targetValue)
      if (operator === 'equals') return actual === value.date
      if (operator === 'before') return value.date !== '' && actual < value.date
      if (operator === 'after') return value.date !== '' && actual > value.date
      return false
    }
  }
}

export interface ResolutionInput {
  fields: FieldConfig[]
  values: Record<FieldId, FieldValue>
}

/**
 * Resolves every field's effective `visible` / `required` state.
 *
 * Depth-first with memoisation so that chained conditions see their target's
 * *effective* state, plus a `visiting` guard that breaks cycles.
 */
export function resolveFieldStates({ fields, values }: ResolutionInput): Map<FieldId, FieldState> {
  const byId = new Map<FieldId, FieldConfig>(fields.map((f) => [f.id, f]))
  const states = new Map<FieldId, FieldState>()
  const visiting = new Set<FieldId>()

  // Self-referencing conditions are rejected by the builder; ignore defensively.
  const activeConditions = (field: FieldConfig): Condition[] =>
    field.conditions.filter((condition) => condition.targetFieldId !== field.id)

  /** The state a field falls back to when nothing decides otherwise. */
  const declaredDefaults = (field: FieldConfig): FieldState => ({
    visible: field.defaultVisible,
    required: field.defaultRequired && field.defaultVisible,
  })

  function resolve(fieldId: FieldId): FieldState {
    const cached = states.get(fieldId)
    if (cached) return cached

    const field = byId.get(fieldId)
    // A condition pointing at a deleted field is inert, not a crash.
    if (!field) return { visible: true, required: false }

    // Cycle: a field ultimately depending on itself cannot be resolved. Fall back
    // to its declared defaults so the form still renders deterministically.
    if (visiting.has(fieldId)) return declaredDefaults(field)

    visiting.add(fieldId)
    const state = compute(field)
    visiting.delete(fieldId)

    states.set(fieldId, state)
    return state
  }

  function effectiveValueOf(fieldId: FieldId): FieldValue | null {
    const state = resolve(fieldId)
    // A hidden field contributes nothing, which is what makes chains collapse.
    if (!state.visible) return null
    return values[fieldId] ?? null
  }

  function compute(field: FieldConfig): FieldState {
    const conditions = activeConditions(field)
    const { visible: defaultVisible, required: defaultRequired } = declaredDefaults(field)
    let visible = defaultVisible
    let required = defaultRequired

    if (conditions.length > 0) {
      let matchedShow = false
      let matchedHide = false
      let matchedRequire = false
      let matchedUnrequire = false
      // Set once a show rule has an answer to work from, which is when the show
      // group takes the decision away from the field's declared default.
      let showRuleDecides = false

      for (const condition of conditions) {
        const targetValue = effectiveValueOf(condition.targetFieldId)

        if (condition.effect === 'show') {
          if (!isEmptyValue(targetValue)) showRuleDecides = true
          if (matchCondition(condition, targetValue)) matchedShow = true
          continue
        }

        if (!matchCondition(condition, targetValue)) continue
        if (condition.effect === 'hide') matchedHide = true
        else if (condition.effect === 'require') matchedRequire = true
        else matchedUnrequire = true
      }

      // Negative effects win, then positive, then defaults.
      if (showRuleDecides) visible = false
      if (matchedShow) visible = true
      if (matchedHide) visible = false

      if (matchedUnrequire) required = false
      else if (matchedRequire) required = true
    }

    // The hard invariant, enforced here so no downstream consumer can forget it.
    if (!visible) required = false

    return { visible, required }
  }

  for (const field of fields) resolve(field.id)

  return states
}

/** Convenience: the values that survive conditional logic, keyed by field id. */
export function visibleValues(
  fields: FieldConfig[],
  values: Record<FieldId, FieldValue>,
  states: Map<FieldId, FieldState>,
): Record<FieldId, FieldValue> {
  const result: Record<FieldId, FieldValue> = {}
  for (const field of fields) {
    if (field.type === 'section') continue
    if (!states.get(field.id)?.visible) continue
    result[field.id] = values[field.id] ?? null
  }
  return result
}
