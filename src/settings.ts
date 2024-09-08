import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'

export class Settings extends Gio.Settings {
  private keyTypes: Record<string, string>

  static {
    GObject.registerClass(this)
  }

  constructor(params: Partial<Gio.Settings.ConstructorProperties> = {}) {
    super(params)

    this.keyTypes = {}
    this.list_keys().forEach(key => {
      this.keyTypes[key] = this.get_value(key).get_type().dup_string()
    })
  }

  get<T>(name: string): T {
    return this.get_value(name).deepUnpack() as T
  }

  setValue<T>(name: string, value: T) {
    this.set_value(name, GLib.Variant.new(this.keyTypes[name], value))
  }
}
