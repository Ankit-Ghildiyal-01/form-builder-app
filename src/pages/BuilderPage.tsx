import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { MissingRecord } from '../components/layout/MissingRecord'
import { BuilderCanvas } from '../components/builder/BuilderCanvas'
import { ConfigPanel } from '../components/builder/ConfigPanel'
import { FieldPalette } from '../components/builder/FieldPalette'
import { PreviewModal } from '../components/builder/PreviewModal'
import type { DragPayload } from '../components/builder/types'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { createField } from '../fields/registry'
import { pluralize } from '../lib/format'
import { createId } from '../lib/id'
import { createTemplate, saveTemplate, useTemplate } from '../lib/store'
import { pruneCalculationSources } from '../lib/values'
import { DRAFT_TEMPLATE_ID, paths } from '../routes'
import { FORM_DESCRIPTION_MAX_LENGTH, FORM_TITLE_MAX_LENGTH } from '../lib/constants'
import type { FieldConfig, FieldId, FieldType, FormTemplate } from '../types'
import './BuilderPage.css'

interface BuilderPageProps {
  templateId: string
}

/** Why Save would refuse, or `null` when it will go through. */
function saveBlockerFor(titleMissing: boolean, unlabelledCount: number): string | null {
  if (titleMissing && unlabelledCount > 0) {
    return `Add a form title and label ${pluralize(unlabelledCount, 'field')}`
  }
  if (titleMissing) return 'Add a form title'
  if (unlabelledCount > 0) {
    return `${pluralize(unlabelledCount, 'field')} ${unlabelledCount === 1 ? 'needs' : 'need'} a label`
  }
  return null
}

/**
 * Builder Mode: the palette, the canvas and the configuration panel.
 *
 * The builder edits a *draft*, a `FormTemplate` in component state, and writes
 * it to storage only on Save. Everything downstream reads that one object, so
 * there is a single source of truth for what the form currently is; that is also
 * why a new form is never written on arrival, and abandoning one leaves nothing
 * behind. `App` keys this component by template id, so switching templates (or
 * saving a new one and landing on its real id) starts from a clean draft rather
 * than reconciling two forms inside one state object.
 */
