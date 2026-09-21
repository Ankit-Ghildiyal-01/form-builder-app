/**
 * The values a form actually shows.
 *
 * Two jobs, both done before rendering and before export so the screen and the
 * PDF can never disagree: seeding a new instance's starting values, and folding
 * calculated results into the value map. A calculation is always derived, never
 * stored user input, and recomputing it per render is what makes it live.
 */

import type {
  Aggregation,
  CalculationFieldConfig,
  FieldConfig,
  FieldId,
  FieldState,
  FieldValue,
} from '../types'

/* ---- Aggregation --------------------------------------------------------- */

export const AGGREGATION_LABELS: Record<Aggregation, string> = {
  sum: 'Sum',
  average: 'Average',
  min: 'Minimum',
  max: 'Maximum',
}

function toNumber(value: FieldValue | undefined): number | null {
  if (typeof value === 'number') return Number.isNaN(value) ? null : value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/** Applies the aggregation to already-collected numbers. `[]` yields `null`. */
export function aggregate(kind: Aggregation, numbers: number[]): number | null {
  if (numbers.length === 0) return null

  switch (kind) {
    case 'sum':
      return numbers.reduce((total, n) => total + n, 0)
    case 'average':
      return numbers.reduce((total, n) => total + n, 0) / numbers.length
    case 'min':
      return Math.min(...numbers)
    case 'max':
      return Math.max(...numbers)
  }
}

/**
 * Computes a calculation field's current value, or `null` with no contributors.
 *
 * Hidden and empty sources are both excluded: counting them as zero would
 * corrupt a Sum, and an Average must not divide by a field the user cannot see.
 * With nothing to aggregate the result stays `null`: a Sum of nothing reading
 * `0` would imply the user typed zeroes somewhere.
 */
export function computeCalculationValue(
  field: CalculationFieldConfig,
  fields: FieldConfig[],
  values: Record<FieldId, FieldValue>,
  states: Map<FieldId, FieldState>,
): number | null {
  const byId = new Map<FieldId, FieldConfig>(fields.map((f) => [f.id, f]))

  const contributors: number[] = []
  for (const sourceId of field.sourceFieldIds) {
    const source = byId.get(sourceId)
    // Defensive: a calculation must never source a non-number, or itself.
    if (!source || source.type !== 'number') continue
    if (!states.get(sourceId)?.visible) continue
    const numeric = toNumber(values[sourceId])
    if (numeric === null) continue
    contributors.push(numeric)
  }

  const result = aggregate(field.aggregation, contributors)
  return result === null ? null : roundTo(result, field.decimals)
}

/** Number fields eligible as sources: the guard against calculation chains. */
export function calculationSources(fields: FieldConfig[], selfId: FieldId): FieldConfig[] {
  return fields.filter((f) => f.type === 'number' && f.id !== selfId)
}

/**
 * Drops calculation sources that no longer name a field.
 *
 * Deleting a Number field leaves its id behind in every calculation that sourced
 * it. A dead id is worse than a missing one: `computeCalculationValue` skips it,
 * but the "of N fields" note still counts it, so the total silently ignores a
 * field the builder believes is included and nothing on screen explains why.
 */
export function pruneCalculationSources(fields: FieldConfig[]): FieldConfig[] {
  const existing = new Set(fields.map((field) => field.id))
  let changed = false

  const pruned = fields.map((field): FieldConfig => {
    if (field.type !== 'calculation') return field
    const kept = field.sourceFieldIds.filter((id) => existing.has(id))
    if (kept.length === field.sourceFieldIds.length) return field

    changed = true
    return { ...field, sourceFieldIds: kept }
  })

  // Same reference when nothing was stale, so callers can use this in a memo.
  return changed ? pruned : fields
}

/** Formats a calculation result for display and export. */
export function formatCalculationValue(value: number | null, decimals: number): string {
  if (value === null) return '—'
  return value.toFixed(decimals)
}

/* ---- Seeding and folding ------------------------------------------------- */

/** Today as an ISO `yyyy-mm-dd` string in the user's local timezone. */
function todayISO(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/**
 * Seeds the starting values for a brand new instance.
 *
 * A "pre-fill with today" date is set here, once, rather than forced on every
 * render, the only behaviour that lets the user clear it without it springing
 * back. The seed is persisted with the instance, so a reload keeps the date the
 * form was started.
 */
export function createInitialValues(fields: FieldConfig[]): Record<FieldId, FieldValue> {
  const values: Record<FieldId, FieldValue> = {}
  const today = todayISO()

  for (const field of fields) {
    values[field.id] = field.type === 'date' && field.prefillToday ? today : null
  }

  return values
}

/**
 * Adds every calculation field's current result to the value map.
 *
 * One pass is always enough (a calculation may only source Number fields, never
 * another calculation), which is what keeps it out of the fixpoint treatment
 * conditional logic needs.
 */
export function withCalculations(
  fields: FieldConfig[],
  values: Record<FieldId, FieldValue>,
  states: Map<FieldId, FieldState>,
): Record<FieldId, FieldValue> {
  let resolved: Record<FieldId, FieldValue> | null = null

  for (const field of fields) {
    if (field.type !== 'calculation') continue
    const value = computeCalculationValue(field, fields, values, states)
    // Copy lazily so a form with no calculations skips the object churn.
    resolved ??= { ...values }
    resolved[field.id] = value
  }

  return resolved ?? values
}
