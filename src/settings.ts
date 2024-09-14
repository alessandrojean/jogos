import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'
import { Currency, getCurrency } from './model/currency.js'

type PreferenceKey = 'window-size' | 'window-position' | 'window-maximized'
  | 'last-sidebar-item' | 'show-grid' | 'preferred-currency'

export class Settings extends Gio.Settings {
  private keyTypes: Record<string, string>

  static {
    GObject.registerClass(this)
  }

  constructor(params: Partial<Gio.Settings.ConstructorProps> = {}) {
    super(params)

    this.keyTypes = {}
    this.list_keys().forEach(key => {
      this.keyTypes[key] = this.get_value(key).get_type().dup_string()
    })
  }

  get<T>(key: PreferenceKey): T {
    return this.get_value(key).deepUnpack() as T
  }

  setValue<T>(key: PreferenceKey, value: T) {
    this.set_value(key, GLib.Variant.new(this.keyTypes[key], value))
  }

  get preferredCurrency(): Currency {
    return getCurrency(this.get('preferred-currency')) ?? getCurrency('USD')!
  }

  set preferredCurrency(value: Currency) {
    this.setValue('preferred-currency', value.iso)
  }
}