export function BuilderPage({ templateId }: BuilderPageProps) {
  const navigate = useNavigate()
  const isNew = templateId === DRAFT_TEMPLATE_ID
  // Read once and then owned locally: subscribing to the store for the draft
  // itself would fight the user for control of the inputs on every keystroke.
  const stored = useTemplate(isNew ? undefined : templateId)

  const [draft, setDraft] = useState<FormTemplate>(() => {
    const seed = stored ?? createTemplate()
    // Repairs a form saved before deletes pruned calculation sources, so simply
    // opening it makes every total count the fields it says it counts.
    return { ...seed, fields: pruneCalculationSources(seed.fields) }
  })
  const [dirty, setDirty] = useState(false)
  const [selectedId, setSelectedId] = useState<FieldId | null>(null)
  const [drag, setDrag] = useState<DragPayload | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<FieldId | null>(null)

  // Closing the tab with unsaved work would lose it silently, and with no server
  // there is no copy anywhere else. Only armed once there is something to lose.
  useEffect(() => {
    if (!dirty) return

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [dirty])

  const selectedField = useMemo(
    () => draft.fields.find((field) => field.id === selectedId) ?? null,
    [draft.fields, selectedId],
  )

  const dependents = useMemo(
    () =>
      pendingDeleteId === null
        ? []
        : draft.fields.filter((field) =>
            field.conditions.some((condition) => condition.targetFieldId === pendingDeleteId),
          ),
    [draft.fields, pendingDeleteId],
  )

  if (!isNew && !stored) {
    return (
      <AppShell back={{ label: 'Templates', to: paths.templates }} title="Builder">
        <div className="builder-missing">
          <MissingRecord subject="form" />
        </div>
      </AppShell>
    )
  }

  /* ---- Draft mutations -------------------------------------------------- */

  function update(next: FormTemplate) {
    setDraft(next)
    setDirty(true)
  }

  function updateFields(fields: FieldConfig[]) {
    update({ ...draft, fields })
  }

  function addField(type: FieldType, index?: number) {
    const field = createField(type, createId())
    const fields = [...draft.fields]
    fields.splice(index ?? fields.length, 0, field)
    updateFields(fields)
    // Select what was just added: the next thing a builder does is label it.
    setSelectedId(field.id)
  }

  function updateField(field: FieldConfig) {
    updateFields(draft.fields.map((current) => (current.id === field.id ? field : current)))
  }

  function moveField(from: number, to: number) {
    const fields = [...draft.fields]
    const moved = fields[from]
    if (!moved || to < 0 || to >= fields.length) return

    fields.splice(from, 1)
    fields.splice(to, 0, moved)
    updateFields(fields)
  }

  function duplicateField(fieldId: FieldId) {
    const index = draft.fields.findIndex((field) => field.id === fieldId)
    const source = draft.fields[index]
    if (!source) return

    const clone: FieldConfig = {
      ...source,
      id: createId(),
      label: `${source.label} (copy)`,
    }

    const fields = [...draft.fields]
    fields.splice(index + 1, 0, clone)
    updateFields(fields)
    setSelectedId(clone.id)
  }

  /**
   * Removing a field would strand any condition pointing at it, leaving a rule
   * that can never match, so deleting one others depend on asks first.
   */
  function requestDelete(fieldId: FieldId) {
    const isTarget = draft.fields.some((field) =>
      field.conditions.some((condition) => condition.targetFieldId === fieldId),
    )

    if (isTarget) {
      setPendingDeleteId(fieldId)
      return
    }

    deleteField(fieldId)
  }

  function deleteField(fieldId: FieldId) {
    // Both kinds of reference go: a condition pointing at the field, and the
    // field's id in any calculation that sourced it. Leaving either behind
    // means a rule or a total that silently does nothing.
    const fields = pruneCalculationSources(
      draft.fields
        .filter((field) => field.id !== fieldId)
        .map((field): FieldConfig => {
          if (!field.conditions.some((condition) => condition.targetFieldId === fieldId)) {
            return field
          }
          return {
            ...field,
            conditions: field.conditions.filter(
              (condition) => condition.targetFieldId !== fieldId,
            ),
          }
        }),
    )

    updateFields(fields)
    if (selectedId === fieldId) setSelectedId(null)
    setPendingDeleteId(null)
  }

  const hasChanges = dirty || isNew
  const titleMissing = draft.title.trim() === ''
  const unlabelledFields = draft.fields.filter((field) => field.label.trim() === '')
  const canSave = !titleMissing && unlabelledFields.length === 0

  /**
   * A form with no title, or with a field nobody can identify, is not usable:
   * its card has a blank heading and its PDF rows read "Untitled field".
   */
  function handleSave() {
    if (!canSave) {
      const first = unlabelledFields[0] ?? null
      setSelectedId(first?.id ?? null)

      if (first) {
        // Reveal the field the config panel is about to show an error for, and
        // put the cursor in the input that error is attached to.
        document
          .getElementById(`canvas-row-${first.id}`)
          ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        document.getElementById(`config-label-${first.id}`)?.focus()
      }
      return
    }

    saveTemplate(draft)

    // Saving ends the editing session, so land back on the grid rather than
    // staying in the builder. The form just saved is the first card there, since
    // the grid is ordered by save time.
    navigate(paths.templates)
  }

  const saveBlocker = saveBlockerFor(titleMissing, unlabelledFields.length)

  return (
    <AppShell
      flush
      back={{ label: 'Templates', to: paths.templates }}
      title={draft.title.trim() === '' ? 'Untitled form' : draft.title}
      subtitle={
        <span
          className={`builder__status${
            saveBlocker ? ' builder__status--blocked' : hasChanges ? ' builder__status--dirty' : ''
          }`}
        >
          <span className="builder__status-dot" aria-hidden="true" />
          {saveBlocker ?? (hasChanges ? 'Unsaved changes' : 'All changes saved')}
        </span>
      }
      actions={
        <>
          <Button icon="play" onClick={() => setPreviewOpen(true)}>
            Preview
          </Button>
          <Button variant="primary" icon="save" disabled={!hasChanges} onClick={handleSave}>
            Save
          </Button>
        </>
      }
    >
      <div className="builder">
        <aside className="builder__palette" aria-label="Field types">
          <FieldPalette
            onAdd={(type) => addField(type)}
            onDragStart={setDrag}
            onDragEnd={() => setDrag(null)}
          />
        </aside>

        <section className="builder__canvas" aria-label="Form fields">
          <div className="builder__meta">
            <input
              className="builder__title-input"
              value={draft.title}
              placeholder="Untitled form"
              aria-label="Form title"
              maxLength={FORM_TITLE_MAX_LENGTH}
              onChange={(event) => update({ ...draft, title: event.target.value })}
            />
            <input
              className="builder__description-input"
              value={draft.description}
              placeholder="Add a description to explain what this form is for"
              aria-label="Form description"
              maxLength={FORM_DESCRIPTION_MAX_LENGTH}
              onChange={(event) => update({ ...draft, description: event.target.value })}
            />
            <p className="builder__meta-count">
              {pluralize(draft.fields.length, 'field')}
              {isNew && ' · not saved yet'}
            </p>
          </div>

          <BuilderCanvas
            template={draft}
            selectedId={selectedId}
            drag={drag}
            onSelect={setSelectedId}
            onAddAt={addField}
            onMove={moveField}
            onDuplicate={duplicateField}
            onDelete={requestDelete}
            onDragStateChange={setDrag}
          />
        </section>

        <aside className="builder__config" aria-label="Field configuration">
          <ConfigPanel
            field={selectedField}
            siblings={draft.fields}
            onChange={updateField}
            onDuplicate={duplicateField}
            onDelete={requestDelete}
          />
        </aside>
      </div>

      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={draft.title}
        fields={draft.fields}
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this field?"
        confirmLabel="Delete field"
        onClose={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId !== null) deleteField(pendingDeleteId)
        }}
      >
        <p className="confirm-copy">
          Other fields use this field in their conditional logic. Deleting it will also remove{' '}
          {pluralize(dependents.length, 'rule')} that {dependents.length === 1 ? 'points' : 'point'}{' '}
          at it, so nothing is left pointing at a field that no longer exists.
        </p>
        <ul className="confirm-list">
          {dependents.map((field) => (
            <li key={field.id}>{field.label || 'Untitled field'}</li>
          ))}
        </ul>
      </ConfirmDialog>
    </AppShell>
  )
}
