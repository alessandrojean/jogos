import Adw from 'gi://Adw'
import GdkPixbuf from 'gi://GdkPixbuf'
import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk?version=4.0'

import Game, { platformName } from '../model/game.js'

export class DetailsDialog extends Adw.Dialog {
  private _cover!: Gtk.Picture
  private _title!: Gtk.Label
  private _platform!: Gtk.Label
  private _year!: Gtk.Label
  private _barcode!: Adw.ActionRow
  private _story!: Adw.ActionRow
  private _certification!: Adw.ActionRow
  private _developer!: Adw.ActionRow
  private _publisher!: Adw.ActionRow
  private _storageMedia!: Adw.ActionRow
  private _creationDate!: Adw.ActionRow
  private _modificationDate!: Adw.ActionRow

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
        'creationDate', 'modificationDate'
      ]
    }, this)
  }

  constructor(game: Game, params: Partial<DetailsDialog> = {}) {
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
    this._certification.subtitle = this.game.certification
    this._developer.subtitle = this.game.developer
    this._publisher.subtitle = this.game.publisher
    this._storageMedia.subtitle = this.game.storageMedia
    this._creationDate.subtitle = this.game.createdAt.toISOString()
    this._modificationDate.subtitle = this.game.modifiedAt.toISOString()

    const coverFile = this.game.coverFile

    if (coverFile) {
      this._cover.set_pixbuf(GdkPixbuf.Pixbuf.new_from_file(coverFile))
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
