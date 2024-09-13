import Adw from 'gi://Adw'
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk?version=4.0'

import { Certification, certifications, certificationSystemName, certificationSystems } from '../model/certification.js'
import Game from '../model/game.js'
import { GameCondition, gameConditions } from '../model/gameCondition.js'
import { getPlatform, Platform, PlatformId, platforms } from '../model/platform.js'
import { StorageMedia, storageMedias } from '../model/storageMedia.js'
import GamesRepository from '../repositories/games.js'
import convertCover from '../utils/convertCover.js'

export class CreateDialogWidget extends Adw.Dialog {
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

  private _deleteRevealer!: Gtk.Revealer

  private window?: Gtk.Widget | null = null
  private coverFile: Gio.File | null = null

  game!: Game
  defaultPlatform: PlatformId | null = null

  static {
    GObject.registerClass({
      GTypeName: 'CreateDialogWidget',
      Template: 'resource:///org/jogos/Jogos/ui/create-dialog.ui',
      Properties: {
        defaultPlatform: GObject.ParamSpec.string(
          'default-platform',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          ''
        )
      },
      InternalChildren: [
        'cover', 'title', 'barcode', 'developer', 'publisher', 'releaseYear',
        'platform', 'story', 'deleteRevealer', 'condition', 'storageMedia',
        'boughtDateLabel', 'boughtDate', 'paidPriceLabel', 'currency', 'amount',
        'story', 'store', 'certification'
      ],
      Signals: {
        'game-created': {
          param_types: [Game.$gtype]
        }
      }
    }, this)
  }

  constructor(params: Partial<CreateDialogWidget> = {}) {
    super(params)

    this.initActions()
    this.initPlatforms(params.defaultPlatform ?? null)
    this.initConditions()
    this.initCertifications()
    this.initMedias()
    this.initDates()
    this.initPaidPrice()
  }

  private initActions() {
    const actionGroup = new Gio.SimpleActionGroup()
    this.insert_action_group('create-dialog', actionGroup)

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

  private initPlatforms(selected: PlatformId | null) {
    const platformModel = new Gio.ListStore({ itemType: Platform.$gtype })
    platformModel.splice(0, 0, platforms)

    this._platform.model = platformModel
    this._platform.expression = Gtk.PropertyExpression.new(Platform.$gtype, null, 'name')

    if (selected) {
      this._platform.selected = platforms.indexOf(getPlatform(selected))
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

  private initDates() {
    const now = GLib.DateTime.new_now_local()
    this._releaseYear.value = now.get_year()
    this._releaseYear.adjustment.upper = now.get_year()

    this._boughtDateLabel.label = now.format('%d/%m/%Y') ?? ''
    this._boughtDate.select_day(now)

    this._boughtDate.connect('day-selected', (self) => {
      this._boughtDateLabel.label = self.get_date().format('%d/%m/%Y') ?? ''
    })
  }

  private initPaidPrice() {
    this._amount.connect('notify::text', () => {
      const currency = (this._currency.selectedItem as Gtk.StringObject).string
      const amountText = this._amount.text.replace(',', '.')
      const amount = Number.parseFloat(amountText.length === 0 ? '0' : amountText)

      this.onPaidPriceChanged(currency ?? 'USD', Number.isNaN(amount) ? 0.0 : amount)
    })

    this._currency.connect('notify::selected-item', () => {
      const currency = (this._currency.selectedItem as Gtk.StringObject).string
      const amountText = this._amount.text.replace(',', '.')
      const amount = Number.parseFloat(amountText.length === 0 ? '0' : amountText)

      this.onPaidPriceChanged(currency ?? 'USD', Number.isNaN(amount) ? 0.0 : amount)
    })
  }

  private onNewCoverAction() {
    if (!this.window || !(this.window instanceof Gtk.Window)) {
      return
    }

    const filter = new Gtk.FileFilter({ name: _('Images') })
    filter.add_mime_type('image/jpeg')
    filter.add_mime_type('image/png')
    filter.add_mime_type('image/gif')
    filter.add_mime_type('image/webp')

    const imageFilters = new Gio.ListStore({ itemType: Gtk.FileFilter.$gtype })
    imageFilters.append(filter)

    const fileDialog = new Gtk.FileDialog({
      title: 'Select a cover',
      filters: imageFilters,
      defaultFilter: filter,
      modal: true,
    })

    fileDialog.open(this.window, null, (_self, result, _data) => {
      try {
        const image = fileDialog.open_finish(result)

        if (image) {
          this.onCoverOpen(image)
        }
      } catch {
        // Do nothing.
      }
    })
  }

  private onRemoveCoverAction() {
    this._deleteRevealer.revealChild = false
    this._cover.set_file(null)
    this.coverFile = null
  }

  private async onCreateAction() {
    const amount = Number.parseFloat(this._amount.text.replace(',', '.'))

    const game = new Game({
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
      paidPriceAmount: Number.isNaN(amount) ? 0.0 : amount,
      paidPriceCurrency: (this._currency.selectedItem as Gtk.StringObject).string
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

  private onPaidPriceChanged(currency: string, amount: number) {
    this._paidPriceLabel.label = `${currency} %.2f`.format(amount)
  }

  present(parent?: Gtk.Widget | null): void {
    this.window = parent
    super.present(parent)
  }
}

