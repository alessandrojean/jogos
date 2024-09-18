import Gdk from 'gi://Gdk'
import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk'
import { getRemoteImageBytes } from '../utils/cover.js'

export default class OnlineGameResult extends Gtk.Box {
  cover: string | null = null
  title!: string
  details!: string

  private _coverPicture!: Gtk.Picture
  private _placeholder!: Gtk.Image

  static {
    GObject.registerClass({
      GTypeName: 'OnlineGameResult',
      CssName: 'online-game-result',
      Template: 'resource:///io/github/alessandrojean/jogos/ui/online-game-result.ui',
      Properties: {
        cover: GObject.ParamSpec.string('cover', '', '', GObject.ParamFlags.READWRITE, ''),
        title: GObject.ParamSpec.string('title', '', '', GObject.ParamFlags.READWRITE, ''),
        details: GObject.ParamSpec.string('details', '', '', GObject.ParamFlags.READWRITE, ''),
      },
      InternalChildren: ['coverPicture', 'placeholder']
    }, this)
  }

  constructor(params: Partial<OnlineGameResult>) {
    super()
    Object.assign(this, params)

    this.loadCover()
  }

  private async loadCover() {
    if (!this.cover) {
      return
    }

    const bytes = await getRemoteImageBytes(this.cover)

    if (bytes) {
      const texture = Gdk.Texture.new_from_bytes(bytes)
      this._coverPicture.paintable = texture
      this._placeholder.visible = false
    }
  }
}
