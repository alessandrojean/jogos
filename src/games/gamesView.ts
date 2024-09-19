import Gio from 'gi://Gio'
import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk?version=4.0'

import { Application } from '../application.js'
import Game from '../model/game.js'
import { getPlatform, platformName } from '../model/platform.js'
import { localeOptions, LocaleOptions } from '../utils/locale.js'
import { ContextMenuBin } from '../widgets/contextMenuBin.js'
import { GameGridItem } from './gameGridItem.js'
import { GameTitleColumn } from './gameTitleColumn.js'

type ColumnId = 'title' | 'year' | 'platform' | 'developer' | 'modification' | 'favorite'

export type SortProperty = 'title_asc' | 'title_desc'
  | 'modification_date_desc' | 'modification_date_asc'
  | 'platform_asc' | 'platform_desc'
  | 'developer_asc' | 'developer_desc'
  | 'year_asc' | 'year_desc'

export class GamesView extends Gtk.Stack {
  private _items!: Gtk.ScrolledWindow
  private _grid!: Gtk.ScrolledWindow

  private _columnView!: Gtk.ColumnView
  private _titleColumn!: Gtk.ColumnViewColumn
  private _platformColumn!: Gtk.ColumnViewColumn
  private _developerColumn!: Gtk.ColumnViewColumn
  private _yearColumn!: Gtk.ColumnViewColumn
  private _modificationColumn!: Gtk.ColumnViewColumn
  private _favoriteColumn!: Gtk.ColumnViewColumn

  private _gridView!: Gtk.GridView

  private dataModel!: Gio.ListStore<Game>
  private titleFilter!: Gtk.StringFilter

  private viewGrid = true
  private locale!: LocaleOptions
  private menuModel!: Gio.Menu
  private selectionModel!: Gtk.SingleSelection<Game>

