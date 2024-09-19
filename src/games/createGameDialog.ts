import Adw from 'gi://Adw'
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk?version=4.0'

import { Application } from '../application.js'
import OnlineGameResult from '../games/onlineGameResult.js'
import { igdbCoverUrl, IgdbGame } from '../igdb/api.js'
import { Certification, certifications, certificationSystemName, certificationSystems } from '../model/certification.js'
import { currencies, Currency, getCurrency } from '../model/currency.js'
import Game from '../model/game.js'
import { GameCondition, gameConditions } from '../model/gameCondition.js'
import { getPlatform, Platform, platformFromIgdb, PlatformId, platforms } from '../model/platform.js'
import { StorageMedia, storageMedias } from '../model/storageMedia.js'
import GamesRepository from '../repositories/games.js'
import { convertCover, downloadCover } from '../utils/cover.js'
import { localeOptions, LocaleOptions } from '../utils/locale.js'
import { clear, createValidator, integer, max, optional, real, required, setupEntryRow, validate, WidgetMap } from '../utils/validators.js'

export class CreateGameDialog extends Adw.Dialog {
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
  private _resultsList!: Gtk.ListBox
  private _deleteRevealer!: Gtk.Revealer

  private _stack!: Adw.ViewStack
  private _viewSwitcher!: Adw.ViewSwitcherBar
  private _searchStack!: Gtk.Stack

  private window?: Gtk.Widget | null = null
  private coverFile: Gio.File | null = null
  private locale!: LocaleOptions
  private onlineGame?: IgdbGame
  private onlineGamePlatforms: Platform[] = []

  private validator = createValidator({
    title: { required },
    developer: { required },
    publisher: { required },
    barcode: { number: optional(integer), max: max(13) },
    amount: { number: optional(real) }
  })

  private widgetMap!: WidgetMap<keyof CreateGameDialog['validator']>
  private onlineResults: IgdbGame[] = []

  game!: Game
  defaultPlatform: PlatformId | null = null
  defaultWishlist: boolean = false

  static {
    GObject.registerClass({
      GTypeName: 'CreateGameDialog',
      Template: 'resource:///io/github/alessandrojean/jogos/ui/create-game-dialog.ui',
      Properties: {
        defaultPlatform: GObject.ParamSpec.string(
          'default-platform',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          ''
        ),
        defaultWishlist: GObject.ParamSpec.boolean(
          'default-wishlist',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          false
        )
      },
      InternalChildren: [
        'cover', 'title', 'barcode', 'developer', 'publisher', 'releaseYear',
        'platform', 'story', 'deleteRevealer', 'condition', 'storageMedia',
        'boughtDateLabel', 'boughtDate', 'paidPriceLabel', 'currency', 'amount',
        'story', 'store', 'certification', 'wishlist', 'resultsList',
        'stack', 'viewSwitcher', 'searchStack'
      ],
      Signals: {
        'game-created': {
          param_types: [Game.$gtype]
        }
      }
    }, this)
  }

  constructor(params: Partial<CreateGameDialog> = {}) {
    super(params)

    this.locale = localeOptions()
    this.defaultPlatform = params.defaultPlatform ?? null
    this.defaultWishlist = params.defaultWishlist ?? false

    this.initActions()
    this.initPlatforms()
    this.initConditions()
    this.initCertifications()
    this.initMedias()
    this.initCurrencies()
    this.initDates()
    this.initPaidPrice()
    this.initValidation()
    this.initStack()

    this._wishlist.active = this.defaultWishlist
  }

  private initActions() {
    const actionGroup = new Gio.SimpleActionGroup()
    this.insert_action_group('create-game-dialog', actionGroup)

    const newCoverAction = new Gio.SimpleAction({ name: 'new-cover' })
    newCoverAction.connect('activate', () => this.onNewCoverAction())
    actionGroup.add_action(newCoverAction)

    const removeCoverAction = new Gio.SimpleAction({ name: 'remove-cover' })
    removeCoverAction.connect('activate', () => this.onRemoveCoverAction())
    actionGroup.add_action(removeCoverAction)

    const createAction = new Gio.SimpleAction({ name: 'create' })
    createAction.connect('activate', () => this.onCreateAction())
    actionGroup.add_action(createAction)
  }

