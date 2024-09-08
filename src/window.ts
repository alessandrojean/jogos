import Adw from 'gi://Adw'
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk?version=4.0'

import { Application } from './application.js'
import { GamePlatform } from './model/game.js'
import { GamesWidget } from './widgets/games.js'
import type { SidebarItem } from './widgets/sidebarItem.js'
import { SidebarItemWidget } from './widgets/sidebarItem.js'

const CONFIGURE_ID_TIMEOUT = 100

export class Window extends Adw.ApplicationWindow {
  private configureId: number = 0

  private _splitView!: Adw.NavigationSplitView
  private _sidebarList!: Gtk.ListBox
  private _content!: Adw.NavigationPage
  private _gamesWidget!: GamesWidget
  private _searchBar!: Gtk.SearchBar
  private _searchEntry!: Gtk.SearchEntry
  private _showList!: Gtk.Button
  private _showGrid!: Gtk.Button

  private sidebarItems: SidebarItem[] = [
    { id: 'ALL_GAMES', label: _('All games'), iconName: 'lucide-gamepad-2-symbolic', section: 'top-pinned' },
    { id: 'FAVORITES', label: _('Favorites'), iconName: 'lucide-star-symbolic', section: 'top-pinned' },

    { id: 'PC', label: 'PC', iconName: 'pc', section: 'pc' },

    { id: 'PLAYSTATION_5', label: 'PlayStation 5', iconName: 'playstation', section: 'generation-9' },
    { id: 'XBOX_SERIES', label: 'Xbox Series', iconName: 'xbox', section: 'generation-9' },

    { id: 'NINTENDO_3DS', label: 'Nintendo 3DS', iconName: 'nintendo-3ds', section: 'generation-8' },
    { id: 'NINTENDO_SWITCH', label: 'Nintendo Switch', iconName: 'nintendo-switch', section: 'generation-8' },
    { id: 'PLAYSTATION_4', label: 'PlayStation 4', iconName: 'playstation', section: 'generation-8' },
    { id: 'PLAYSTATION_VITA', label: 'PlayStation Vita', iconName: 'playstation', section: 'generation-8' },
    { id: 'NINTENDO_WII_U', label: 'Nintendo Wii U', iconName: 'wii-u', section: 'generation-8' },
    { id: 'XBOX_ONE', label: 'Xbox One', iconName: 'xbox', section: 'generation-8' },

    { id: 'NINTENDO_DS', label: 'Nintendo DS', iconName: 'nintendo-ds', section: 'generation-7' },
    { id: 'PSP', label: 'PSP', iconName: 'playstation', section: 'generation-7' },
    { id: 'PLAYSTATION_3', label: 'PlayStation 3', iconName: 'playstation', section: 'generation-7' },
    { id: 'NINTENDO_WII', label: 'Nintendo Wii', iconName: 'wii', section: 'generation-7' },
    { id: 'XBOX_360', label: 'Xbox 360', iconName: 'xbox', section: 'generation-7' },

    { id: 'DREAMCAST', label: 'Dreamcast', iconName: 'dreamcast', section: 'generation-6' },
    { id: 'GAME_BOY_ADVANCE', label: 'Game Boy Advance', iconName: 'nintendo-game-boy', section: 'generation-6' },
    { id: 'GAMECUBE', label: 'GameCube', iconName: 'gamecube', section: 'generation-6' },
    { id: 'PLAYSTATION_2', label: 'PlayStation 2', iconName: 'playstation', section: 'generation-6' },
    { id: 'XBOX', label: 'Xbox', iconName: 'xbox', section: 'generation-6' },

    { id: 'GAME_BOY_COLOR', label: 'Game Boy Color', iconName: 'nintendo-game-boy', section: 'generation-5' },
    { id: 'NINTENDO_64', label: 'Nintendo 64', iconName: 'nintendo-64', section: 'generation-5' },
    { id: 'PLAYSTATION', label: 'PlayStation', iconName: 'playstation', section: 'generation-5' },
    { id: 'SATURN', label: 'Saturn', iconName: 'sega-saturn', section: 'generation-5' },

    { id: 'GAME_BOY', label: 'Game Boy', iconName: 'nintendo-game-boy', section: 'generation-4' },
    { id: 'MEGA_DRIVE', label: 'Mega Drive', iconName: 'sega', section: 'generation-4' },
    { id: 'SUPER_NINTENDO', label: 'Super Nintendo', iconName: 'snes', section: 'generation-4' },

    { id: 'MASTER_SYSTEM', label: 'Master System', iconName: 'sega', section: 'generation-3' },
    { id: 'NES', label: 'NES', iconName: 'nes', section: 'generation-3' },

    { id: 'ATARI_2600', label: 'Atari 2600', iconName: 'atari', section: 'generation-2' },
  ]

