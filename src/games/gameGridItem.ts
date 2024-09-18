import GObject from 'gi://GObject'
import Gio from 'gi://Gio'
import ContextMenuBin from '../widgets/contextMenuBin.js'

export default class GameGridItem extends ContextMenuBin {
  showPlaceholder: boolean = true

  title!: string
  cover: Gio.File | null = null
  platformIconName!: string

  static {
    GObject.registerClass({
      GTypeName: 'GameGridItem',
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

  constructor(params: Partial<GameGridItem>) {
    super()
    Object.assign(this, params)

    this.connect('notify::cover', () => {
      this.showPlaceholder = !this.cover?.query_exists(null)
    })
  }
}
