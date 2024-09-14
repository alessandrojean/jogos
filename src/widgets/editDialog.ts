import Adw from 'gi://Adw'
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk?version=4.0'

import { Certification, certifications, certificationSystemName, certificationSystems, getCertification } from '../model/certification.js'
import { currencies, Currency, getCurrency } from '../model/currency.js'
import Game from '../model/game.js'
import { GameCondition, gameConditions, getGameCondition } from '../model/gameCondition.js'
import { getPlatform, Platform, platforms } from '../model/platform.js'
import { getStorageMedia, StorageMedia, storageMedias } from '../model/storageMedia.js'
import GamesRepository from '../repositories/games.js'
import convertCover from '../utils/convertCover.js'
import { createValidator, integer, max, optional, real, required, setupEntryRow, touch, validate, WidgetMap } from '../utils/validators.js'

export class EditDialogWidget extends Adw.Dialog {
  private _cover!: Gtk.Picture
  private _title!: Adw.EntryRow
  private _barcode!: Adw.EntryRow
  private _developer!: Adw.EntryRow
  private _publisher!: Adw.EntryRow
  private _releaseYear!: Adw.SpinRow
  private _platform!: Adw.ComboRow
  private _story!: Gtk.TextView
  private _condition!: Adw.ComboRow
  private _storageMedia!: Adw.ComboRow
  private _boughtDateLabel!: Gtk.Label
  private _boughtDate!: Gtk.Calendar
  private _paidPriceLabel!: Gtk.Label
  private _amount!: Adw.EntryRow
  private _currency!: Adw.ComboRow
  private _store!: Adw.EntryRow
  private _certification!: Adw.ComboRow
  private _wishlist!: Adw.SwitchRow

  private _deleteRevealer!: Gtk.Revealer

  private window?: Gtk.Widget | null = null
  private coverFile: Gio.File | null = null

  private validator = createValidator({
    title: { required },
    developer: { required },
    publisher: { required },
    barcode: { number: optional(integer), max: max(13) },
    amount: { number: optional(real) }
  })

  private widgetMap!: WidgetMap<keyof EditDialogWidget['validator']>

  game!: Game

  static {
    GObject.registerClass({
      GTypeName: 'EditDialogWidget',
      Template: 'resource:///io/github/alessandrojean/jogos/ui/edit-dialog.ui',
      Properties: {
        game: GObject.ParamSpec.object(
          'game',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          Game.$gtype
        ),
      },
      InternalChildren: [
        'cover', 'title', 'barcode', 'developer', 'publisher', 'releaseYear',
        'platform', 'story', 'deleteRevealer', 'condition', 'storageMedia',
        'boughtDateLabel', 'boughtDate', 'paidPriceLabel', 'currency', 'amount',
        'story', 'store', 'certification', 'wishlist'
      ],
      Signals: {
        'game-updated': {
          param_types: [Game.$gtype]
        }
      }
    }, this)
  }

  constructor(game: Game, params: Partial<EditDialogWidget> = {}) {
    super(params)

    this.game = game

    this.initActions()
    this.initPlatforms()
    this.initConditions()
    this.initCertifications()
    this.initMedias()
    this.initCurrencies()
    this.initDates()
    this.initPaidPrice()
    this.fillData()
    this.initValidation()
  }

  private initActions() {
    const actionGroup = new Gio.SimpleActionGroup()
    this.insert_action_group('edit-dialog', actionGroup)

    const newCoverAction = new Gio.SimpleAction({ name: 'new-cover' })
    newCoverAction.connect('activate', () => this.onNewCoverAction())
    actionGroup.add_action(newCoverAction)

    const removeCoverAction = new Gio.SimpleAction({ name: 'remove-cover' })
    removeCoverAction.connect('activate', () => this.onRemoveCoverAction())
    actionGroup.add_action(removeCoverAction)

    const saveAction = new Gio.SimpleAction({ name: 'save' })
    saveAction.connect('activate', () => this.onSaveAction())
    actionGroup.add_action(saveAction)
  }

