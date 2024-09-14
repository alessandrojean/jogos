import Adw from 'gi://Adw'
import Gdk from 'gi://Gdk?version=4.0'
import Gio from 'gi://Gio'
import GObject from 'gi://GObject'
import Graphene from 'gi://Graphene'
import Gtk from 'gi://Gtk?version=4.0'

import Game from '../model/game.js'
import { getPlatform, PlatformId, platformName } from '../model/platform.js'
import GamesRepository from '../repositories/games.js'
import GameGridItemWidget from './gameGridItem.js'
import GameTitleColumnWidget from './gameTitleColumn.js'

export type SortProperty = 'title_asc' | 'title_desc'
  | 'modification_date_desc' | 'modification_date_asc'
  | 'platform_asc' | 'platform_desc'
  | 'developer_asc' | 'developer_desc'
  | 'year_asc' | 'year_desc'

export class GamesWidget extends Gtk.Stack {
  private _items!: Gtk.ScrolledWindow
  private _grid!: Gtk.ScrolledWindow
  private _noResultsFound!: Adw.StatusPage
  private _noGamesForPlatform!: Adw.StatusPage
  private _noGames!: Adw.StatusPage
  private _noFavorites!: Adw.StatusPage
  private _noWishlist!: Adw.StatusPage

  private _columnView!: Gtk.ColumnView
  private _titleColumn!: Gtk.ColumnViewColumn
  private _platformColumn!: Gtk.ColumnViewColumn
  private _developerColumn!: Gtk.ColumnViewColumn
  private _yearColumn!: Gtk.ColumnViewColumn
  private _modificationColumn!: Gtk.ColumnViewColumn
  private _favoriteColumn!: Gtk.ColumnViewColumn

  private _gridView!: Gtk.GridView

  private dataModel!: Gio.ListStore<GameItem>
  private sortModel!: Gtk.SortListModel<GameItem>
  private filterModel!: Gtk.FilterListModel<GameItem>
  private selectionModel!: Gtk.SingleSelection<GameItem>
  private filter!: Gtk.EveryFilter
  private platformFilter!: Gtk.StringFilter
  private titleFilter!: Gtk.StringFilter
  private favoriteFilter!: Gtk.BoolFilter
  private wishlistFilter!: Gtk.BoolFilter

  private _popoverMenu!: Gtk.PopoverMenu

  private viewGrid = true

  private isWishlist = Gtk.ClosureExpression.new(
    GObject.TYPE_BOOLEAN,
    (g: GameItem) => g.game.wishlist,
    null,
  )

  private isNotWishlist = Gtk.ClosureExpression.new(
    GObject.TYPE_BOOLEAN,
    (g: GameItem) => !g.game.wishlist,
    null,
  )

  static {
    GObject.registerClass({
      GTypeName: 'GamesWidget',
      Template: 'resource:///io/github/alessandrojean/jogos/ui/games.ui',
      InternalChildren: [
        'items', 'noResultsFound', 'noGamesForPlatform', 'columnView',
        'titleColumn', 'platformColumn', 'developerColumn', 'yearColumn',
        'noGames', 'grid', 'gridView', 'popoverMenu', 'noFavorites',
        'noWishlist', 'modificationColumn', 'favoriteColumn'
      ],
      Signals: {
        'game-activate': {
          param_types: [Game.$gtype],
        },
        'game-edit': {
          param_types: [Game.$gtype],
        },
        'game-delete': {
          param_types: [Game.$gtype],
        },
        'game-favorited': {
          param_types: [Game.$gtype],
        },
        'game-unfavorited': {
          param_types: [Game.$gtype],
        },
        'sort-changed': {
          param_types: [Gtk.StringObject.$gtype]
        }
      }
    }, this)
  }

  constructor() {
    super()

    this.initActions()
    this.initCommon()
    this.initColumnView()
    this.initGridView()
    this.loadItems()
  }

  private initActions() {
    const gamesGroup = new Gio.SimpleActionGroup()
    this.insert_action_group('games', gamesGroup)

    const detailsAction = new Gio.SimpleAction({ name: 'details' })
    detailsAction.connect('activate', () => this.onDetailsAction())
    gamesGroup.add_action(detailsAction)

    const editAction = new Gio.SimpleAction({ name: 'edit' })
    editAction.connect('activate', () => this.onEditAction())
    gamesGroup.add_action(editAction)

    const deleteAction = new Gio.SimpleAction({ name: 'delete' })
    deleteAction.connect('activate', () => this.onDeleteAction())
    gamesGroup.add_action(deleteAction)

    const popupMenuAction = new Gio.SimpleAction({ name: 'popup-menu' })
    popupMenuAction.connect('activate', () => this.onPopupMenuAction())
    gamesGroup.add_action(popupMenuAction)
  }

