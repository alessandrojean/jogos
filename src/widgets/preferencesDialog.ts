import Adw from 'gi://Adw'
import Gio from 'gi://Gio'
import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk?version=4.0'
import { Application } from '../application.js'
import { currencies, Currency } from '../model/currency.js'

export default class PreferencesDialogWidget extends Adw.PreferencesDialog {
  private _preferredCurrency!: Adw.ComboRow

  static {
    GObject.registerClass({
      GTypeName: 'PreferencesDialogWidget',
      Template: 'resource:///org/jogos/Jogos/ui/preferences-dialog.ui',
      InternalChildren: ['preferredCurrency']
    }, this)
  }

  constructor(params: Partial<PreferencesDialogWidget> = {}) {
    super(params)

    this.initPreferredCurrency()
    this.fillPreferences()
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

  private fillPreferences() {
    const preferredCurrency = Application.settings.preferredCurrency
    this._preferredCurrency.selected = currencies.indexOf(preferredCurrency)
  }

}