  private initPlatforms() {
    const platformModel = new Gio.ListStore({ itemType: Platform.$gtype })
    platformModel.splice(0, 0, platforms)

    this._platform.model = platformModel
    this._platform.expression = Gtk.PropertyExpression.new(Platform.$gtype, null, 'name')

    const factory = this._platform.factory as Gtk.SignalListItemFactory

    factory.connect('setup', (_source, item: Gtk.ListItem) => {
      const box = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 8
      })
      const icon = new Gtk.Image()
      const label = new Gtk.Label({ label: '' })

      box.append(icon)
      box.append(label)

      item.child = box
    })

    factory.connect('bind', (_source, item: Gtk.ListItem) => {
      const box = item.child as Gtk.Box
      const icon = box.get_first_child() as Gtk.Image
      const label = box.get_last_child() as Gtk.Label
      const platform = item.get_item<Platform>()

      icon.iconName = platform.iconName
      label.label = platform.name
    })
  }

  private initConditions() {
    const conditionModel = new Gio.ListStore({ itemType: GameCondition.$gtype })
    conditionModel.splice(0, 0, gameConditions)

    this._condition.model = conditionModel
    this._condition.expression = Gtk.PropertyExpression.new(GameCondition.$gtype, null, 'name')
  }

  private initCertifications() {
    const systemModel = new Gtk.StringList({ strings: certificationSystems })

    const map = Gtk.MapListModel.new(systemModel, (item: GObject.Object) => {
      const system = (item as Gtk.StringObject).string
      const certificationModel = new Gio.ListStore({ itemType: Certification.$gtype })
      certificationModel.splice(0, 0, certifications.filter(c => c.system === system))

      return certificationModel
    })

    const flatten = Gtk.FlattenListModel.new(map)

    this._certification.model = flatten
    this._certification.expression = Gtk.PropertyExpression.new(Certification.$gtype, null, 'name')

    const factory = this._certification.factory as Gtk.SignalListItemFactory

    factory.connect('setup', (_self, item: Gtk.ListItem) => {
      const box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8 })
      const image = new Gtk.Image({ valign: Gtk.Align.CENTER })
      const label = new Gtk.Label({ valign: Gtk.Align.CENTER })

      box.append(image)
      box.append(label)
      item.child = box
    })

    factory.connect('bind', (_self, item: Gtk.ListItem) => {
      const box = item.child as Gtk.Box
      const image = box.get_first_child() as Gtk.Image
      const label = box.get_last_child() as Gtk.Label
      const cert = item.get_item<Certification>()

      image.iconName = cert.iconName
      label.label = cert.name
    })

    const headerFactory = new Gtk.SignalListItemFactory()
    this._certification.headerFactory = headerFactory

    headerFactory.connect('setup', (_self, item: Gtk.ListHeader) => {
      item.child = new Gtk.Label({
        label: '',
        xalign: 0,
        cssClasses: ['dim-label'],
        marginStart: 16
      })
    })

    headerFactory.connect('bind', (_self, item: Gtk.ListHeader) => {
      const label = item.child as Gtk.Label
      const certification = item.get_item<Certification>()
      label.label = certificationSystemName(certification.system)
    })
  }

  private initMedias() {
    const mediaModel = new Gio.ListStore({ itemType: StorageMedia.$gtype })
    mediaModel.splice(0, 0, storageMedias)

    this._storageMedia.model = mediaModel
    this._storageMedia.expression = Gtk.PropertyExpression.new(StorageMedia.$gtype, null, 'name')
  }

  private initCurrencies() {
    const currencyModel = new Gio.ListStore({ itemType: Currency.$gtype })
    currencyModel.splice(0, 0, currencies)

    this._currency.model = currencyModel
    this._currency.expression = Gtk.PropertyExpression.new(Currency.$gtype, null, 'iso')
  }

  private initDates() {
    const now = GLib.DateTime.new_now_local()
    this._releaseYear.value = now.get_year()
    this._releaseYear.adjustment.upper = now.get_year()

    this._boughtDateLabel.label = now.format(_('%d/%m/%Y')) ?? ''
    this._boughtDate.select_day(now)

    this._boughtDate.connect('day-selected', (self) => {
      this._boughtDateLabel.label = self.get_date().format(_('%d/%m/%Y')) ?? ''
    })
  }

  private initPaidPrice() {
    this._amount.connect('notify::text', () => {
      const currency = this._currency.selectedItem as Currency
      const amountText = this._amount.text.replace(',', '.')
      const amount = Number.parseFloat(amountText.length === 0 ? '0' : amountText)

      this.onPaidPriceChanged(currency ?? getCurrency('USD'), Number.isNaN(amount) ? 0.0 : amount)
    })

    this._currency.connect('notify::selected-item', () => {
      const currency = this._currency.selectedItem as Currency
      const amountText = this._amount.text.replace(',', '.')
      const amount = Number.parseFloat(amountText.length === 0 ? '0' : amountText)

      this.onPaidPriceChanged(currency ?? getCurrency('USD'), Number.isNaN(amount) ? 0.0 : amount)
    })
  }

  private fillData() {
    this._title.text = this.game.title
    this._platform.set_selected(platforms.indexOf(getPlatform(this.game.platform)))
    this._developer.text = this.game.developer
    this._publisher.text = this.game.publisher
    this._releaseYear.set_value(this.game.releaseYear)
    this._certification.set_selected(certifications.indexOf(getCertification(this.game.certification)))
    this._story.buffer.text = this.game.story
    this._barcode.text = this.game.barcode ?? ''
    this._storageMedia.set_selected(storageMedias.indexOf(getStorageMedia(this.game.storageMedia)))
    this._condition.set_selected(gameConditions.indexOf(getGameCondition(this.game.condition)))
    this._store.text = this.game.store ?? ''
    this._currency.set_selected(currencies.indexOf(getCurrency(this.game.paidPriceCurrency) ?? getCurrency('USD')!))
    this._amount.text = '%.2f'.format(this.game.paidPriceAmount)
    this._wishlist.active = this.game.wishlist

    const cover = this.game.cover

    if (cover.query_exists(null)) {
      this.coverFile = cover
      this._cover.set_file(cover)
      this._deleteRevealer.revealChild = true
    }

    const boughtDate = this.game.boughtAtDateTime

    if (boughtDate) {
      this._boughtDate.select_day(boughtDate)
    }
  }

  private initValidation() {
    this.widgetMap = {
      title: this._title,
      developer: this._developer,
      publisher: this._publisher,
      barcode: this._barcode,
      amount: this._amount
    }

    for (const [key, editable] of Object.entries(this.widgetMap)) {
      setupEntryRow(
        this.validator,
        editable as Adw.EntryRow,
        key as keyof EditDialogWidget['widgetMap']
      )
    }

    touch(this.validator, this.widgetMap)
  }

  private async onNewCoverAction() {
    if (!this.window || !(this.window instanceof Gtk.Window)) {
      return
    }

    const filter = new Gtk.FileFilter()
    filter.add_mime_type('image/jpeg')
    filter.add_mime_type('image/png')
    filter.add_mime_type('image/gif')
    filter.add_mime_type('image/webp')

    const fileDialog = new Gtk.FileDialog({
      title: _('Select a cover'),
      defaultFilter: filter,
      modal: true,
    })

    try {
      const image = await fileDialog.open(this.window, null)

      if (image) {
        this.onCoverOpen(image)
      }
    } catch (_e: any) {
      // Do nothing
    }
  }

  private onRemoveCoverAction() {
    this._deleteRevealer.revealChild = false
    this._cover.set_file(null)
    this.coverFile = null
  }

  private async onSaveAction() {
    if (!validate(this.validator, this.widgetMap)) {
      return
    }

    const amount = Number.parseFloat(this._amount.text.replace(',', '.'))

    const game = new Game({
      id: this.game.id,
      title: this._title.text,
      platform: (this._platform.selectedItem as Platform).id,
      developer: this._developer.text,
      publisher: this._publisher.text,
      releaseYear: this._releaseYear.value,
      certification: (this._certification.selectedItem as Certification).id,
      story: this._story.buffer.get_text(
        this._story.buffer.get_start_iter(),
        this._story.buffer.get_end_iter(),
        false
      ),
      barcode: this._barcode.text,
      storageMedia: (this._storageMedia.selectedItem as StorageMedia).id,
      condition: (this._condition.selectedItem as GameCondition).id,
      boughtDate: this._boughtDate.get_date().to_unix(),
      store: this._store.text,
      wishlist: this._wishlist.active,
      paidPriceAmount: Number.isNaN(amount) ? 0.0 : amount,
      paidPriceCurrency: (this._currency.selectedItem as Currency).iso
    })

    GamesRepository.instance.update(game)

    const existingCover = this.game.cover

    if (this.coverFile && this.coverFile.get_path() !== existingCover.get_path()) {
      await convertCover(this.coverFile, this.game.id)
    } else if (this.coverFile === null && existingCover.query_exists(null)) {
      existingCover.delete(null)
    }

    this.emit('game-updated', game)
    this.close()
  }

  private onCoverOpen(image: Gio.File) {
    this._deleteRevealer.revealChild = true
    this._cover.file = image
    this.coverFile = image
  }

  private onPaidPriceChanged(currency: Currency, amount: number) {
    this._paidPriceLabel.label = `${currency.symbol} %.2f`.format(amount)
  }

  present(parent?: Gtk.Widget | null): void {
    this.window = parent
    super.present(parent)
  }
}
