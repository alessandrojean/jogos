import GObject from 'gi://GObject'
import Gio from 'gi://Gio'
import Gtk from 'gi://Gtk?version=4.0'

export default class GameGridItemWidget extends Gtk.Box {
  showPlaceholder: boolean = true

  title!: string
  cover: Gio.File | null = null
  platformIconName!: string

  static {
    GObject.registerClass({
      GTypeName: 'GameGridItemWidget',
      CssName: 'game-grid-item',
      Template: 'resource:///io/github/alessandrojean/jogos/ui/game-grid-item.ui',
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
          // @ts-ignore
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
        showPlaceholder: GObject.ParamSpec.boolean(
          'show-placeholder',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          true
        )
      }
    }, this)
  }

  constructor(params: Partial<GameGridItemWidget>) {
    super(params)
    Object.assign(this, params)

    this.connect('notify::cover', () => {
      this.showPlaceholder = !this.cover?.query_exists(null)
    })
  }
}