  private initCommon() {
    const gameExpression = Gtk.PropertyExpression.new(GameItem.$gtype, null, 'game')

    this.platformFilter = new Gtk.StringFilter({
      expression: Gtk.PropertyExpression.new(Game.$gtype, gameExpression, 'platform'),
      matchMode: Gtk.StringFilterMatchMode.EXACT,
    })

    this.titleFilter = new Gtk.StringFilter({
      expression: Gtk.PropertyExpression.new(Game.$gtype, gameExpression, 'title'),
      ignoreCase: true,
      matchMode: Gtk.StringFilterMatchMode.SUBSTRING,
    })

    this.favoriteFilter = new Gtk.BoolFilter({
      expression: Gtk.ConstantExpression.new_for_value(true),
    })

    this.wishlistFilter = new Gtk.BoolFilter({ expression: this.isNotWishlist })

    this.filter = new Gtk.EveryFilter()
    this.filter.append(this.platformFilter)
    this.filter.append(this.titleFilter)
    this.filter.append(this.favoriteFilter)
    this.filter.append(this.wishlistFilter)

    this.dataModel = new Gio.ListStore({ itemType: GameItem.$gtype })

    this.sortModel = new Gtk.SortListModel({
      model: this.dataModel,
      sorter: this._columnView.sorter,
    })

    this.filterModel = new Gtk.FilterListModel({
      model: this.sortModel,
      filter: this.filter,
    })

    this.selectionModel = new Gtk.SingleSelection({
      model: this.filterModel,
    })
  }

