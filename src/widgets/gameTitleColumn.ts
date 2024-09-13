import Gio from 'gi://Gio'
import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk?version=4.0'

export default class GameTitleColumnWidget extends Gtk.Box {
  visibleCover: 'placeholder' | 'cover' = 'placeholder'

  title!: string
  cover: Gio.File | null = null
  platformIconName!: string

  static {
    GObject.registerClass({
      GTypeName: 'GameTitleColumnWidget',
      Template: 'resource:///org/jogos/Jogos/ui/game-title-column.ui',
      Properties: {
        title: GObject.ParamSpec.string(
          'title',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          '',
        ),
        cover: GObject.ParamSpec.object(
          'cover',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          Gio.File.$gtype
        ),
        platformIconName: GObject.ParamSpec.string(
          'platform-icon-name',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          '',
        ),
        visibleCover: GObject.ParamSpec.string(
          'visible-cover',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          'placeholder'
        )
      }
    }, this)
  }

  constructor(params: Partial<GameTitleColumnWidget>) {
    super(params)
    Object.assign(this, params)

    this.connect('notify::cover', () => {
      this.visibleCover = this.cover?.query_exists(null) ? 'cover' : 'placeholder'
    })
  }
}
