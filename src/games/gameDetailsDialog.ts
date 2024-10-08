import Adw from 'gi://Adw'
import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk?version=4.0'

import { Application } from '../application.js'
import { getCertification } from '../model/certification.js'
import { getCurrency } from '../model/currency.js'
import Game from '../model/game.js'
import { getGameCondition } from '../model/gameCondition.js'
import { getPlatform, platformName } from '../model/platform.js'
import { getStorageMedia } from '../model/storageMedia.js'
import { localeOptions, LocaleOptions } from '../utils/locale.js'

export class GameDetailsDialog extends Adw.Dialog {
  private _coverStack!: Gtk.Stack
  private _cover!: Gtk.Picture
  private _title!: Gtk.Label
  private _platform!: Gtk.Label
  private _year!: Gtk.Label
  private _barcode!: Adw.ActionRow
  private _story!: Adw.ActionRow
  private _certification!: Adw.ActionRow
  private _certificationImage!: Gtk.Image
  private _developer!: Adw.ActionRow
  private _publisher!: Adw.ActionRow
  private _storageMedia!: Adw.ActionRow
  private _creationDate!: Adw.ActionRow
  private _modificationDate!: Adw.ActionRow
  private _condition!: Adw.ActionRow
  private _boughtDate!: Adw.ActionRow
  private _store!: Adw.ActionRow
  private _paidPrice!: Adw.ActionRow
  private _placeholderImage!: Gtk.Image
  private _openInIgdb!: Gtk.Button

  private locale!: LocaleOptions

  game!: Game

  static {
    GObject.registerClass({
      GTypeName: 'GameDetailsDialog',
      Template: 'resource:///io/github/alessandrojean/jogos/ui/game-details-dialog.ui',
      Properties: {
        game: GObject.ParamSpec.object(
          'game',
          '',
          '',
          // @ts-ignore
          GObject.ParamFlags.READWRITE,
          Game.$gtype
        ),
      },
      InternalChildren: [
        'title', 'cover', 'platform', 'year', 'barcode', 'story',
        'certification', 'developer', 'publisher', 'storageMedia',
        'creationDate', 'modificationDate', 'certificationImage',
        'condition', 'boughtDate', 'store', 'paidPrice', 'coverStack',
        'placeholderImage', 'openInIgdb'
      ]
    }, this)
  }

  constructor(game: Game, params: Partial<GameDetailsDialog> = {}) {
    super(params)

    this.game = game
    this.locale = localeOptions()

    if (this.game.igdbSlug) {
      this._openInIgdb.visible = true
    }

    this.fillGameInformation()
  }

  private fillGameInformation() {
    this._title.label = this.game.title
    this._platform.label = platformName(this.game.platform)
    this._year.label = this.game.releaseYear.toString()
    this._barcode.subtitle = this.game.barcode?.length ? this.game.barcode : _!('Not informed')
    this._story.subtitle = this.game.story.length > 0 ? this.game.story : _!('Not informed')
    this._developer.subtitle = this.game.developer
    this._publisher.subtitle = this.game.publisher
    this._creationDate.subtitle = this.game.createdAtDateTime.format(this.locale.dateTimeFormat) ?? ''
    this._modificationDate.subtitle = this.game.modifiedAtDateTime.format(this.locale.dateTimeFormat) ?? ''
    this._boughtDate.subtitle = this.game.boughtAtDateTime?.format(this.locale.dateFormat) ?? _!('Unknown')
    this._store.subtitle = this.game.store?.length ? this.game.store : _!('Unknown')

    const currency = getCurrency(this.game.paidPriceCurrency) ?? getCurrency('USD')!
    this._paidPrice.subtitle = `${currency.symbol} %.2f`.format(this.game.paidPriceAmount)

    const certification = getCertification(this.game.certification)
    this._certification.subtitle = certification?.name ?? _!('Unknown')

    if (certification) {
      this._certificationImage.iconName = certification.iconName
    }

    const media = getStorageMedia(this.game.storageMedia)
    this._storageMedia.subtitle = media?.name ?? _!('Unknown')

    const condition = getGameCondition(this.game.condition)
    this._condition.subtitle = condition?.name ?? _!('Unknown')

    const cover = this.game.cover
    this._cover.file = cover
    this._placeholderImage.iconName = getPlatform(this.game.platform).iconName

    if (cover.query_exists(null)) {
      this._coverStack.visibleChild = this._cover
    }

    if (!this.game.barcode) {
      this._barcode.remove_css_class('monospace')
      this._barcode.subtitleSelectable = false
    } else if (!this._barcode.has_css_class('monospace')) {
      this._barcode.add_css_class('monospace')
      this._barcode.subtitleSelectable = true
    }
  }

  private async onOpenInIgdbClicked() {
    const application = Gtk.Application.get_default() as Application

    const igdbLink = `https://igdb.com/games/${this.game.igdbSlug}`
    const launcher = new Gtk.UriLauncher({ uri: igdbLink })

    // TODO: Remove the Promise cast when ts-for-gir fixes this.
    // https://github.com/gjsify/ts-for-gir/issues/171
    await (launcher.launch(application.window, null) as any as Promise<boolean>)
  }
}
