import { Button, IconButton } from '../ui/Button'
import { NumberInput, Select, TextInput } from '../ui/Controls'
import { Icon } from '../ui/Icon'
import {
  OPERATOR_LABELS,
  canBeConditionTarget,
  emptyValueForKind,
  operatorsFor,
  resolveValueKind,
} from '../../lib/conditions'
import { createId } from '../../lib/id'
import type {
  Condition,
  ConditionEffect,
  ConditionOperator,
  ConditionValue,
  FieldConfig,
  SelectOption,
} from '../../types'
import './ConditionsEditor.css'

const EFFECT_OPTIONS: ReadonlyArray<{ value: ConditionEffect; label: string }> = [
  { value: 'show', label: 'Show this field' },
  { value: 'hide', label: 'Hide this field' },
  { value: 'require', label: 'Mark as required' },
  { value: 'unrequire', label: 'Mark as not required' },
]

interface ConditionsEditorProps {
  field: FieldConfig
  siblings: FieldConfig[]
  onChange: (conditions: Condition[]) => void
}

/**
 * The rules controlling this field's visibility and required state.
 *
 * Three details matter. The target picker excludes this field (nothing may
 * condition on itself) and any type with no defined operators. Changing the
 * target or operator **recomputes the operand shape**, because `equals` means
 * "one of these options" for a select but "free text" for a text input,
 * a stale operand would compare the wrong things. And a condition whose target
 * was deleted is surfaced rather than hidden: it evaluates as inert, so leaving
 * it silent would look like a bug.
 */
