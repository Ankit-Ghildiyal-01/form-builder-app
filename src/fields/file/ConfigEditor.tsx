import { useEffect, useRef, useState } from 'react'
import { FormRow, NumberInput, TextInput } from '../../components/ui/Controls'
import type { ConfigEditorProps } from '../types'
import type { FileFieldConfig } from '../../types'

/**
 * Splits the typed list into normalised extensions: `.PDF, jpg` → `['.pdf', '.jpg']`.
 * The model stores extensions, the user types prose. This is the one place the
 * two representations meet.
 */
function parseTypes(text: string): string[] {
  return text
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part !== '')
    .map((part) => (part.startsWith('.') ? part : `.${part}`))
}

function sameTypes(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((entry, index) => entry === b[index])
}

export function FileConfigEditor({ field, onChange }: ConfigEditorProps<FileFieldConfig>) {
  function set<K extends keyof FileFieldConfig>(key: K, value: FileFieldConfig[K]) {
    onChange({ ...field, [key]: value })
  }

  /*
    The allowed-types control is the classic controlled-tag-input trap: deriving
    the input's value from `parseTypes(field.allowedTypes).join(', ')` would
    rewrite `pdf,` as `.pdf` on the keystroke that produced it and eat the comma
    the user just typed. So the raw text lives here, the parsed array is only
    ever propagated outward, and the text is re-synced from props only when the
    stored array genuinely differs from what this editor last emitted, which is
    what an external change (template load, undo, conditional reset) looks like.
  */
  const [typesText, setTypesText] = useState(() => field.allowedTypes.join(', '))
  const lastEmitted = useRef<string[] | null>(null)

  useEffect(() => {
    if (lastEmitted.current === null || !sameTypes(field.allowedTypes, lastEmitted.current)) {
      lastEmitted.current = field.allowedTypes
      setTypesText(field.allowedTypes.join(', '))
    }
  }, [field.allowedTypes])

  function handleTypesChange(text: string) {
    setTypesText(text)
    const parsed = parseTypes(text)
    lastEmitted.current = parsed
    set('allowedTypes', parsed)
  }

  return (
    <>
      <FormRow
        label="Allowed file types"
        hint="Comma-separated extensions, e.g. .pdf, .jpg, .png. Leave blank to accept any file."
      >
        <TextInput
          value={typesText}
          placeholder=".pdf, .jpg, .png"
          onChange={(event) => handleTypesChange(event.target.value)}
        />
      </FormRow>

      <FormRow label="Max number of files" hint="Leave blank for no limit.">
        <NumberInput
          value={field.maxFiles}
          integer
          min={1}
          placeholder="Unlimited"
          onChange={(value) => set('maxFiles', value)}
        />
      </FormRow>
    </>
  )
}