  static {
    GObject.registerClass({
      GTypeName: 'GamesView',
      Template: 'resource:///io/github/alessandrojean/jogos/ui/games-view.ui',
      InternalChildren: [
        'items', 'columnView',
        'titleColumn', 'platformColumn', 'developerColumn', 'yearColumn',
        'grid', 'gridView',
        'modificationColumn', 'favoriteColumn',
      ],
      Properties: {
        // @ts-expect-error
        dataModel: GObject.ParamSpec.object('data-model', '', '', GObject.ParamFlags.READWRITE, Gio.ListStore.$gtype),
      },
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
        },
        'context-menu': {
          param_types: [Game.$gtype]
        }
      }
    }, this)
  }

  constructor() {
    super()

    this.initLocale()
    this.initMenuModel()
    this.initActions()
    this.initCommon()
    this.initColumnView()
    this.initGridView()
  }

  private initLocale() {
    this.locale = localeOptions()

    Application.settings.connect('changed', () => {
      this.locale = localeOptions()
    })
  }

  private initMenuModel() {
    this.menuModel = new Gio.Menu()

    const section1 = new Gio.Menu()
    const section2 = new Gio.Menu()

    section1.append_item(Gio.MenuItem.new(_!('De_tails'), 'games.details'))
    section2.append_item(Gio.MenuItem.new(_!('_Edit'), 'games.edit'))
    section2.append_item(Gio.MenuItem.new(_!('_Delete'), 'games.delete'))

    this.menuModel.append_section(null, section1)
    this.menuModel.append_section(null, section2)
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
  }

  private initCommon() {
    this.titleFilter = new Gtk.StringFilter({
      expression: Gtk.PropertyExpression.new(Game.$gtype, null, 'title'),
      ignoreCase: true,
      matchMode: Gtk.StringFilterMatchMode.SUBSTRING,
    })

    this.dataModel = new Gio.ListStore({ itemType: Game.$gtype })

    this.selectionModel = new Gtk.SingleSelection({
      model: new Gtk.FilterListModel({
        filter: this.titleFilter,
        model: new Gtk.SortListModel({
          model: this.dataModel,
          sorter: this._columnView.sorter,
        })
      })
    })
  }

  private initColumnView() {
    this._titleColumn.sorter = new Gtk.StringSorter({
      expression: Gtk.PropertyExpression.new(Game.$gtype, null, 'title'),
    })

    this._platformColumn.sorter = new Gtk.StringSorter({
      expression: Gtk.PropertyExpression.new(Game.$gtype, null, 'platform'),
    })

    this._developerColumn.sorter = new Gtk.StringSorter({
      expression: Gtk.PropertyExpression.new(Game.$gtype, null, 'developer'),
    })

    this._yearColumn.sorter = new Gtk.NumericSorter({
      expression: Gtk.PropertyExpression.new(Game.$gtype, null, 'release-year')
    })

    this._modificationColumn.sorter = new Gtk.NumericSorter({
      expression: Gtk.PropertyExpression.new(Game.$gtype, null, 'modification-date'),
    })

    // Factories

    const factoryTitle = this._titleColumn.factory as Gtk.SignalListItemFactory

    factoryTitle.connect('setup', (_self, listItem: Gtk.ColumnViewCell) => {
      const title = new GameTitleColumn({
        title: '',
        cover: null,
        menuModel: this.menuModel,
      })

      title.connect('setup-menu', () => this.onSetupMenu(listItem))

      listItem.child = title
    })

    factoryTitle.connect('bind', (_self, listItem: Gtk.ColumnViewCell) => {
      const title = listItem.get_child() as GameTitleColumn
      const modelItem = listItem.get_item<Game>()

      title.title = modelItem.title
      title.cover = modelItem.cover
      title.platformIconName = getPlatform(modelItem.platform).iconName
    })

    const factoryPlatform = this._platformColumn.factory as Gtk.SignalListItemFactory

    factoryPlatform.connect('setup', (_self, listItem: Gtk.ColumnViewCell) => {
      const label = new Gtk.Label({
        label: '',
        xalign: 0.0,
        cssClasses: ['dim-label']
      })

      const contextMenuBin = new ContextMenuBin({ menuModel: this.menuModel })
      contextMenuBin.connect('setup-menu', () => this.onSetupMenu(listItem))
      contextMenuBin.child = label

      listItem.child = contextMenuBin
    })

    factoryPlatform.connect('bind', (_self, listItem: Gtk.ColumnViewCell) => {
      const label = (listItem.get_child() as ContextMenuBin).get_child() as Gtk.Label
      const modelItem = listItem.get_item<Game>()

      label.label = platformName(modelItem.platform)
    })

    const factoryDeveloper = this._developerColumn.factory as Gtk.SignalListItemFactory

    factoryDeveloper.connect('setup', (_self, listItem: Gtk.ColumnViewCell) => {
      const label = new Gtk.Label({
        label: '',
        xalign: 0.0,
        cssClasses: ['dim-label']
      })

      const contextMenuBin = new ContextMenuBin({ menuModel: this.menuModel })
      contextMenuBin.connect('setup-menu', () => this.onSetupMenu(listItem))
      contextMenuBin.child = label

      listItem.child = contextMenuBin
    })

    factoryDeveloper.connect('bind', (_self, listItem: Gtk.ColumnViewCell) => {
      const label = (listItem.get_child() as ContextMenuBin).get_child() as Gtk.Label
      const modelItem = listItem.get_item<Game>()

      label.label = modelItem.developer
    })

    const factoryYear = this._yearColumn.factory as Gtk.SignalListItemFactory

    factoryYear.connect('setup', (_self, listItem: Gtk.ColumnViewCell) => {
      const label = new Gtk.Label({
        label: '',
        xalign: 1.0,
        cssClasses: ['dim-label', 'numeric']
      })

      const contextMenuBin = new ContextMenuBin({ menuModel: this.menuModel })
      contextMenuBin.connect('setup-menu', () => this.onSetupMenu(listItem))
      contextMenuBin.child = label

      listItem.child = contextMenuBin
    })

    factoryYear.connect('bind', (_self, listItem: Gtk.ColumnViewCell) => {
      const label = (listItem.get_child() as ContextMenuBin).get_child() as Gtk.Label
      const modelItem = listItem.get_item<Game>()

      label.label = modelItem.releaseYear.toString()
    })

    const factoryModification = this._modificationColumn.factory as Gtk.SignalListItemFactory

    factoryModification.connect('setup', (_self, listItem: Gtk.ColumnViewCell) => {
      const label = new Gtk.Label({
        label: '',
        xalign: 1.0,
        cssClasses: ['dim-label', 'numeric']
      })

      const contextMenuBin = new ContextMenuBin({ menuModel: this.menuModel })
      contextMenuBin.connect('setup-menu', () => this.onSetupMenu(listItem))
      contextMenuBin.child = label

      listItem.child = contextMenuBin
    })

    factoryModification.connect('bind', (_self, listItem: Gtk.ColumnViewCell) => {
      const label = (listItem.get_child() as ContextMenuBin).get_child() as Gtk.Label
      const modelItem = listItem.get_item<Game>()

      label.label = modelItem.modifiedAtDateTime.format(this.locale.dateFormat) ?? _!('Unknown')
    })

    const factoryFavorite = this._favoriteColumn.factory as Gtk.SignalListItemFactory

    factoryFavorite.connect('setup', (_self, listItem: Gtk.ColumnViewCell) => {
      const button = new Gtk.Button({
        iconName: 'lucide-star-symbolic',
        cssClasses: ['flat', 'circular', 'dim-label', 'star']
      })

      const contextMenuBin = new ContextMenuBin({ menuModel: this.menuModel })
      contextMenuBin.connect('setup-menu', () => this.onSetupMenu(listItem))
      contextMenuBin.child = button

      listItem.child = contextMenuBin
    })

    factoryFavorite.connect('bind', (_self, listItem: Gtk.ColumnViewCell) => {
      const button = (listItem.get_child() as ContextMenuBin).get_child() as Gtk.Button
      const modelItem = listItem.get_item<Game>()

      button.connect('clicked', () => this.onFavoriteClicked(modelItem))

      button.iconName = modelItem.favorite ? 'lucide-star-solid-symbolic' : 'lucide-star-symbolic'
      button.tooltipText = modelItem.favorite ? _!('Unfavorite') : _!('Favorite')
    })

    this._columnView.model = this.selectionModel

    this._columnView.connect('activate', (self, position) => {
      const item = self.model.get_item(position) as Game
      this.emit('game-activate', item)
    })

    this._columnView.sorter.connect('changed', (sorter: Gtk.ColumnViewSorter) => {
      this.onColumnViewSortChanged(sorter)
    })
  }

  private initGridView() {
    const factory = this._gridView.factory as Gtk.SignalListItemFactory

    factory.connect('setup', (_self, listItem: Gtk.ListItem) => {
      const gridItem = new GameGridItem({
        title: '',
        cover: null,
        menuModel: this.menuModel,
      })

      gridItem.connect('setup-menu', () => this.onSetupMenu(listItem))

      listItem.child = gridItem
    })

    factory.connect('bind', (_self, listItem: Gtk.ListItem) => {
      const gridItem = listItem.get_child() as GameGridItem
      const modelItem = listItem.get_item<Game>()

      gridItem.title = modelItem.title
      gridItem.cover = modelItem.cover
      gridItem.platformIconName = getPlatform(modelItem.platform).iconName
    })

    this._gridView.model = this.selectionModel

    this._gridView.connect('activate', (self, position) => {
      const item = self.model.get_item(position) as Game
      this.emit('game-activate', item)
    })
  }

  search(terms: string) {
    this.titleFilter.search = terms
  }

  clearSearch() {
    this.titleFilter.search = ''
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

  hideColumn(columnId: ColumnId) {
    if (columnId === 'platform') {
      this._platformColumn.visible = false
    } else if (columnId === 'developer') {
      this._developerColumn.visible = false
    }
  }

  showColumn(columnId: ColumnId) {
    if (columnId === 'platform') {
      this._platformColumn.visible = true
    } else if (columnId === 'developer') {
      this._developerColumn.visible = true
    }
  }

  select(game: Game) {
    // Doing the search manually as find_with_equal_func is not working.
    let position = -1

    for (let i = 0; i < this.selectionModel.nItems; i++) {
      if (this.selectionModel.get_item(i)?.id === game.id) {
        position = i
        break
      }
    }

    if (position >= 0 && position < this.selectionModel.nItems) {
      this.selectionModel.set_selected(position)

      if (this.viewGrid) {
        this._gridView.scroll_to(position, Gtk.ListScrollFlags.NONE, null)
      } else {
        this._columnView.scroll_to(position, null, Gtk.ListScrollFlags.NONE, null)
      }
    }
  }

  unselect() {
    this.selectionModel.unselect_all()
  }

  sortBy(sortProperty: SortProperty | null) {
    if (!sortProperty) {
      this._columnView.sort_by_column(null, Gtk.SortType.ASCENDING)
      return
    }

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

  private onFavoriteClicked(game: Game) {
    this.emit(game.favorite ? 'game-unfavorited' : 'game-favorited', game)
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

  private onSetupMenu(listItem: Gtk.ListItem) {
    const item = listItem.get_item<Game>()
    this.emit('context-menu', item)
    this.select(item)
  }

  private onDetailsAction() {
    const game = this.selectionModel.get_selected_item<Game>()
    this.emit('game-activate', game)
  }

  private onEditAction() {
    const game = this.selectionModel.get_selected_item<Game>()
    this.emit('game-edit', game)
  }

  private onDeleteAction() {
    const game = this.selectionModel.get_selected_item<Game>()
    this.emit('game-delete', game)
  }

  get model() {
    return this.dataModel
  }

  get filterModel() {
    return this.selectionModel
  }
}
