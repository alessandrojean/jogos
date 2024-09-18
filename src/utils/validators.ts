import Adw from 'gi://Adw'
import Gtk from 'gi://Gtk?version=4.0'

export const optional = (validator: ValidatorFn) => (text: string) => text.length === 0 || validator(text)
export const integer = (text: string) => /^\d+$/.test(text)
export const real = (text: string) => /^\d+([\,\.]\d+)?$/.test(text)
export const required = (text: string) => text.length > 0
export const max = (max: number) => (text: string) => text.length <= max

type ValidatorFn = (text: string) => boolean
type ValidatorsObj = Record<string, ValidatorFn>
type ValidatorOptions<Key extends string> = Record<Key, ValidatorsObj>

export type Validator<Key extends string> = Record<Key, Field>
export type WidgetMap<Key extends string> = Record<Key, Gtk.Editable>

interface Field {
  dirty: boolean
  error: boolean
  validators: ValidatorFn[]
}

export function createValidator<Key extends string>(options: ValidatorOptions<Key>): Validator<Key> {
  const validatorEntries = Object.entries<ValidatorsObj>(options).map(([key, value]) => [
    key,
    { dirty: false, error: false, validators: Object.values(value) } satisfies Field
  ] as [Key, Field])

  return Object.fromEntries(validatorEntries) as Validator<Key>
}

export function validate<Key extends string>(validator: Validator<Key>, widgetMap: WidgetMap<Key>) {
  touch(validator, widgetMap)

  return Object.values<Field>(validator).every(field => !field.error)
}

export function touch<Key extends string>(validator: Validator<Key>, widgetMap: WidgetMap<Key>) {
  const fields = Object.entries(validator) as [Key, Field][]

  for (const [key, field] of fields) {
    const editable = widgetMap[key]

    field.dirty = true
    field.error = field.validators.some(fn => !fn(editable.text))

    editable.remove_css_class('error')

    if (field.error) {
      editable.add_css_class('error')
    }
  }
}

export function clear<Key extends string>(validator: Validator<Key>, widgetMap: WidgetMap<Key>) {
  const fields = Object.entries(validator) as [Key, Field][]

  for (const [key, field] of fields) {
    const editable = widgetMap[key]

    field.dirty = false
    field.error = field.validators.some(fn => !fn(editable.text))

    editable.remove_css_class('error')
  }
}

export function setupEntryRow<Key extends string>(validator: Validator<Key>, entryRow: Adw.EntryRow, item: Key) {
  validator[item].error = entryRow.textLength === 0

  // Adwaita doesn't properly expose the has-focus from the inner entry.
  const box = entryRow.child as Gtk.Box
  const editableArea = box.get_first_child()?.get_next_sibling()
  const entry = editableArea?.get_first_child()?.get_next_sibling()?.get_next_sibling() as Gtk.Entry

  entry.connect('notify::has-focus', () => {
    if (entry.hasFocus) {
      return
    }

    const field = validator[item]

    field.dirty = true
    field.error = field.validators.some(fn => !fn(entryRow.text))
    entryRow.remove_css_class('error')

    if (field.error) {
      entryRow.add_css_class('error')
    }
  })

  entryRow.connect('notify::text-length', () => {
    const field = validator[item]

    field.error = field.validators.some(fn => !fn(entryRow.text))
    entryRow.remove_css_class('error')

    if (field.error) {
      entryRow.add_css_class('error')
    }
  })
}
