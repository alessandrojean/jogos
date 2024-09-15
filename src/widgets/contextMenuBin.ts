import Adw from 'gi://Adw?version=1'
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'
import Gdk from 'gi://Gdk'
import Gio from 'gi://Gio'
import Gtk from 'gi://Gtk?version=4.0'

export default class ContextMenuBin extends Adw.Bin {

  private popover?: Gtk.PopoverMenu

  menuModel?: Gio.MenuModel

  static {
    GObject.registerClass({
      CssName: 'context-menu-bin',
      GTypeName: 'ContextMenuBin',
      Properties: {
        menuModel: GObject.ParamSpec.object(
          'menu-model',
          '',
          '',
          // @ts-expect-error
          GObject.ParamFlags.READWRITE,
          Gio.MenuModel.$gtype,
        )
      },
      Signals: {
        'setup-menu': { param_types: [] },
      },
    }, this)

    ContextMenuBin.install_action('context-menu.popup', null, widget => {
      const self = widget as ContextMenuBin
      self.openContextMenu(-1, -1)
    })

    ContextMenuBin.add_shortcut(
      new Gtk.Shortcut({
        action: new Gtk.NamedAction({ actionName: 'context-menu.popup' }),
        trigger: Gtk.ShortcutTrigger.parse_string('Menu|<Shift>F10'),
      })
    )
  }

  constructor(params: Partial<ContextMenuBin> = {}) {
    super()
    Object.assign(this, params)

    const clickGesture = new Gtk.GestureClick({ button: 0 })
    clickGesture.connect('pressed', this.onRightClickPressed.bind(this))
    this.add_controller(clickGesture)

    const longPressGesture = new Gtk.GestureLongPress({ touchOnly: true })
    longPressGesture.connect('pressed', this.onLongPressed.bind(this))
    this.add_controller(longPressGesture)
  }

  private openContextMenu(x: number, y: number) {
    if (x < 0 && y < 0) {
      x = 0
      y = 0
    }

    if (this.popover == undefined) {
      this.popover = new Gtk.PopoverMenu({
        menuModel: this.menuModel,
        hasArrow: false,
      })

      this.popover.bind_property('menu-model', this, 'menu-model', GObject.BindingFlags.DEFAULT)

      this.popover.connect('closed', () => {
        GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
          this.popover?.unparent()
          this.popover = undefined

          return false
        })
      })

      this.popover.set_parent(this)
    }

    this.popover.set_pointing_to(new Gdk.Rectangle({ x, y, width: 0, height: 0 }))

    if (this.get_direction() === Gtk.TextDirection.RTL) {
      this.popover.halign = Gtk.Align.END
    } else {
      this.popover.halign = Gtk.Align.START
    }

    this.emit('setup-menu')

    this.popover.popup()
  }

  private onRightClickPressed(gesture: Gtk.GestureClick, nClick: number, x: number, y: number) {
    const event = gesture.get_current_event()

    if (!event?.triggers_context_menu()) {
      gesture.set_state(Gtk.EventSequenceState.DENIED)
      return
    }

    if (!this.contains(x, y)) {
      gesture.set_state(Gtk.EventSequenceState.DENIED)
      return
    }

    this.openContextMenu(x, y)
    gesture.set_state(Gtk.EventSequenceState.CLAIMED)
  }

  private onLongPressed(gesture: Gtk.GestureLongPress, x: number, y: number) {
    if (!this.contains(x, y)) {
      gesture.set_state(Gtk.EventSequenceState.DENIED)
      return
    }

    this.openContextMenu(x, y)
    gesture.set_state(Gtk.EventSequenceState.CLAIMED)
  }
}
