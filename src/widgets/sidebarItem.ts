import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk?version=4.0'

export interface SidebarItem {
  id: string
  iconName: string
  label: string
  section: string
}

export class SidebarItemWidget extends Gtk.ListBoxRow {
  private _itemIcon!: Gtk.Image
  private _itemLabel!: Gtk.Label

  id: string
  iconName: string
  label: string
  section: string

  static {
    GObject.registerClass({
      GTypeName: 'SidebarItemWidget',
      Template: 'resource:///org/jogos/Jogos/ui/sidebar-item.ui',
      InternalChildren: ['itemIcon', 'itemLabel'],
      Properties: {
        id: GObject.ParamSpec.string(
          'id',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          ''
        ),
        iconName: GObject.ParamSpec.string(
          'icon-name',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          ''
        ),
        label: GObject.ParamSpec.string(
          'label',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          ''
        ),
        section: GObject.ParamSpec.string(
          'section',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          ''
        ),
      }
    }, this)
  }

  constructor(params: Partial<SidebarItemWidget>) {
    super(params)

    this.id = params.id ?? ''
    this.label = params.label ?? ''
    this.iconName = params.iconName ?? ''
    this.section = params.section ?? ''

    this._itemIcon.set_from_icon_name(this.iconName)
    this._itemLabel.set_label(this.label)
  }
}
