import Adw from 'gi://Adw'
import Gio from 'gi://Gio'
import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk?version=4.0'
import { Application } from '../application.js'
import { currencies, Currency } from '../model/currency.js'

export default class PreferencesDialogWidget extends Adw.PreferencesDialog {
  private _followSystemLocale!: Gtk.Switch
  private _dateFormat!: Adw.ComboRow
  private _preferredCurrency!: Adw.ComboRow
  private _clock12!: Gtk.ToggleButton
  private _clock24!: Gtk.ToggleButton

  private dateFormats = [
    'dd/mm/yyyy',
    'mm/dd/yyyy',
    'dd/mm/yy',
    'mm/dd/yy',
  ]

  static {
    GObject.registerClass({
      GTypeName: 'PreferencesDialogWidget',
      Template: 'resource:///io/github/alessandrojean/jogos/ui/preferences-dialog.ui',
      InternalChildren: [
        'followSystemLocale', 'preferredCurrency', 'dateFormat', 'clock24', 'clock12'
      ]
    }, this)
  }

  constructor(params: Partial<PreferencesDialogWidget> = {}) {
    super(params)

    this.initFollowSystemLocale()
    this.initPreferredCurrency()
    this.initDateFormat()
    this.initHourFormat()
    this.fillPreferences()
  }

  private initFollowSystemLocale() {
    this._followSystemLocale.connect('notify::active', () => {
      Application.settings.useSystemLocale = this._followSystemLocale.active
    })
  }

  private initDateFormat() {
    this._dateFormat.model = new Gtk.StringList({ strings: this.dateFormats })

    this._dateFormat.connect('notify::selected', () => {
      Application.settings.dateFormat = this.dateFormats[this._dateFormat.selected]
    })
  }

  private initHourFormat() {
    this._clock24.connect('toggled', () => {
      Application.settings.use24HourClock = this._clock24.active
    })
  }

  private initPreferredCurrency() {
    const currencyModel = new Gio.ListStore({ itemType: Currency.$gtype })
    currencyModel.splice(0, 0, currencies)

    this._preferredCurrency.model = currencyModel
    this._preferredCurrency.expression = Gtk.PropertyExpression.new(Currency.$gtype, null, 'iso')

    this._preferredCurrency.connect('notify::selected-item', () => {
      Application.settings.preferredCurrency = this._preferredCurrency.selectedItem as Currency
    })
  }

  private async fillPreferences() {
    this._followSystemLocale.active = Application.settings.useSystemLocale
    this._dateFormat.selected = this.dateFormats.indexOf(Application.settings.dateFormat)
    this._clock24.active = Application.settings.use24HourClock
    this._clock12.active = !this._clock24.active

    const currency = Application.settings.preferredCurrency
    this._preferredCurrency.selected = currencies.indexOf(currency)
  }

}
