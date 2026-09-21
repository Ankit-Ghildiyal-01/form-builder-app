/**
 * Field registry.
 *
 * Definitions are discovered with Vite's `import.meta.glob`, so adding a field
 * type means dropping in a folder, with no central switch to keep in sync. Each
 * `src/fields/<type>/definition.ts` must `export default` a definition.
 *
 * The one place in the app where a precise field type is erased. Modules are
 * found at runtime, so the cast is guarded by shape checks: a malformed module
 * is reported and skipped at startup instead of crashing mid-edit.
 */

import type { FieldConfig, FieldType } from '../types'
import type { RegisteredFieldDefinition } from './types'

type DefinitionModule = { default: unknown }

const modules = import.meta.glob<DefinitionModule>('./*/definition.ts', { eager: true })

function readDefinition(moduleValue: unknown): RegisteredFieldDefinition | null {
  if (typeof moduleValue !== 'object' || moduleValue === null) return null

  const candidate = (moduleValue as DefinitionModule).default
  if (typeof candidate !== 'object' || candidate === null) return null

  const definition = candidate as Partial<RegisteredFieldDefinition>

  // Shape checks, enough to guarantee the app can render and introspect it.
  if (typeof definition.type !== 'string') return null
  if (typeof definition.name !== 'string') return null
  if (typeof definition.order !== 'number') return null
  if (typeof definition.createDefault !== 'function') return null
  if (typeof definition.formatValue !== 'function') return null
  if (!definition.ConfigEditor) return null
  if (!definition.FillInput) return null

  return definition as RegisteredFieldDefinition
}

const registry = new Map<FieldType, RegisteredFieldDefinition>()

for (const [path, moduleValue] of Object.entries(modules)) {
  const definition = readDefinition(moduleValue)

  if (!definition) {
    console.error(`[form-builder] "${path}" does not export a valid field definition and was skipped.`)
    continue
  }
  if (registry.has(definition.type)) {
    console.error(`[form-builder] Duplicate field definition for type "${definition.type}".`)
    continue
  }

  registry.set(definition.type, definition)
}

/** Every registered definition, in palette order. */
export function allDefinitions(): RegisteredFieldDefinition[] {
  return [...registry.values()].sort((a, b) => a.order - b.order)
}

/**
 * Look up a definition by type. Falls back to the `text` definition for data
 * written by an older or newer build whose type this version does not know, so
 * an unknown field degrades to a plain input rather than a blank screen.
 */
export function getDefinition(type: string): RegisteredFieldDefinition {
  const definition = registry.get(type as FieldType)
  if (definition) return definition

  const fallback = registry.get('text')
  if (!fallback) {
    throw new Error(
      `[form-builder] No field definitions were registered (requested "${type}"). ` +
        'Check that src/fields/*/definition.ts modules exist.',
    )
  }
  console.warn(`[form-builder] Unknown field type "${type}"; rendering as plain text.`)
  return fallback
}

/** Builds a fully-populated default config for a newly added field. */
export function createField(type: FieldType, id: string): FieldConfig {
  return getDefinition(type).createDefault(id)
}
