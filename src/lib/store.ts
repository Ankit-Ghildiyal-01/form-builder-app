/**
 * The whole application store: one localStorage document, plus the React
 * bindings onto it.
 *
 * One key (`form-builder:v1`) holds `{ version, templates, instances }`. One key
 * rather than one per record makes every write atomic, since instances reference
 * templates by id and a half-written store is a broken one.
 *
 * Two invariants here are load-bearing and the compiler cannot check either:
 * `getSnapshot` has to return a cached object, because a fresh one per call makes
 * `useSyncExternalStore` loop, and it has to be synchronous, because `BuilderPage`
 * seeds its draft from `useTemplate` during the first render.
 */

import { useMemo, useSyncExternalStore } from 'react'
import {
  STORAGE_VERSION,
  type FormInstance,
  type FormTemplate,
  type StorageSchema,
} from '../types'
import { createId } from './id'

const STORAGE_KEY = 'form-builder:v1'

/* ---- Load / save --------------------------------------------------------- */

function emptySchema(): StorageSchema {
  return { version: STORAGE_VERSION, templates: [], instances: [] }
}

/** Corrupt or hand-edited storage degrades to an empty store, never a crash. */
function parseSchema(raw: string | null): StorageSchema {
  if (!raw) return emptySchema()

  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return emptySchema()

    const candidate = parsed as Partial<StorageSchema>
    return {
      version: typeof candidate.version === 'number' ? candidate.version : STORAGE_VERSION,
      templates: Array.isArray(candidate.templates) ? candidate.templates : [],
      instances: Array.isArray(candidate.instances) ? candidate.instances : [],
    }
  } catch {
    console.warn('[form-builder] Stored data was unreadable and has been reset.')
    return emptySchema()
  }
}

/**
 * Guarded too: the access itself throws where storage is blocked (Safari private
 * mode), and that throw would escape `getSnapshot` mid-render.
 */
function readRaw(): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

let cache: StorageSchema | null = null
const listeners = new Set<() => void>()

function read(): StorageSchema {
  if (cache === null) cache = parseSchema(readRaw())
  return cache
}

function commit(next: StorageSchema): void {
  cache = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch (error) {
    // Quota exceeded or storage disabled: keep the in-memory state so the session
    // still works, rather than failing silently.
    console.error('[form-builder] Could not persist to localStorage.', error)
  }
  listeners.forEach((listener) => listener())
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot(): StorageSchema {
  return read()
}

/* ---- Mutations ----------------------------------------------------------- */

export function createTemplate(title = 'Untitled form'): FormTemplate {
  const now = new Date().toISOString()
  return { id: createId(), title, description: '', fields: [], createdAt: now, updatedAt: now }
}

export function saveTemplate(template: FormTemplate): FormTemplate {
  const current = read()
  const updated: FormTemplate = { ...template, updatedAt: new Date().toISOString() }
  const exists = current.templates.some((t) => t.id === template.id)

  commit({
    ...current,
    templates: exists
      ? current.templates.map((t) => (t.id === updated.id ? updated : t))
      : [...current.templates, updated],
  })

  return updated
}

/** Removes a template and every instance submitted against it. */
export function deleteTemplate(templateId: string): void {
  const current = read()
  commit({
    ...current,
    templates: current.templates.filter((t) => t.id !== templateId),
    instances: current.instances.filter((i) => i.templateId !== templateId),
  })
}

export function saveInstance(instance: FormInstance): void {
  const current = read()
  commit({ ...current, instances: [...current.instances, instance] })
}

export function deleteInstance(instanceId: string): void {
  const current = read()
  commit({ ...current, instances: current.instances.filter((i) => i.id !== instanceId) })
}

/* ---- React bindings ------------------------------------------------------ */

/** The whole document. Prefer the narrower hooks below where they fit. */
export function useStore(): StorageSchema {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/**
 * Every template, oldest first, so the grid is stable: ordering by last edit
 * reshuffles the cards whenever one is opened or saved, moving the one you were
 * about to click.
 */
export function useTemplates(): FormTemplate[] {
  const schema = useStore()
  return useMemo(
    () => [...schema.templates].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [schema],
  )
}

export function useTemplate(templateId: string | undefined): FormTemplate | null {
  const schema = useStore()
  return useMemo(
    () => (templateId ? (schema.templates.find((t) => t.id === templateId) ?? null) : null),
    [schema, templateId],
  )
}

export function useInstancesForTemplate(templateId: string): FormInstance[] {
  const schema = useStore()
  return useMemo(
    () =>
      schema.instances
        .filter((i) => i.templateId === templateId)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [schema, templateId],
  )
}

export function useInstance(instanceId: string | undefined): FormInstance | null {
  const schema = useStore()
  return useMemo(
    () => (instanceId ? (schema.instances.find((i) => i.id === instanceId) ?? null) : null),
    [schema, instanceId],
  )
}

/** Submission counts keyed by template id, for the template cards. */
export function useInstanceCounts(): Map<string, number> {
  const schema = useStore()
  return useMemo(() => {
    const counts = new Map<string, number>()
    for (const instance of schema.instances) {
      counts.set(instance.templateId, (counts.get(instance.templateId) ?? 0) + 1)
    }
    return counts
  }, [schema])
}