  private initColumnView() {
    const gameExpr = Gtk.PropertyExpression.new(GameItem.$gtype, null, 'game')

    this._titleColumn.sorter = new Gtk.StringSorter({
      expression: Gtk.PropertyExpression.new(Game.$gtype, gameExpr, 'title'),
    })

    this._platformColumn.sorter = new Gtk.StringSorter({
      expression: Gtk.PropertyExpression.new(Game.$gtype, gameExpr, 'platform'),
    })

    this._developerColumn.sorter = new Gtk.StringSorter({
      expression: Gtk.PropertyExpression.new(Game.$gtype, gameExpr, 'developer'),
    })

    this._yearColumn.sorter = new Gtk.NumericSorter({
      expression: Gtk.PropertyExpression.new(Game.$gtype, gameExpr, 'release-year')
    })

    this._modificationColumn.sorter = new Gtk.NumericSorter({
      expression: Gtk.PropertyExpression.new(Game.$gtype, gameExpr, 'modification-date'),
    })

    // Factories

    const factoryTitle = this._titleColumn.factory as Gtk.SignalListItemFactory

    factoryTitle.connect('setup', (_self, listItem: Gtk.ColumnViewCell) => {
      const title = new GameTitleColumnWidget({ title: '', cover: null })

      listItem.child = title
    })

    factoryTitle.connect('bind', (_self, listItem: Gtk.ColumnViewCell) => {
      const title = listItem.get_child() as GameTitleColumnWidget
      const modelItem = listItem.get_item<GameItem>()

      title.title = modelItem.game.title
      title.cover = modelItem.game.cover
      title.platformIconName = getPlatform(modelItem.game.platform).iconName

      this.setupCell(title, listItem)
      modelItem.listUi = title
    })

    factoryTitle.connect('unbind', (_self, listItem: Gtk.ColumnViewCell) => {
      const item = listItem.get_item<GameItem>()

      if (item != null) {
        item.listUi = null
      }
    })

    const factoryPlatform = this._platformColumn.factory as Gtk.SignalListItemFactory

    factoryPlatform.connect('setup', (_self, listItem: Gtk.ColumnViewCell) => {
      const label = new Gtk.Label({
        label: '',
        xalign: 0.0,
        cssClasses: ['dim-label']
      })
      this.setupCell(label, listItem)
      listItem.set_child(label)
    })

    factoryPlatform.connect('bind', (_self, listItem: Gtk.ColumnViewCell) => {
      const label = listItem.get_child() as Gtk.Label
      const modelItem = listItem.get_item<GameItem>()
      label.label = platformName(modelItem.game.platform)
    })

    const factoryDeveloper = this._developerColumn.factory as Gtk.SignalListItemFactory

    factoryDeveloper.connect('setup', (_self, listItem: Gtk.ColumnViewCell) => {
      const label = new Gtk.Label({
        label: '',
        xalign: 0.0,
        cssClasses: ['dim-label']
      })
      this.setupCell(label, listItem)
      listItem.set_child(label)
    })

    factoryDeveloper.connect('bind', (_self, listItem: Gtk.ColumnViewCell) => {
      const label = listItem.get_child() as Gtk.Label
      const modelItem = listItem.get_item<GameItem>()
      label.label = modelItem.game.developer
    })

    const factoryYear = this._yearColumn.factory as Gtk.SignalListItemFactory

    factoryYear.connect('setup', (_self, listItem: Gtk.ColumnViewCell) => {
      const label = new Gtk.Label({
        label: '',
        xalign: 1.0,
        cssClasses: ['dim-label', 'numeric']
      })
      this.setupCell(label, listItem)
      listItem.set_child(label)
    })

    factoryYear.connect('bind', (_self, listItem: Gtk.ColumnViewCell) => {
      const label = listItem.get_child() as Gtk.Label
      const modelItem = listItem.get_item<GameItem>()
      label.label = modelItem.game.releaseYear.toString()
    })

    const factoryModification = this._modificationColumn.factory as Gtk.SignalListItemFactory

    factoryModification.connect('setup', (_self, listItem: Gtk.ColumnViewCell) => {
      const label = new Gtk.Label({
        label: '',
        xalign: 1.0,
        cssClasses: ['dim-label', 'numeric']
      })
      this.setupCell(label, listItem)
      listItem.set_child(label)
    })

    factoryModification.connect('bind', (_self, listItem: Gtk.ColumnViewCell) => {
      const label = listItem.get_child() as Gtk.Label
      const modelItem = listItem.get_item<GameItem>()
      label.label = modelItem.game.modifiedAtDateTime.format(_('%d/%m/%Y')) ?? _('Unknown')
    })

    const factoryFavorite = this._favoriteColumn.factory as Gtk.SignalListItemFactory

    factoryFavorite.connect('setup', (_self, listItem: Gtk.ColumnViewCell) => {
      const button = new Gtk.Button({
        iconName: 'lucide-star-symbolic',
        cssClasses: ['flat', 'circular', 'dim-label', 'star']
      })

      this.setupCell(button, listItem)
      listItem.child = button
    })

    factoryFavorite.connect('bind', (_self, listItem: Gtk.ColumnViewCell) => {
      const button = listItem.get_child() as Gtk.Button
      const modelItem = listItem.get_item<GameItem>()

      button.connect('clicked', () => this.onFavoriteClicked(modelItem))

      button.iconName = modelItem.game.favorite ? 'lucide-star-solid-symbolic' : 'lucide-star-symbolic'
      button.tooltipText = modelItem.game.favorite ? _('Unfavorite') : _('Favorite')
    })

    this._columnView.model = this.selectionModel

    this._columnView.connect('activate', (self, position) => {
      const item = self.model.get_item(position) as GameItem
      this.emit('game-activate', item.game)
    })

    this._columnView.sorter.connect('changed', (sorter: Gtk.ColumnViewSorter) => {
      this.onColumnViewSortChanged(sorter)
    })
  }

  private initGridView() {
    const factory = this._gridView.factory as Gtk.SignalListItemFactory

    factory.connect('setup', (_self, listItem: Gtk.ListItem) => {
      const gridItem = new GameGridItemWidget({ title: '', cover: null })

      this.setupCell(gridItem, listItem)
      listItem.child = gridItem
    })

    factory.connect('bind', (_self, listItem: Gtk.ListItem) => {
      const gridItem = listItem.get_child() as GameGridItemWidget
      const modelItem = listItem.get_item<GameItem>()

      gridItem.title = modelItem.game.title
      gridItem.cover = modelItem.game.cover
      gridItem.platformIconName = getPlatform(modelItem.game.platform).iconName

      modelItem.gridUi = gridItem
    })

    factory.connect('unbind', (_self, listItem: Gtk.ListItem) => {
      const item = listItem.get_item<GameItem>()

      if (item != null) {
        item.gridUi = null
      }
    })

    this._gridView.model = this.selectionModel

    this._gridView.connect('activate', (self, position) => {
      const item = self.model.get_item(position) as GameItem
      this.emit('game-activate', item.game)
    })
  }