export function ConditionsEditor({ field, siblings, onChange }: ConditionsEditorProps) {
  const byId = new Map(siblings.map((sibling) => [sibling.id, sibling]))

  const candidates = siblings.filter(
    (sibling) => sibling.id !== field.id && canBeConditionTarget(sibling),
  )

  function update(id: string, patch: Partial<Condition>) {
    onChange(field.conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  function remove(id: string) {
    onChange(field.conditions.filter((c) => c.id !== id))
  }

  function addCondition() {
    const target = candidates[0]
    if (!target) return

    const allowed = operatorsFor(target.type)
    const operator = allowed[0]
    if (!operator) return

    onChange([
      ...field.conditions,
      {
        id: createId(),
        targetFieldId: target.id,
        operator,
        value: emptyValueForKind(resolveValueKind(target.type, operator)),
        effect: 'show',
      },
    ])
  }

  function changeTarget(condition: Condition, targetFieldId: string) {
    const target = byId.get(targetFieldId)
    if (!target) return

    const allowed = operatorsFor(target.type)
    const operator = allowed.includes(condition.operator) ? condition.operator : allowed[0]
    if (!operator) return
    update(condition.id, { ...retarget(condition.value, target.type, operator), targetFieldId })
  }

  function changeOperator(condition: Condition, target: FieldConfig, operator: ConditionOperator) {
    update(condition.id, { ...retarget(condition.value, target.type, operator), operator })
  }

  /** Keeps the operand only when the new operator expects the same shape. */
  function retarget(
    value: ConditionValue,
    targetType: FieldConfig['type'],
    operator: ConditionOperator,
  ): Pick<Condition, 'value'> {
    const kind = resolveValueKind(targetType, operator)
    return { value: value.kind === kind ? value : emptyValueForKind(kind) }
  }

  if (candidates.length === 0) {
    return (
      <p className="conditions__empty">
        Add another field first. Conditional logic compares this field against the value of a
        different field in the form.
      </p>
    )
  }

  return (
    <div className="conditions">
      {field.conditions.map((condition, index) => {
        const target = byId.get(condition.targetFieldId)
        const operatorOptions = target ? operatorsFor(target.type) : []

        return (
          <div className="condition" key={condition.id}>
            <div className="condition__head">
              <span className="condition__index">Rule {index + 1}</span>
              <IconButton
                icon="trash"
                label={`Remove rule ${index + 1}`}
                size="sm"
                variant="danger"
                onClick={() => remove(condition.id)}
              />
            </div>

            {!target ? (
              <p className="condition__missing">
                <Icon name="alert" size={14} />
                <span>
                  The field this rule watched has been deleted, so the rule no longer does
                  anything. Remove it or pick a new field.
                </span>
              </p>
            ) : (
              <>
                <div className="condition__line">
                  <span className="condition__step">If</span>
                  <Select
                    aria-label={`Rule ${index + 1} target field`}
                    value={condition.targetFieldId}
                    onChange={(event) => changeTarget(condition, event.target.value)}
                  >
                    {candidates.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.label || 'Untitled field'}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="condition__line">
                  <span className="condition__step" />
                  <Select
                    aria-label={`Rule ${index + 1} operator`}
                    value={condition.operator}
                    onChange={(event) =>
                      changeOperator(condition, target, event.target.value as ConditionOperator)
                    }
                  >
                    {operatorOptions.map((operator) => (
                      <option key={operator} value={operator}>
                        {OPERATOR_LABELS[operator]}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="condition__line">
                  <span className="condition__step" />
                  <div className="condition__value">
                    <ConditionValueEditor
                      value={condition.value}
                      target={target}
                      label={`Rule ${index + 1} comparison value`}
                      onChange={(value) => update(condition.id, { value })}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="condition__line">
              <span className="condition__step">Then</span>
              <Select
                aria-label={`Rule ${index + 1} effect`}
                value={condition.effect}
                onChange={(event) =>
                  update(condition.id, { effect: event.target.value as ConditionEffect })
                }
              >
                {EFFECT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )
      })}

      <Button size="sm" icon="plus" onClick={addCondition}>
        Add condition
      </Button>

      <p className="conditions__note">
        Rules combine as follows: a matching <strong>hide</strong> beats a matching{' '}
        <strong>show</strong>, and a matching <strong>not required</strong> beats a matching{' '}
        <strong>required</strong>. While the field a rule watches is empty there is nothing to
        compare, so the defaults above apply. Once it has an answer, a{' '}
        <strong>show</strong> rule takes over and the field is shown only while that rule matches.
        A hidden field is never validated and its value is never saved.
      </p>
    </div>
  )
}

interface ConditionValueEditorProps {
  value: ConditionValue
  target: FieldConfig
  label: string
  onChange: (value: ConditionValue) => void
}

/** Renders the operand control that matches the operator's expected shape. */
function ConditionValueEditor({ value, target, label, onChange }: ConditionValueEditorProps) {
  switch (value.kind) {
    case 'text':
      return (
        <TextInput
          aria-label={label}
          value={value.text}
          placeholder="Value"
          onChange={(event) => onChange({ kind: 'text', text: event.target.value })}
        />
      )

    case 'number':
      return (
        <NumberInput
          value={value.value}
          placeholder="Value"
          onChange={(number) => onChange({ kind: 'number', value: number })}
        />
      )

    case 'range':
      return (
        <div className="condition__range">
          <NumberInput
            value={value.min}
            placeholder="Min"
            onChange={(min) => onChange({ ...value, min })}
          />
          <NumberInput
            value={value.max}
            placeholder="Max"
            onChange={(max) => onChange({ ...value, max })}
          />
        </div>
      )

    case 'date':
      return (
        <TextInput
          type="date"
          aria-label={label}
          value={value.date}
          onChange={(event) => onChange({ kind: 'date', date: event.target.value })}
        />
      )

    case 'selection': {
      const options: SelectOption[] = 'options' in target ? target.options : []
      if (options.length === 0) {
        return <p className="condition__hint">This field has no options to compare against.</p>
      }

      // Select targets carry a single id; multi-select targets carry a set.
      if (target.type === 'select') {
        return (
          <Select
            aria-label={label}
            value={value.optionIds[0] ?? ''}
            onChange={(event) =>
              onChange({
                kind: 'selection',
                optionIds: event.target.value === '' ? [] : [event.target.value],
              })
            }
          >
            <option value="">Choose an option…</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
        )
      }

      return (
        <div className="condition__options">
          {options.map((option) => {
            const checked = value.optionIds.includes(option.id)
            return (
              <label className="condition__option" key={option.id}>
                <input
                  type="checkbox"
                  className="field-option__control"
                  checked={checked}
                  onChange={() =>
                    onChange({
                      kind: 'selection',
                      optionIds: checked
                        ? value.optionIds.filter((id) => id !== option.id)
                        : [...value.optionIds, option.id],
                    })
                  }
                />
                <span className="field-option__label">{option.label}</span>
              </label>
            )
          })}
        </div>
      )
    }
  }
}
