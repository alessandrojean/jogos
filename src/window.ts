import Adw from 'gi://Adw'
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk?version=4.0'

import { Application } from './application.js'
import { CreateGameDialog } from './games/createGameDialog.js'
import { EditGameDialog } from './games/editGameDialog.js'
import { GameDetailsDialog } from './games/gameDetailsDialog.js'
import { GamesView, SortProperty } from './games/gamesView.js'
import Game from './model/game.js'
import { getPlatform, PlatformId } from './model/platform.js'
import GamesRepository from './repositories/games.js'
import type { SidebarItemProps } from './widgets/sidebarItem.js'
import { SidebarItem } from './widgets/sidebarItem.js'

const CONFIGURE_ID_TIMEOUT = 100

enum WindowState {
  ALL_GAMES,
  RECENTS,
  WISHLIST,
  FAVORITES,
  PLATFORM,
}

enum Stack {
  GAMES_VIEW = 'games-view',
  NO_RESULTS = 'no-results',
  NO_FAVORITES = 'no-favorites',
  NO_WISHLIST = 'no-wishlist',
  NO_GAMES_IN_PLATFORM = 'no-games-platform',
  NO_GAMES = 'no-games',
  LOADING = 'loading'
}



export class Window extends Adw.ApplicationWindow {
  private configureId: number = 0

  private _splitView!: Adw.NavigationSplitView
  private _sidebarList!: Gtk.ListBox
  private _content!: Adw.NavigationPage
  private _gamesView!: GamesView
  private _searchBar!: Gtk.SearchBar
  private _searchEntry!: Gtk.SearchEntry
  private _viewAndSort!: Adw.SplitButton
  private _toastOverlay!: Adw.ToastOverlay
  private _stack!: Gtk.Stack
  private _noGamesForPlatform!: Adw.StatusPage

  private changeSortAction!: Gio.SimpleAction

  private pinnedSidebarItems: SidebarItemProps[] = [
    { id: 'ALL_GAMES', label: _!('All games'), iconName: 'lucide-square-library-symbolic', section: 'top-pinned' },
    { id: 'RECENTS', label: _!('Recents'), iconName: 'lucide-history-symbolic', section: 'top-pinned' },
    { id: 'FAVORITES', label: _!('Favorites'), iconName: 'lucide-star-symbolic', section: 'top-pinned' },
    { id: 'WISHLIST', label: _!('Wishlist'), iconName: 'lucide-folder-heart-symbolic', section: 'top-pinned' },
  ]

  private sidebarItems: SidebarItemProps[] = []
  private state: WindowState = WindowState.ALL_GAMES
  private selectedPlatform: PlatformId | null = null
  private isSearching: boolean = false

