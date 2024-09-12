import Adw from 'gi://Adw'
import GdkPixbuf from 'gi://GdkPixbuf'
import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk?version=4.0'

import { getCertification } from '../model/certification.js'
import Game from '../model/game.js'
import { getGameCondition } from '../model/gameCondition.js'
import { platformName } from '../model/platform.js'
import { getStorageMedia } from '../model/storageMedia.js'

export class DetailsDialogWidget extends Adw.Dialog {
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

  game!: Game

  static {
    GObject.registerClass({
      GTypeName: 'DetailsDialogWidget',
      Template: 'resource:///org/jogos/Jogos/ui/details-dialog.ui',
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
        'title', 'cover', 'platform', 'year', 'barcode', 'story',
        'certification', 'developer', 'publisher', 'storageMedia',
        'creationDate', 'modificationDate', 'certificationImage',
        'condition', 'boughtDate', 'store', 'paidPrice', 'coverStack'
      ]
    }, this)
  }

  constructor(game: Game, params: Partial<DetailsDialogWidget> = {}) {
    super(params)

    this.game = game

    this.fillGameInformation()
  }

  private fillGameInformation() {
    this._title.label = this.game.title
    this._platform.label = platformName(this.game.platform)
    this._year.label = this.game.releaseYear.toString()
    this._barcode.subtitle = this.game.barcode?.length ? this.game.barcode : _('Not informed')
    this._story.subtitle = this.game.story
    this._developer.subtitle = this.game.developer
    this._publisher.subtitle = this.game.publisher
    this._creationDate.subtitle = this.game.createdAtDateTime.format('%d/%m/%Y %T') ?? ''
    this._modificationDate.subtitle = this.game.modifiedAtDateTime.format('%d/%m/%Y %T') ?? ''
    this._boughtDate.subtitle = this.game.boughtAtDateTime?.format('%d/%m/%Y') ?? _('Unknown')
    this._store.subtitle = this.game.store ?? _('Unknown')
    this._paidPrice.subtitle = `${this.game.paidPriceCurrency} %.2f`.format(this.game.paidPriceAmount)

    const certification = getCertification(this.game.certification)
    this._certification.subtitle = certification?.name ?? _('Unknown')

    if (certification) {
      this._certificationImage.iconName = certification.iconName
    }

    const media = getStorageMedia(this.game.storageMedia)
    this._storageMedia.subtitle = media?.name ?? _('Unknown')

    const condition = getGameCondition(this.game.condition)
    this._condition.subtitle = condition?.name ?? _('Unknown')

    const coverFile = this.game.coverFile

    if (coverFile) {
      this._cover.set_pixbuf(GdkPixbuf.Pixbuf.new_from_file(coverFile))
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
}
