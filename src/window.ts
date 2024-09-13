import Adw from 'gi://Adw'
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk?version=4.0'

import { Application } from './application.js'
import Game from './model/game.js'
import { PlatformId, platforms } from './model/platform.js'
import { CreateDialogWidget } from './widgets/createDialog.js'
import { DetailsDialogWidget } from './widgets/detailsDialog.js'
import { EditDialogWidget } from './widgets/editDialog.js'
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
    { id: 'ALL_GAMES', label: _('All games'), iconName: 'lucide-gamepad-2', section: 'top-pinned' },
    { id: 'RECENTS', label: _('Recents'), iconName: 'lucide-history', section: 'top-pinned' },
    { id: 'FAVORITES', label: _('Favorites'), iconName: 'lucide-star', section: 'top-pinned' },
    { id: 'WISHLIST', label: _('Wishlist'), iconName: 'lucide-folder-heart', section: 'top-pinned' },

    ...platforms.map(platform => ({
      id: platform.id,
      label: platform.name,
      iconName: platform.iconName,
      section: `generation-${platform.generation}`
    }))
  ]

  static {
    GObject.registerClass({
      GTypeName: 'JogosWindow',
      Template: 'resource:///org/jogos/Jogos/ui/window.ui',
      InternalChildren: [
        'splitView', 'sidebarList', 'content', 'gamesWidget',
        'searchBar', 'searchEntry', 'showList', 'showGrid'
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
    this.initActions()
    this.initSignals()
    this.initSearchBar()
    this.initSidebar()
    this.initButtons()
  }

  private initActions() {
    const createNewGame = new Gio.SimpleAction({ name: 'create-new-game' })
    createNewGame.connect('activate', () => this.onCreateNewGameAction())
    this.add_action(createNewGame)

    const showSearchAction = new Gio.SimpleAction({ name: 'show-search' })
    showSearchAction.connect('activate', () => {
      if (this._searchBar.searchModeEnabled) {
        this._searchEntry.grab_focus()
        return
      }

      this._searchBar.searchModeEnabled = true
    })
    this.add_action(showSearchAction)

    const showListAction = new Gio.SimpleAction({ name: 'show-list' })
    showListAction.connect('activate', () => this.onShowList())
    this.add_action(showListAction)

    const showGridAction = new Gio.SimpleAction({ name: 'show-grid' })
    showGridAction.connect('activate', () => this.onShowGrid())
    this.add_action(showGridAction)

    this.application.set_accels_for_action('win.show-search', ['<Control>f'])
    this.application.set_accels_for_action('win.create-new-game', ['<Control>n'])
    this.application.set_accels_for_action('win.show-list', ['<Control>1'])
    this.application.set_accels_for_action('win.show-grid', ['<Control>2'])
  }

  private initSignals() {
    this.connect('close-request', () => this.quit())
    this.connect('notify::default-width', () => this.onSizeChanged())
    this.connect('notify::default-height', () => this.onSizeChanged())
    this.connect('notify::maximized', () => this.onMaximizedChanged())

    this._gamesWidget.connect('game-activate', (_self, game: Game) => {
      const detailsDialog = new DetailsDialogWidget(game)
      detailsDialog.present(this)
    })

    this._gamesWidget.connect('game-edit', (_self, game: Game) => this.onGameEdit(game))
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
  }

  private initButtons() {
    this._showGrid.connect('clicked', () => this.onShowGrid())
    this._showList.connect('clicked', () => this.onShowList())

    const saved = Application.settings.get<boolean>('show-grid')

    if (!saved) {
      this._gamesWidget.showList()
      this._showGrid.visible = true
      this._showList.visible = false
    }
  }

  private onShowGrid() {
    this._gamesWidget.showGrid()
    this._showGrid.visible = false
    this._showList.visible = true
    Application.settings.setValue('show-grid', true)
  }

  private onShowList() {
    this._gamesWidget.showList()
    this._showList.visible = false
    this._showGrid.visible = true
    Application.settings.setValue('show-grid', false)
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

    if (itemId === 'WISHLIST') {
      return
    }

    if (itemId === 'RECENTS') {
      return
    }

    // It's a platform

    this._gamesWidget.selectPlatform(itemId as PlatformId)

    if (this._splitView.get_collapsed()) {
      this._splitView.set_show_content(true)
    }

  }

  private onCreateNewGameAction() {
    const selected = this._sidebarList.get_selected_row()?.get_index() ?? 0
    const platform = selected >= 4
      ? this.sidebarItems[selected].id as PlatformId
      : null

    const createDialog = new CreateDialogWidget({ defaultPlatform: platform })

    createDialog.connect('game-created', (_self, game) => {
      this._gamesWidget.search('')
      this._gamesWidget.selectPlatform(game.platform)
      this._gamesWidget.loadItems()
      this._gamesWidget.selectGame(game)
    })

    createDialog.present(this)
  }

  private onGameEdit(game: Game) {
    const editDialog = new EditDialogWidget(game)

    editDialog.connect('game-updated', (_self, updatedGame) => {
      this._gamesWidget.search('')
      this._gamesWidget.selectPlatform(updatedGame.platform)
      this._gamesWidget.loadItems()
      this._gamesWidget.selectGame(updatedGame)
    })

    editDialog.present(this)
  }
}
