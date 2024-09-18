import Adw from 'gi://Adw'
import Gio from 'gi://Gio'
import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk?version=4.0'
import { Application } from '../application.js'
import { IgdbApi } from '../igdb/api.js'
import { currencies, Currency } from '../model/currency.js'
import { Settings } from '../settings.js'

export default class PreferencesDialogWidget extends Adw.PreferencesDialog {
  private _followSystemLocale!: Gtk.Switch
  private _dateFormat!: Adw.ComboRow
  private _preferredCurrency!: Adw.ComboRow
  private _clock12!: Gtk.ToggleButton
  private _clock24!: Gtk.ToggleButton

  private _enableIgdbIntegration!: Gtk.Switch
  private _igdbClientId!: Adw.EntryRow
  private _igdbClientSecret!: Adw.EntryRow

  private settings!: Settings
  private igdb!: IgdbApi

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
        'followSystemLocale', 'preferredCurrency', 'dateFormat', 'clock24', 'clock12',
        'igdbClientId', 'igdbClientSecret', 'enableIgdbIntegration'
      ]
    }, this)
  }

  constructor(params: Partial<PreferencesDialogWidget> = {}) {
    super(params)

    this.settings = Application.settings
    this.igdb = Application.igdb

    this.initPreferredCurrency()
    this.initDateFormat()
    this.bindSettings()
    this.fillPreferences()
    this.setupIgdbIntegration()
  }

  private initDateFormat() {
    this._dateFormat.model = new Gtk.StringList({ strings: this.dateFormats })

    this._dateFormat.connect('notify::selected', () => {
      this.settings.dateFormat = this.dateFormats[this._dateFormat.selected]
    })
  }

  private initPreferredCurrency() {
    const currencyModel = new Gio.ListStore({ itemType: Currency.$gtype })
    currencyModel.splice(0, 0, currencies)

    this._preferredCurrency.model = currencyModel
    this._preferredCurrency.expression = Gtk.PropertyExpression.new(Currency.$gtype, null, 'iso')

    this._preferredCurrency.connect('notify::selected-item', () => {
      this.settings.preferredCurrency = this._preferredCurrency.selectedItem as Currency
    })
  }

  private bindSettings() {
    this.settings.bind('use-system-locale', this._followSystemLocale, 'active', Gio.SettingsBindFlags.DEFAULT)
    this.settings.bind('use-24-hour-clock', this._clock24, 'active', Gio.SettingsBindFlags.DEFAULT)
    this.settings.bind('use-24-hour-clock', this._clock12, 'active', Gio.SettingsBindFlags.INVERT_BOOLEAN)
    this.settings.bind('igdb-active', this._enableIgdbIntegration, 'active', Gio.SettingsBindFlags.DEFAULT)
  }

  private fillPreferences() {
    this._dateFormat.selected = this.dateFormats.indexOf(this.settings.dateFormat)
    this._igdbClientId.text = this.settings.igdbClientId ?? ''
    this._igdbClientSecret.text = this.settings.igdbClientSecret ?? ''


    const currency = this.settings.preferredCurrency
    this._preferredCurrency.selected = currencies.indexOf(currency)
  }

  private setupIgdbIntegration() {
    this._igdbClientId.connect('apply', () => this.handleIgdbChanges())
    this._igdbClientSecret.connect('apply', () => this.handleIgdbChanges())
  }

  private async handleIgdbChanges() {
    this.settings.igdbClientId = this._igdbClientId.text
    this.settings.igdbClientSecret = this._igdbClientSecret.text

    if (!this.settings.igdbClientId || !this.settings.igdbClientSecret) {
      this.settings.igdbAccessToken = null
      this.settings.igdbAccessTokenExpiration = 0

      return
    }

    await this.igdb.authenticate()
  }

}