  static {
    GObject.registerClass({
      GTypeName: 'JogosWindow',
      Template: 'resource:///org/jogos/Jogos/ui/window.ui',
      InternalChildren: [
        'splitView', 'sidebarList', 'content', 'gamesWidget',
        'searchBar', 'searchEntry', 'showList', 'showGrid',
      ],
    }, this)

    // Widgets allow you to directly add shortcuts to them when subclassing
    Gtk.Widget.add_shortcut(
      new Gtk.Shortcut({
        action: new Gtk.NamedAction({ action_name: 'window.close' }),
        trigger: Gtk.ShortcutTrigger.parse_string('<Control>w'),
      })
    )
  }

  constructor(params?: Partial<Adw.ApplicationWindow.ConstructorProperties>) {
    super(params)

    this.restoreWindowGeometry()
    this.initSignals()
    this.initSearchBar()
    this.initSidebar()
    this.initButtons()
  }

  private initSignals() {
    this.connect('close-request', () => this.quit())
    this.connect('notify::default-width', () => this.onSizeChanged())
    this.connect('notify::default-height', () => this.onSizeChanged())
    this.connect('notify::maximized', () => this.onMaximizedChanged())
  }

  private initSidebar() {
    for (const item of this.sidebarItems) {
      this._sidebarList.append(new SidebarItemWidget(item))
    }

    this._sidebarList.set_header_func((row, before) => {
      if (row instanceof SidebarItemWidget && before instanceof SidebarItemWidget) {
        if (before.section !== row.section) {
          row.set_header(new Gtk.Separator({ orientation: Gtk.Orientation.HORIZONTAL }))
        }
      }
    })

    this._content.set_title(this.sidebarItems[0].label)

    const lastItemId = Application.settings.get<string>('last-sidebar-item')
    const lastItemIndex = this.sidebarItems.findIndex(p => p.id === lastItemId)
    const lastItem = this.sidebarItems[lastItemIndex]
    const itemRow = this._sidebarList.get_row_at_index(Math.max(0, lastItemIndex))

    this._sidebarList.select_row(itemRow)
    this.onSidebarItemSelected(lastItem.id ?? this.sidebarItems[0].id)

    this._sidebarList.connect('row-activated', (_source, row) => {
      this.onSidebarItemSelected((row as SidebarItemWidget).id)
    })
  }

  private initSearchBar() {
    this._searchEntry.connect('search-changed', () => {
      this._gamesWidget.search(this._searchEntry.text)
    })

    const showSearchAction = new Gio.SimpleAction({ name: 'show-search' })

    showSearchAction.connect('activate', () => {
      if (this._searchBar.searchModeEnabled) {
        this._searchEntry.grab_focus()
        return
      }

      this._searchBar.searchModeEnabled = true
    })

    this.add_action(showSearchAction)
    this.application.set_accels_for_action('win.show-search', ['<Control>f'])
  }

  private initButtons() {
    this._showGrid.connect('clicked', () => {
      this._gamesWidget.showGrid()
      this._showGrid.visible = false
      this._showList.visible = true
      Application.settings.setValue('show-grid', true)
    })

    this._showList.connect('clicked', () => {
      this._gamesWidget.showList()
      this._showList.visible = false
      this._showGrid.visible = true
      Application.settings.setValue('show-grid', false)
    })

    const saved = Application.settings.get<boolean>('show-grid')

    if (!saved) {
      this._gamesWidget.showList()
      this._showGrid.visible = true
      this._showList.visible = false
    }
  }

  private quit() {
    this.saveWindowGeometry()
  }

  private onSizeChanged() {
    if (this.configureId !== 0) {
      GLib.source_remove(this.configureId)
      this.configureId = 0
    }

    this.configureId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, CONFIGURE_ID_TIMEOUT, () => {
      this.saveWindowGeometry()
      this.configureId = 0
      return false
    })
  }

  private onMaximizedChanged() {
    Application.settings.set_boolean('window-maximized', this.maximized)
  }

  private saveWindowGeometry() {
    if (this.maximized) {
      return
    }

    Application.settings.setValue('window-size', [this.defaultWidth, this.defaultHeight])
  }

  private restoreWindowGeometry() {
    const size = Application.settings.get<number[]>('window-size')

    if (size.length === 2) {
      const [width, height] = size
      this.set_default_size(width, height)
    }

    if (Application.settings.get<boolean>('window-maximized')) {
      this.maximize()
    }

  }

  private onSidebarItemSelected(itemId: string) {
    const item = this.sidebarItems.find(item => item.id === itemId)

    if (!item) {
      return
    }

    Application.settings.setValue('last-sidebar-item', itemId)

    this._content.set_title(item.label)

    if (itemId === 'ALL_GAMES') {
      this._gamesWidget.selectPlatform(null)
      return
    }

    if (itemId === 'FAVORITES') {
      this._gamesWidget.showFavorites()
      return
    }

    // It's a platform

    this._gamesWidget.selectPlatform(itemId as GamePlatform)

    if (this._splitView.get_collapsed()) {
      this._splitView.set_show_content(true)
    }

  }
}