  private initPlatforms() {
    const platformModel = new Gio.ListStore({ itemType: Platform.$gtype })
    platformModel.splice(0, 0, platforms)

    const platformFilterModel = new Gtk.FilterListModel({
      model: platformModel,
      filter: Gtk.BoolFilter.new(Gtk.ConstantExpression.new_for_value(true))
    })

    this._platform.model = platformFilterModel
    this._platform.expression = Gtk.PropertyExpression.new(Platform.$gtype, null, 'name')

    if (this.defaultPlatform) {
      this._platform.selected = platforms.indexOf(getPlatform(this.defaultPlatform))
    }

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

    this._boughtDateLabel.label = now.format(this.locale.dateFormat) ?? ''
    this._boughtDate.select_day(now)

    this._boughtDate.connect('day-selected', (self) => {
      this._boughtDateLabel.label = self.get_date().format(this.locale.dateFormat) ?? ''
    })
  }

  private initPaidPrice() {
    this._amount.connect('notify::text', () => {
      const currency = this._currency.selectedItem as Currency
      const amountText = this._amount.text.replace(',', '.')
      const amount = Number.parseFloat(amountText.length === 0 ? '0' : amountText)

      this.onPaidPriceChanged(currency ?? getCurrency('USD')!, Number.isNaN(amount) ? 0.0 : amount)
    })

    this._currency.connect('notify::selected-item', () => {
      const currency = this._currency.selectedItem as Currency
      const amountText = this._amount.text.replace(',', '.')
      const amount = Number.parseFloat(amountText.length === 0 ? '0' : amountText)

      this.onPaidPriceChanged(currency ?? getCurrency('USD'), Number.isNaN(amount) ? 0.0 : amount)
    })

    const preferredCurrency = getCurrency(this.locale.currencyIso) ?? getCurrency('USD')!
    this._currency.selected = currencies.indexOf(preferredCurrency)
    this.onPaidPriceChanged(preferredCurrency, 0.0)
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
        key as keyof CreateGameDialog['widgetMap']
      )
    }
  }

  private initStack() {
    const igdbActive = Application.settings.igdbActive

    this._stack.visibleChildName = igdbActive ? 'search' : 'form'
    this._viewSwitcher.reveal = igdbActive
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
      title: _!('Select a cover'),
      defaultFilter: filter,
      modal: true,
    })

    try {
      // TODO: Remove the Promise cast when ts-for-gir fixes this.
      // https://github.com/gjsify/ts-for-gir/issues/171
      const image = await (fileDialog.open(this.window, null) as unknown as Promise<Gio.File | null>)

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

  private async onCreateAction() {
    if (!validate(this.validator, this.widgetMap)) {
      return
    }

    const amount = Number.parseFloat(this._amount.text.replace(',', '.'))

    const game = new Game({
      title: this._title.text.trim(),
      platform: (this._platform.selectedItem as Platform).id,
      developer: this._developer.text.trim(),
      publisher: this._publisher.text.trim(),
      releaseYear: this._releaseYear.value,
      certification: (this._certification.selectedItem as Certification).id,
      story: this._story.buffer.get_text(
        this._story.buffer.get_start_iter(),
        this._story.buffer.get_end_iter(),
        false
      ).trim(),
      barcode: this._barcode.text.trim(),
      storageMedia: (this._storageMedia.selectedItem as StorageMedia).id,
      condition: (this._condition.selectedItem as GameCondition).id,
      boughtDate: this._boughtDate.get_date().to_unix(),
      store: this._store.text.trim(),
      wishlist: this._wishlist.active,
      paidPriceAmount: Number.isNaN(amount) ? 0.0 : amount,
      paidPriceCurrency: (this._currency.selectedItem as Currency).iso,
      igdbId: this.onlineGame?.id ?? null,
    })

    const id = GamesRepository.instance.create(game)

    if (this.coverFile) {
      await convertCover(this.coverFile, id)
    }

    this.emit('game-created', game)
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

  private async onSearchChanged(search: Gtk.SearchEntry) {
    this._resultsList.remove_all()

    if (search.text.length === 0) {
      this.clear()
      return
    }

    try {
      const platform = this.defaultPlatform
        ? getPlatform(this.defaultPlatform).igdbId
        : undefined

      this.onlineResults = await Application.igdb.search(search.text, { platform })

      for (const item of this.onlineResults) {
        this._resultsList.append(new OnlineGameResult({
          title: `${item.name} (${GLib.DateTime.new_from_unix_utc(item.first_release_date).get_year()})`,
          cover: igdbCoverUrl(item.cover?.image_id, 'cover_small'),
          details: (item.involved_companies ?? [])
            .filter(ic => ic.developer)
            .map(ic => ic.company.name)
            .join(', '),
        }))
      }

      this._searchStack.visibleChildName = this.onlineResults.length === 0
        ? 'empty' : 'results'
    } catch (e: any) {
      console.error(e)
    }
  }

  private clear() {
    const platformModel = this._platform.model as Gtk.FilterListModel
    platformModel.filter = Gtk.BoolFilter.new(Gtk.ConstantExpression.new_for_value(true))

    this._title.text = ''
    this._platform.selected = platforms.findIndex(p => p.id === this.defaultPlatform)
    this._developer.text = ''
    this._publisher.text = ''
    this._releaseYear.value = GLib.DateTime.new_now_local().get_year()
    this._certification.selected = 0
    this._story.buffer.text = ''
    this._cover.set_paintable(null)
    this.coverFile = null
    this.onlineGame = undefined
    this.onlineGamePlatforms = []

    clear(this.validator, this.widgetMap)
  }

  private async onOnlineGameActivated(_list: Gtk.ListBox, row: Gtk.ListBoxRow) {
    const onlineGame = this.onlineResults[row.get_index()]
    const firstPlatform = platformFromIgdb(onlineGame.platforms?.[0] ?? -1)

    // Only let the user select the actual platforms the game was released for
    this.onlineGame = onlineGame
    this.onlineGamePlatforms = (onlineGame.platforms ?? [])
      .map(p => platformFromIgdb(p))
      .filter(p => p !== undefined)

    const platformModel = this._platform.model as Gtk.FilterListModel

    if (this.onlineGamePlatforms.length > 0) {
      platformModel.filter = Gtk.CustomFilter.new((item) => {
        const platform = item as Platform
        return this.onlineGamePlatforms.includes(platform)
      })
    } else {
      platformModel.filter = Gtk.BoolFilter.new(Gtk.ConstantExpression.new_for_value(true))
    }

    let platformToSelect = this.defaultPlatform
      ? platforms.findIndex(p => this.defaultPlatform === p.id)
      : 0

    if (firstPlatform && !this.defaultPlatform) {
      for (let i = 0; i < platformModel.nItems; i++) {
        if (platformModel.get_item(i) === firstPlatform) {
          platformToSelect = i
          break
        }
      }
    }

    this._title.text = onlineGame.name
    this._platform.selected = Math.max(platformToSelect, 0)
    this._developer.text = (onlineGame.involved_companies ?? [])
      .filter(ic => ic.developer)
      .map(ic => ic.company.name)
      .join(', ')
    this._publisher.text = (onlineGame.involved_companies ?? [])
      .filter(ic => ic.publisher)
      .map(ic => ic.company.name)
      .join(', ')
    this._releaseYear.value = GLib.DateTime.new_from_unix_utc(onlineGame.first_release_date).get_year()
    this._story.buffer.text = onlineGame.summary

    if (onlineGame.cover) {
      const downloadedCover = await downloadCover(
        `${onlineGame.cover.image_id}.jpg`,
        igdbCoverUrl(onlineGame.cover.image_id, 'cover_big')!,
      )

      if (downloadedCover) {
        this.coverFile = downloadedCover
        this._cover.file = downloadedCover
      }
    }

    this._stack.visibleChildName = 'form'
  }

  present(parent?: Gtk.Widget | null): void {
    this.window = parent
    super.present(parent)
  }
}

