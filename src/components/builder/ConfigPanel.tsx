import type { ReactNode } from 'react'
import { IconButton } from '../ui/Button'
import { FormRow, Segmented, TextInput } from '../ui/Controls'
import { Icon } from '../ui/Icon'
import { Toggle } from '../ui/Toggle'
import { getDefinition } from '../../fields/registry'
import { FIELD_LABEL_MAX_LENGTH } from '../../lib/constants'
import type { FieldConfig } from '../../types'
import { ConditionsEditor } from './ConditionsEditor'
import './ConfigPanel.css'

interface ConfigPanelProps {
  field: FieldConfig | null
  siblings: FieldConfig[]
  onChange: (field: FieldConfig) => void
  onDuplicate: (fieldId: string) => void
  onDelete: (fieldId: string) => void
}

const VISIBILITY_OPTIONS = [
  { value: 'visible', label: 'Visible' },
  { value: 'hidden', label: 'Hidden' },
] as const

/**
 * Configuration for the selected field.
 *
 * It owns the controls every field type has (label, required, default
 * visibility, conditional logic) and delegates the rest to the field's own
 * `ConfigEditor`. That split keeps modules small and the common controls
 * identical across all nine types: a module only describes what makes it
 * different, and cannot ship a label input that behaves differently.
 */
export function ConfigPanel({
  field,
  siblings,
  onChange,
  onDuplicate,
  onDelete,
}: ConfigPanelProps) {
  if (!field) {
    return (
      <div className="config-panel config-panel--empty">
        <div className="config-panel__placeholder">
          <Icon name="sliders" size={20} />
          <p className="config-panel__placeholder-title">No field selected</p>
          <p className="config-panel__placeholder-text">
            Select a field on the canvas to configure its label, validation and conditional
            logic.
          </p>
        </div>
      </div>
    )
  }

  const definition = getDefinition(field.type)
  const ConfigEditor = definition.ConfigEditor
  const labelMissing = field.label.trim() === ''
  // A show rule takes visibility over once it has an answer, which is the one
  // thing the toggle's hint has to say beyond the usual.
  const hasShowRule = field.conditions.some((condition) => condition.effect === 'show')

  function setLabel(label: string) {
    if (field) onChange({ ...field, label })
  }

  return (
    <div className="config-panel">
      <header className="config-panel__header">
        <span className="config-panel__type-icon" aria-hidden="true">
          <Icon name={definition.icon} size={16} />
        </span>
        <span className="config-panel__type-name">{definition.name}</span>
        <span className="config-panel__header-actions">
          <IconButton
            icon="copy"
            label="Duplicate field"
            size="sm"
            onClick={() => onDuplicate(field.id)}
          />
          <IconButton
            icon="trash"
            label="Delete field"
            size="sm"
            variant="danger"
            onClick={() => onDelete(field.id)}
          />
        </span>
      </header>

      <Group title="Field">
        <FormRow
          label="Label"
          htmlFor={`config-label-${field.id}`}
          error={labelMissing ? 'A label is required for this field to be usable.' : null}
          hint={
            definition.ownsLabel
              ? 'Rendered as this section’s heading.'
              : 'Shown above the field when filling in the form.'
          }
        >
          <TextInput
            id={`config-label-${field.id}`}
            value={field.label}
            placeholder="Field label"
            maxLength={FIELD_LABEL_MAX_LENGTH}
            onChange={(event) => setLabel(event.target.value)}
          />
        </FormRow>

        {/* The field type's own options, and nothing else. */}
        <ConfigEditor field={field} siblings={siblings} onChange={onChange} />
      </Group>

      <Group title="Behaviour">
        {definition.supportsRequired && (
          <Toggle
            checked={field.defaultRequired}
            label="Required"
            hint="Validated on submit, unless a condition below overrides it."
            onChange={(checked) => onChange({ ...field, defaultRequired: checked })}
          />
        )}

        {definition.capturesValue && (
          <FormRow
            label="Shown by default"
            hint={
              hasShowRule
                ? 'Applies while the field a rule watches is still empty. Once it has an answer, the "Show this field" rule below decides.'
                : 'Used when no condition matches, or the field it watches is empty.'
            }
          >
            <Segmented
              label="Default visibility"
              options={VISIBILITY_OPTIONS}
              value={field.defaultVisible ? 'visible' : 'hidden'}
              onChange={(next) => onChange({ ...field, defaultVisible: next === 'visible' })}
            />
          </FormRow>
        )}

        <p className="config-panel__aside">
          <Icon name="lock" size={14} />
          <span>
            A hidden field is never validated and its value is never saved or exported, even if
            it is marked required.
          </span>
        </p>
      </Group>

      <Group title="Conditional logic">
        <ConditionsEditor
          field={field}
          siblings={siblings}
          onChange={(conditions) => onChange({ ...field, conditions })}
        />
      </Group>
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="config-group">
      <h3 className="config-group__title">{title}</h3>
      <div className="config-group__body">{children}</div>
    </section>
  )
}