  loadItems() {
    const allGames = GamesRepository.instance.list()

    this.dataModel.splice(0, this.dataModel.nItems, allGames.map(game => new GameItem({ game })))
    this.changeVisibleChild()
  }

  showFavorites() {
    this.selectPlatform(null)
    this.favoriteFilter.expression = Gtk.ClosureExpression.new(
      GObject.TYPE_BOOLEAN,
      (g: GameItem) => g.game.favorite,
      null
    )

    this.changeVisibleChild()
  }

  showWishlist() {
    this.selectPlatform(null)
    this.wishlistFilter.expression = this.isWishlist
    this._favoriteColumn.visible = false

    this.changeVisibleChild()
  }

  selectPlatform(platform: Game['platform'] | null) {
    this.favoriteFilter.expression = Gtk.ConstantExpression.new_for_value(true)
    this.wishlistFilter.expression = this.isNotWishlist
    this.platformFilter.search = platform ?? ''
    this._platformColumn.visible = platform === null
    this._favoriteColumn.visible = true

    this.changeVisibleChild()
  }

  search(query: string) {
    this.titleFilter.search = query ?? ''
    this.changeVisibleChild()
  }

  showGrid() {
    this.viewGrid = true

    if (this.visibleChild === this._items) {
      this.visibleChild = this._grid
    }
  }

  showList() {
    this.viewGrid = false

    if (this.visibleChild === this._grid) {
      this.visibleChild = this._items
    }
  }

  selectGame(game: Game) {
    // Doing the search manually as find_with_equal_func is not working.
    let position = -1

    for (let i = 0; i < this.dataModel.nItems; i++) {
      if (this.dataModel.get_item(i)?.game.id === game.id) {
        position = i
        break
      }
    }

    if (position >= 0) {
      this.selectionModel.set_selected(position)

      if (this.viewGrid) {
        this._gridView.scroll_to(position, Gtk.ListScrollFlags.NONE, null)
      } else {
        this._columnView.scroll_to(position, null, Gtk.ListScrollFlags.NONE, null)
      }
    }
  }

  sortBy(sortProperty: SortProperty) {
    const [property, direction] = sortProperty.split('_')
    const sortType = direction === 'asc' ? Gtk.SortType.ASCENDING : Gtk.SortType.DESCENDING

    const map: Record<string, Gtk.ColumnViewColumn> = {
      title: this._titleColumn,
      developer: this._developerColumn,
      platform: this._platformColumn,
      modification: this._modificationColumn,
      year: this._yearColumn,
    }

    this._columnView.sort_by_column(null, sortType)
    this._columnView.sort_by_column(map[property] ?? null, sortType)
  }

  private setupCell(widget: Gtk.Widget, item: Gtk.ListItem) {
    const rightClickEvent = new Gtk.GestureClick({
      propagationPhase: Gtk.PropagationPhase.BUBBLE,
      button: Gdk.BUTTON_SECONDARY,
    })

    rightClickEvent.connect('pressed', (source, nPress, x, y) => {
      if (nPress === 1) {
        this.selectionModel.select_item(item.get_position(), true)

        const point = new Graphene.Point({ x, y })
        const [, targetPoint] = widget.compute_point(this._items, point)
        const position = new Gdk.Rectangle({ x: targetPoint.x, y: targetPoint.y })
        this._popoverMenu.pointingTo = position
        this._popoverMenu.popup()

        source.set_state(Gtk.EventSequenceState.CLAIMED)
      }
    })

    widget.add_controller(rightClickEvent)
  }

  private changeVisibleChild() {
    const query = this.titleFilter.search ?? ''
    const nItems = this.filterModel.get_n_items()
    const platform = this.platformFilter.search ?? ''
    const favorite = this.favoriteFilter.expression instanceof Gtk.ClosureExpression
    const wishlist = this.wishlistFilter.expression === this.isWishlist

    if (nItems === 0 && wishlist && query.length === 0) {
      this.visibleChild = this._noWishlist
    } else if (nItems === 0 && favorite && query.length === 0) {
      this.visibleChild = this._noFavorites
    } else if (nItems === 0 && platform.length === 0 && query.length === 0) {
      this.visibleChild = this._noGames
    } else if (nItems === 0 && platform.length > 0 && query.length === 0) {
      this.visibleChild = this._noGamesForPlatform
      this._noGamesForPlatform.iconName = getPlatform(platform as PlatformId).iconName
    } else if (nItems === 0) {
      this.visibleChild = this._noResultsFound
    } else {
      this.visibleChild = this.viewGrid ? this._grid : this._items
    }
  }

