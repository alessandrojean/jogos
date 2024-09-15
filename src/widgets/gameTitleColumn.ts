import GObject from 'gi://GObject'
import Gio from 'gi://Gio'
import ContextMenuBin from './contextMenuBin.js'

export default class GameTitleColumnWidget extends ContextMenuBin {
  visibleCover: 'placeholder' | 'cover' = 'placeholder'

  title!: string
  cover: Gio.File | null = null
  platformIconName!: string

  static {
    GObject.registerClass({
      GTypeName: 'GameTitleColumnWidget',
      Template: 'resource:///io/github/alessandrojean/jogos/ui/game-title-column.ui',
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
    super()
    Object.assign(this, params)

    this.connect('notify::cover', () => {
      this.visibleCover = this.cover?.query_exists(null) ? 'cover' : 'placeholder'
    })
  }
}