  static {
    GObject.registerClass({
      GTypeName: 'JogosWindow',
      Template: 'resource:///io/github/alessandrojean/jogos/ui/window.ui',
      InternalChildren: [
        'splitView', 'sidebarList', 'content', 'gamesView', 'stack',
        'searchBar', 'searchEntry', 'viewAndSort', 'toastOverlay',
        'noGamesForPlatform'
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

  constructor(params?: Partial<Adw.ApplicationWindow.ConstructorProps>) {
    super(params)

    this.restoreWindowGeometry()
    this.initActions()
    this.initSignals()
    this.initSidebar()
    this.initViewOptions()

    // Load the games again as the user might have changed the date format.
    Application.settings.connect('changed', () => this.loadGames())
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

    const jogosGroup = new Gio.SimpleActionGroup()

    this.changeSortAction = new Gio.SimpleAction({
      name: 'change-sort',
      parameterType: GLib.VariantType.new('s'),
      state: GLib.Variant.new_string('title_asc'),
    })
    this.changeSortAction.connect('activate', (_self, sort: GLib.Variant<string>) => {
      this.changeSortAction.state = sort

      const [sortOption] = sort.get_string()
      this.onChangeSortAction(sortOption as SortProperty)
    })
    jogosGroup.add_action(this.changeSortAction)

    this.insert_action_group('jogos', jogosGroup)

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

    this._gamesView.connect('game-activate', (_self, game: Game) => {
      const gameDetailsDialog = new GameDetailsDialog(game)
      gameDetailsDialog.present(this)
    })

    this._gamesView.connect('game-edit', (_self, game: Game) => this.onGameEditAction(game))
    this._gamesView.connect('game-delete', (_self, game: Game) => this.onGameDeleteAction(game))
    this._gamesView.connect('game-favorited', (_self, game: Game) => this.onGameFavorited(game))
    this._gamesView.connect('game-unfavorited', (_self, game: Game) => this.onGameUnfavorited(game))

    this._gamesView.connect('sort-changed', (_self, property: Gtk.StringObject) => {
      this.changeSortAction.state = GLib.Variant.new_string(property.string)
    })
  }

  private initSidebar() {
    this.updateSidebarItems()

    this._sidebarList.set_header_func((row, before) => {
      if (row instanceof SidebarItem && before instanceof SidebarItem) {
        if (before.section !== row.section) {
          row.set_header(new Gtk.Separator({ orientation: Gtk.Orientation.HORIZONTAL }))
        }
      }
    })

    this._content.title = this.sidebarItems[0]?.label ?? ''

    const lastItemId = Application.settings.get<string>('last-sidebar-item')
    const lastItemIndex = this.sidebarItems.findIndex(p => p.id === lastItemId)
    const lastItem = this.sidebarItems[Math.max(lastItemIndex, 0)]
    const itemRow = this._sidebarList.get_row_at_index(Math.max(0, lastItemIndex))

    this.selectedPlatform = getPlatform(lastItemId as PlatformId)?.id ?? null
    this._sidebarList.select_row(itemRow)
    this.onSidebarRowSelected(lastItem.id ?? this.sidebarItems[0].id)

    this._sidebarList.connect('row-selected', (_source, row) => {
      if (row) {
        this.onSidebarRowSelected((row as SidebarItem).id)
      }
    })
  }

  private initViewOptions() {
    const saved = Application.settings.get<boolean>('show-grid')

    if (!saved) {
      this.onShowList()
    }

    this._viewAndSort.connect('clicked', () => this.onChangeView())

    // Building up here as Blueprint doesn't support targets yet.
    const items = [
      { label: _!('A–Z'), value: 'title_asc' },
      { label: _!('Z–A'), value: 'title_desc' },
      { label: _!('Developer A–Z'), value: 'developer_asc' },
      { label: _!('Developer Z–A'), value: 'developer_desc' },
      { label: _!('Platform A–Z'), value: 'platform_asc' },
      { label: _!('Platform Z–A'), value: 'platform_desc' },
      { label: _!('Last modification'), value: 'modification_desc' },
      { label: _!('First modification'), value: 'modification_asc' },
      { label: _!('Last release'), value: 'year_desc' },
      { label: _!('First release'), value: 'year_asc' },
    ]

    const viewOptionsMenu = new Gio.Menu()
    const sortMenu = new Gio.Menu()

    for (const item of items) {
      const menuItem = Gio.MenuItem.new(item.label, 'jogos.change-sort')
      menuItem.set_action_and_target_value('jogos.change-sort', GLib.Variant.new_string(item.value))

      sortMenu.append_item(menuItem)
    }

    viewOptionsMenu.append_section(_!('Sort by'), sortMenu)
    this._viewAndSort.menuModel = viewOptionsMenu
  }

  private updateSidebarItems() {
    const previous = this._sidebarList.get_selected_row() as SidebarItem | null
    const previousId = previous?.id

    this.sidebarItems = [...this.pinnedSidebarItems]

    const existingPlatforms = GamesRepository.instance.listPlatforms()

    for (const platform of existingPlatforms) {
      this.sidebarItems.push({
        id: platform.id,
        label: platform.name,
        iconName: platform.iconName,
        section: 'platform'
      })
    }

    this._sidebarList.remove_all()

    for (const item of this.sidebarItems) {
      this._sidebarList.append(new SidebarItem(item))
    }

    if (previousId) {
      const previousSelectionIdx = this.sidebarItems.findIndex(s => s.id === previousId)
      const rowToSelect = this._sidebarList.get_row_at_index(Math.max(previousSelectionIdx, 0))

      this._sidebarList.select_row(rowToSelect)
    }
  }

  private onChangeView() {
    const showGrid = Application.settings.get<boolean>('show-grid')

    if (showGrid) {
      this.onShowList()
    } else {
      this.onShowGrid()
    }
  }

  private onShowList() {
    this._gamesView.showList()
    this._viewAndSort.iconName = 'lucide-layout-grid-symbolic'
    this._viewAndSort.tooltipText = _!('View in grid')
    Application.settings.setValue('show-grid', false)
  }

  private onShowGrid() {
    this._gamesView.showGrid()
    this._viewAndSort.iconName = 'lucide-layout-list-symbolic'
    this._viewAndSort.tooltipText = _!('View in list')
    Application.settings.setValue('show-grid', true)
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

  private onSearchChanged() {
    this._stack.visibleChildName = Stack.LOADING

    const terms = this._searchEntry.text
    this.isSearching = terms.length > 0

    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      this._gamesView.search(terms)

      if (this.isSearching && this._gamesView.filterModel.nItems === 0) {
        this._stack.visibleChildName = Stack.NO_RESULTS
      } else {
        this._stack.visibleChildName = Stack.GAMES_VIEW
      }

      return GLib.SOURCE_REMOVE
    })
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

  private changeState(
    newState: WindowState,
    options: { platform?: PlatformId | null, selectRow?: boolean } = { platform: null, selectRow: false }
  ) {
    this.state = newState
    this.selectedPlatform = newState === WindowState.PLATFORM ? (options.platform ?? null) : null

    const stateMap: Partial<Record<WindowState, string>> = {
      [WindowState.ALL_GAMES]: 'ALL_GAMES',
      [WindowState.FAVORITES]: 'FAVORITES',
      [WindowState.RECENTS]: 'RECENTS',
      [WindowState.WISHLIST]: 'WISHLIST'
    }

    if (this.state === WindowState.PLATFORM) {
      this._gamesView.hideColumn('platform')
      this._gamesView.showColumn('developer')
    } else {
      this._gamesView.showColumn('platform')
      this._gamesView.hideColumn('developer')
    }

    if (options.selectRow) {
      const lookingId = stateMap[newState] ?? options.platform
      const index = this.sidebarItems.findIndex(s => s.id === lookingId)
      const row = this._sidebarList.get_row_at_index(Math.max(index, 0))

      this._sidebarList.select_row(row)
    }

    if (this.state === WindowState.RECENTS) {
      this._gamesView.sortBy('modification_date_desc')
    } else {
      this._gamesView.sortBy('title_asc')
    }
  }

  private loadGames() {
    this._stack.visibleChildName = Stack.LOADING

    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      if (this.state === WindowState.ALL_GAMES) {
        this.showAllGames()
      } else if (this.state === WindowState.FAVORITES) {
        this.showFavorites()
      } else if (this.state === WindowState.RECENTS) {
        this.showRecents()
      } else if (this.state === WindowState.WISHLIST) {
        this.showWishlist()
      } else if (this.state === WindowState.PLATFORM) {
        this.showPlatform()
      }

      return GLib.SOURCE_REMOVE
    })

  }

  private async showAllGames() {
    const games = await GamesRepository.instance.list()
    this._gamesView.model.splice(0, this._gamesView.model.nItems, games)
    this._gamesView.unselect()

    if (this.isSearching && this._gamesView.filterModel.nItems === 0) {
      this._stack.visibleChildName = Stack.NO_RESULTS
    } else {
      this._stack.visibleChildName = games.length === 0 ? Stack.NO_GAMES : Stack.GAMES_VIEW
    }
  }

  private async showFavorites() {
    const games = await GamesRepository.instance.listFavorites()
    this._gamesView.model.splice(0, this._gamesView.model.nItems, games)
    this._gamesView.unselect()

    if (this.isSearching && this._gamesView.filterModel.nItems === 0) {
      this._stack.visibleChildName = Stack.NO_RESULTS
    } else {
      this._stack.visibleChildName = games.length === 0 ? Stack.NO_FAVORITES : Stack.GAMES_VIEW
    }
  }

  private async showRecents() {
    const games = await GamesRepository.instance.listRecents()
    this._gamesView.model.splice(0, this._gamesView.model.nItems, games)
    this._gamesView.unselect()

    if (this.isSearching && this._gamesView.filterModel.nItems === 0) {
      this._stack.visibleChildName = Stack.NO_RESULTS
    } else {
      this._stack.visibleChildName = games.length === 0 ? Stack.NO_GAMES : Stack.GAMES_VIEW
    }
  }

  private async showWishlist() {
    const games = await GamesRepository.instance.listWishlist()
    this._gamesView.model.splice(0, this._gamesView.model.nItems, games)
    this._gamesView.unselect()

    if (this.isSearching && this._gamesView.filterModel.nItems === 0) {
      this._stack.visibleChildName = Stack.NO_RESULTS
    } else {
      this._stack.visibleChildName = games.length === 0 ? Stack.NO_WISHLIST : Stack.GAMES_VIEW
    }
  }

  private async showPlatform() {
    if (!this.selectedPlatform) {
      return
    }

    const games = await GamesRepository.instance.listByPlatform(this.selectedPlatform)
    this._gamesView.model.splice(0, this._gamesView.model.nItems, games)
    this._gamesView.unselect()
    this._noGamesForPlatform.iconName = getPlatform(this.selectedPlatform).iconName

    if (this.isSearching && this._gamesView.filterModel.nItems === 0) {
      this._stack.visibleChildName = Stack.NO_RESULTS
    } else {
      this._stack.visibleChildName = games.length === 0 ? Stack.NO_GAMES_IN_PLATFORM : Stack.GAMES_VIEW
    }
  }

  private onSidebarRowSelected(itemId: string) {
    const item = this.sidebarItems.find(item => item.id === itemId)

    if (!item) {
      return
    }

    Application.settings.setValue('last-sidebar-item', itemId)

    this._content.set_title(item.label)

    if (itemId === 'ALL_GAMES') {
      this.changeState(WindowState.ALL_GAMES)
    } else if (itemId === 'FAVORITES') {
      this.changeState(WindowState.FAVORITES)
    } else if (itemId === 'WISHLIST') {
      this.changeState(WindowState.WISHLIST)
    } else if (itemId === 'RECENTS') {
      this.changeState(WindowState.RECENTS)
    } else {
      this.changeState(WindowState.PLATFORM, { platform: itemId as PlatformId })
    }

    this.loadGames()

    if (this._splitView.collapsed) {
      this._splitView.showContent = true
    }

  }

  private onChangeSortAction(sort: SortProperty) {
    this._gamesView.sortBy(sort)
  }

  private onCreateNewGameAction() {
    const selected = this._sidebarList.get_selected_row()?.get_index() ?? 0
    const platform = selected >= 4
      ? this.sidebarItems[selected].id as PlatformId
      : null

    const createGameDialog = new CreateGameDialog({
      defaultPlatform: platform,
      defaultWishlist: this.sidebarItems[selected].id === 'WISHLIST'
    })

    createGameDialog.connect('game-created', (_self, game: Game) => {
      // TODO: optimize the UI blocking
      this.updateSidebarItems()
      this.changeState(game.wishlist ? WindowState.WISHLIST : WindowState.PLATFORM, {
        platform: game.platform ,
        selectRow: true,
      })

      this.loadGames()
      // this._gamesView.clearSearch()
      this._gamesView.select(game)

      const toast = new Adw.Toast({
        title: _!('"%s" was created').format(game.title),
        timeout: 3,
      })

      this._toastOverlay.add_toast(toast)
    })

    createGameDialog.present(this)
  }

  private onGameEditAction(game: Game) {
    const editGameDialog = new EditGameDialog(game)

    editGameDialog.connect('game-updated', (_self, updatedGame: Game) => {
      // TODO: optimize the UI blocking
      this.updateSidebarItems()
      this.changeState(updatedGame.wishlist ? WindowState.WISHLIST : WindowState.PLATFORM, {
        platform: updatedGame.platform,
        selectRow: true,
      })

      this.loadGames()
      // this._gamesView.clearSearch()
      this._gamesView.select(updatedGame)

      const toast = new Adw.Toast({
        title: _!('"%s" was updated').format(updatedGame.title),
        timeout: 3,
      })

      this._toastOverlay.add_toast(toast)
    })

    editGameDialog.present(this)
  }

  private async onGameDeleteAction(game: Game) {
    const dialog = new Adw.AlertDialog({
      heading: _!('Delete this game?'),
      body: _!('After the deletion, it can not be recovered.'),
      close_response: 'cancel'
    })

    dialog.add_response('cancel', _!('Cancel'))
    dialog.add_response('delete', _!('Delete'))
    dialog.set_default_response('cancel')
    dialog.set_response_appearance('delete', Adw.ResponseAppearance.DESTRUCTIVE)

    // TODO: Remove the Promise cast when ts-for-gir fixes this.
    // https://github.com/gjsify/ts-for-gir/issues/171
    const response = await (dialog.choose(this.root, null) as unknown as Promise<string>)

    if (response === 'delete') {
      GamesRepository.instance.delete(game)

      // Handle the case where the game might be the last one on its platform.
      // In this case it's better to select the all games sidebar item.
      const platforms = GamesRepository.instance.listPlatforms()
      const platformHasGames = platforms.findIndex(p => p.id === game.platform) >= 0
      const selectedRow = this._sidebarList.get_selected_row() as SidebarItem

      this.updateSidebarItems()

      if (!platformHasGames && selectedRow.id === game.platform) {
        this.changeState(WindowState.ALL_GAMES, { selectRow: true })
      }

      this.loadGames()

      const toast = new Adw.Toast({
        title: _!('"%s" was deleted').format(game.title),
        timeout: 3,
      })

      this._toastOverlay.add_toast(toast)
    }

  }

  private onGameFavorited(game: Game) {
    GamesRepository.instance.toggleFavorite(game)
    const updatedGame = GamesRepository.instance.get(game.id)

    const [found, position] = this._gamesView.model.find(game)

    if (found && updatedGame) {
      this._gamesView.model.splice(position, 1, [updatedGame])
    }

    const toast = new Adw.Toast({
      title: _!('"%s" was added to the favorites').format(game.title),
      timeout: 3,
    })

    this._toastOverlay.add_toast(toast)
  }

  private onGameUnfavorited(game: Game) {
    GamesRepository.instance.toggleFavorite(game)
    const updatedGame = GamesRepository.instance.get(game.id)

    const [found, position] = this._gamesView.model.find(game)

    if (found && updatedGame) {
      if (this.state === WindowState.FAVORITES) {
        this._gamesView.model.remove(position)
      } else {
        this._gamesView.model.splice(position, 1, [updatedGame])
      }
    }

    // Handle the case where the game might be the last one in favorites.
    if (this.isSearching && this._gamesView.filterModel.nItems === 0) {
      this._stack.visibleChildName = Stack.NO_RESULTS
    } else if (this._gamesView.model.nItems === 0) {
      this._stack.visibleChildName = Stack.NO_FAVORITES
    }

    const toast = new Adw.Toast({
      title: _!('"%s" was removed from favorites').format(game.title),
      timeout: 3,
    })

    this._toastOverlay.add_toast(toast)
  }
}