  private onFavoriteClicked(gameItem: GameItem) {
    GamesRepository.instance.toggleFavorite(gameItem.game)
    const updatedGame = GamesRepository.instance.get(gameItem.game.id)

    // this.loadItems()
    const [found, position] = this.dataModel.find(gameItem)

    if (found && updatedGame) {
      this.dataModel.splice(position, 1, [
        new GameItem({ game: updatedGame, listUi: gameItem.listUi, gridUi: gameItem.gridUi })
      ])

      this.changeVisibleChild()

      if (gameItem.game.favorite) {
        this.emit('game-unfavorited', updatedGame)
      } else {
        this.emit('game-favorited', updatedGame)
      }
    }
  }

  private onColumnViewSortChanged(sorter: Gtk.ColumnViewSorter) {
    const column = sorter.primarySortColumn
    const order = sorter.primarySortOrder === Gtk.SortType.ASCENDING ? 'asc' : 'desc'

    if (!column) {
      return
    }

    if (column === this._titleColumn) {
      this.emit('sort-changed', Gtk.StringObject.new(`title_${order}`))
    } else if (column === this._yearColumn) {
      this.emit('sort-changed', Gtk.StringObject.new(`year_${order}`))
    } else if (column === this._developerColumn) {
      this.emit('sort-changed', Gtk.StringObject.new(`developer_${order}`))
    } else if (column === this._platformColumn) {
      this.emit('sort-changed', Gtk.StringObject.new(`platform_${order}`))
    } else if (column === this._modificationColumn) {
      this.emit('sort-changed', Gtk.StringObject.new(`modification_${order}`))
    }
  }

  private onDetailsAction() {
    const gameItem = this.selectionModel.get_selected_item<GameItem>()
    this.emit('game-activate', gameItem.game)
  }

  private onEditAction() {
    const gameItem = this.selectionModel.get_selected_item<GameItem>()
    this.emit('game-edit', gameItem.game)
  }

  private async onDeleteAction() {
    const dialog = new Adw.AlertDialog({
      heading: _('Delete this game?'),
      body: _('After the deletion, it can not be recovered.'),
      close_response: 'cancel'
    })

    dialog.add_response('cancel', _('Cancel'))
    dialog.add_response('delete', _('Delete'))
    dialog.set_default_response('cancel')
    dialog.set_response_appearance('delete', Adw.ResponseAppearance.DESTRUCTIVE)

    const response = await dialog.choose(this.root, null)

    if (response === 'delete') {
      const gameItem = this.selectionModel.get_selected_item<GameItem>()
      this.emit('game-delete', gameItem.game)

      GamesRepository.instance.delete(gameItem.game)
      this.loadItems()
    }
  }

  private onPopupMenuAction() {
    const selectedItem = this.selectionModel.get_selected_item<GameItem>()
    const row = this.viewGrid ? selectedItem.gridUi : selectedItem.listUi

    if (!row) {
      return
    }

    const [, bounds] = row.compute_bounds(this._items)
    const bottomLeft = bounds.get_bottom_left()
    const position = new Gdk.Rectangle({
      x: bottomLeft.x,
      y: bottomLeft.y + 12
    })

    this._popoverMenu.pointingTo = position
    this._popoverMenu.popup()
    this._popoverMenu.grab_focus()
  }
}

/**
 * Used to hold the game and its UI item to show the context menu.
 *
 * Inspired by the Nautilus solution on this.
 */
class GameItem extends GObject.Object {
  game!: Game
  listUi: Gtk.Widget | null = null
  gridUi: Gtk.Widget | null = null

  static {
    GObject.registerClass({
      Properties: {
        game: GObject.ParamSpec.object(
          'game',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          Game.$gtype,
        ),
        listUi: GObject.ParamSpec.object(
          'list-ui',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          Gtk.Widget.$gtype,
        ),
        gridUi: GObject.ParamSpec.object(
          'grid-ui',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          Gtk.Widget.$gtype,
        )
      }
    }, this)
  }

  constructor(params: Partial<GameItem>) {
    super(params)

    this.game = params.game!
    this.listUi = params.listUi ?? null
    this.gridUi = params.gridUi ?? null
  }
}
