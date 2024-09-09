import Adw from 'gi://Adw'
import GObject from 'gi://GObject'
import GdkPixbuf from 'gi://GdkPixbuf'
import Gtk from 'gi://Gtk?version=4.0'

import Game from '../model/game.js'

export class EditDialogWidget extends Adw.Dialog {
  private _cover!: Gtk.Picture
  private _title!: Adw.EntryRow
  private _barcode!: Adw.EntryRow
  private _developer!: Adw.EntryRow
  private _publisher!: Adw.EntryRow
  private _releaseYear!: Adw.SpinRow
  private _platform!: Adw.ComboRow
  private _story!: Adw.EntryRow

  private _deleteRevealer!: Gtk.Revealer

  game!: Game

  static {
    GObject.registerClass({
      GTypeName: 'EditDialogWidget',
      Template: 'resource:///org/jogos/Jogos/ui/edit-dialog.ui',
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
        'platform', 'story'
      ],
    }, this)
  }

  constructor(game: Game, params: Partial<EditDialogWidget> = {}) {
    super(params)

    this.game = game

    this._title.text = game.title
    this._barcode.text = game.barcode ?? ''
    this._developer.text = game.developer
    this._publisher.text = game.publisher
    this._releaseYear.set_value(game.releaseYear)
    this._story.text = game.story

    const cover = game.coverFile

    if (cover) {
      this._cover.set_pixbuf(GdkPixbuf.Pixbuf.new_from_file(cover))
      // this._deleteRevealer.revealChild = true
    }
  }
}
