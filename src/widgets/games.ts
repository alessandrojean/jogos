import Adw from 'gi://Adw'
import Gdk from 'gi://Gdk?version=4.0'
import GdkPixbuf from 'gi://GdkPixbuf'
import Gio from 'gi://Gio'
import GObject from 'gi://GObject'
import Graphene from 'gi://Graphene'
import Gtk from 'gi://Gtk?version=4.0'
import Pango from 'gi://Pango'

import Game, { platformName } from '../model/game.js'

Gio._promisify(Adw.AlertDialog.prototype, 'choose', 'choose_finish')

export class GamesWidget extends Gtk.Stack {
  private _items!: Gtk.ScrolledWindow
  private _grid!: Gtk.ScrolledWindow
  private _noResultsFound!: Adw.StatusPage
  private _noGamesForPlatform!: Adw.StatusPage
  private _noGames!: Adw.StatusPage

  private _columnView!: Gtk.ColumnView
  private _titleColumn!: Gtk.ColumnViewColumn
  private _platformColumn!: Gtk.ColumnViewColumn
  private _developerColumn!: Gtk.ColumnViewColumn
  private _yearColumn!: Gtk.ColumnViewColumn

  private _gridView!: Gtk.GridView

  private dataModel!: Gio.ListStore
  private selectionModel!: Gtk.SingleSelection
  private filter!: Gtk.EveryFilter
  private platformFilter!: Gtk.StringFilter
  private titleFilter!: Gtk.StringFilter
  private favoriteFilter!: Gtk.BoolFilter
  private filterModel!: Gtk.FilterListModel

  private _popoverMenu!: Gtk.PopoverMenu

  private viewGrid = true

  static {
    GObject.registerClass({
      GTypeName: 'GamesWidget',
      Template: 'resource:///org/jogos/Jogos/ui/games.ui',
      InternalChildren: [
        'items', 'noResultsFound', 'noGamesForPlatform', 'columnView',
        'titleColumn', 'platformColumn', 'developerColumn', 'yearColumn',
        'noGames', 'grid', 'gridView', 'popoverMenu'
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
        }
      }
    }, this)

    Gtk.Widget.add_shortcut(
      new Gtk.Shortcut({
        action: new Gtk.NamedAction({ actionName: 'games.details' }),
        trigger: Gtk.ShortcutTrigger.parse_string('Return'),
      })
    )

    Gtk.Widget.add_shortcut(
      new Gtk.Shortcut({
        action: new Gtk.NamedAction({ actionName: 'games.edit' }),
        trigger: Gtk.ShortcutTrigger.parse_string('<Ctrl>e'),
      })
    )

    Gtk.Widget.add_shortcut(
      new Gtk.Shortcut({
        action: new Gtk.NamedAction({ actionName: 'games.delete' }),
        trigger: Gtk.ShortcutTrigger.parse_string('Delete'),
      })
    )

    Gtk.Widget.add_shortcut(
      new Gtk.Shortcut({
        action: new Gtk.NamedAction({ actionName: 'games.popup-menu' }),
        trigger: Gtk.ShortcutTrigger.parse_string('Menu|<Shift>F10')
      })
    )
  }

  constructor() {
    super()

    this.initActions()
    this.initCommon()
    this.initColumnView()
    this.initGridView()
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

    this.filter = new Gtk.EveryFilter()
    this.filter.append(this.platformFilter)
    this.filter.append(this.titleFilter)
    this.filter.append(this.favoriteFilter)

    this.dataModel = new Gio.ListStore({ itemType: GameItem.$gtype })
    this.dataModel.splice(0, 0, [
      new GameItem({
        game: new Game({
          id: 1,
          title: 'Detroit Become Human',
          developer: 'Quanticdream',
          publisher: '',
          releaseYear: 2018,
          barcode: '',
          platform: 'PLAYSTATION_4',
          story: '',
          certification: '',
          storageMedia: 'BLURAY',
          condition: 'CIB',
        }),
        listUi: null,
      }),
      new GameItem({
        game: new Game({
          id: 2,
          title: 'Ghost of Tsushima - Director\'s Cut',
          developer: 'Sucker Punch',
          publisher: '',
          releaseYear: 2020,
          barcode: '',
          platform: 'PLAYSTATION_4',
          story: '',
          certification: '',
          storageMedia: 'BLURAY',
          condition: 'CIB',
          favorite: true,
        }),
        listUi: null,
      }),
      new GameItem({
        game: new Game({
          id: 3,
          title: 'Grand Theft Auto V - Premium Edition',
          developer: 'Rockstar Games',
          publisher: '',
          releaseYear: 2013,
          barcode: '',
          platform: 'PLAYSTATION_4',
          story: '',
          certification: '',
          storageMedia: 'BLURAY',
          condition: 'CIB',
        }),
        listUi: null,
      }),
      new GameItem({
        game: new Game({
          id: 4,
          title: 'Hades',
          developer: 'Supergiant Games',
          publisher: '',
          releaseYear: 2020,
          barcode: '',
          platform: 'PLAYSTATION_4',
          story: '',
          certification: '',
          storageMedia: 'BLURAY',
          condition: 'CIB',
        }),
        listUi: null,
      }),
      new GameItem({
        game: new Game({
          id: 5,
          title: 'Life is Strange: Double Exposure',
          developer: 'Deck Nine',
          publisher: '',
          releaseYear: 2024,
          barcode: '',
          platform: 'PLAYSTATION_5',
          story: '',
          certification: '',
          storageMedia: 'BLURAY',
          favorite: true,
          condition: 'CIB',
        }),
        listUi: null,
      }),
    ])
  }

  private initColumnView() {
    this._titleColumn.sorter = new Gtk.StringSorter({
      expression: Gtk.PropertyExpression.new(Game.$gtype, null, 'title')
    })

    this._platformColumn.sorter = new Gtk.StringSorter({
      expression: Gtk.PropertyExpression.new(Game.$gtype, null, 'platform')
    })

    this._developerColumn.sorter = new Gtk.StringSorter({
      expression: Gtk.PropertyExpression.new(Game.$gtype, null, 'developer')
    })

    this._yearColumn.sorter = new Gtk.NumericSorter({
      expression: Gtk.PropertyExpression.new(Game.$gtype, null, 'release-year')
    })

    // Factories

    const factoryTitle = this._titleColumn.factory as Gtk.SignalListItemFactory

    factoryTitle.connect('setup', (_self, listItem: Gtk.ColumnViewCell) => {
      const box = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 12
      })
      const picture = new Gtk.Picture({
        widthRequest: 36,
        heightRequest: 36,
        contentFit: Gtk.ContentFit.COVER,
        cssClasses: ['thumbnail'],
      })
      const label = new Gtk.Label({ label: '', xalign: 0.0 })

      box.append(picture)
      box.append(label)

      this.setupCell(box, listItem)

      listItem.set_child(box)
    })

    factoryTitle.connect('bind', (_self, listItem: Gtk.ColumnViewCell) => {
      const box = listItem.get_child() as Gtk.Box
      const picture = box.get_first_child() as Gtk.Picture
      const label = box.get_last_child() as Gtk.Label
      const modelItem = listItem.get_item<GameItem>()
      label.label = modelItem.game.title

      const cover = modelItem.game.coverFile

      if (cover) {
        picture.set_pixbuf(GdkPixbuf.Pixbuf.new_from_file(cover))
      }

      modelItem.listUi = box
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
        xalign: 0.0,
        cssClasses: ['dim-label']
      })
      this.setupCell(label, listItem)
      listItem.set_child(label)
    })

    factoryYear.connect('bind', (_self, listItem: Gtk.ColumnViewCell) => {
      const label = listItem.get_child() as Gtk.Label
      const modelItem = listItem.get_item<GameItem>()
      label.label = modelItem.game.releaseYear.toString()

    })

    const sortModel = new Gtk.SortListModel({
      model: this.dataModel,
      sorter: this._columnView.sorter,
    })

    this.filterModel = new Gtk.FilterListModel({
      model: sortModel,
      filter: this.filter,
    })

    this.selectionModel = new Gtk.SingleSelection({
      model: this.filterModel,
    })

    this._columnView.model = this.selectionModel

    this._columnView.connect('activate', (_self, position) => {
      this.emit('game-activate', _self.model.get_item(position))
    })
  }

  private initGridView() {
    const factory = this._gridView.factory as Gtk.SignalListItemFactory

    factory.connect('setup', (_self, listItem: Gtk.ListItem) => {
      const listBox = new Gtk.Box({
        spacing: 8,
        orientation: Gtk.Orientation.VERTICAL,
        // widthRequest: 104,
        hexpand: true,
        vexpand: true,
      })
      const image = new Gtk.Picture({
        widthRequest: 96,
        // heightRequest: 144,
        hexpand: true,
        vexpand: true,
        canShrink: true,
        cssClasses: ['thumbnail'],
      })
      const label = new Gtk.Label({
        halign: Gtk.Align.CENTER,
        ellipsize: Pango.EllipsizeMode.END,
        singleLineMode: true,
      })

      listBox.append(image)
      listBox.append(label)

      this.setupCell(listBox, listItem)

      listItem.set_child(listBox)
    })

    factory.connect('bind', (_self, listItem: Gtk.ListItem) => {
      const listBox = listItem.get_child() as Gtk.Box
      const modelItem = listItem.get_item<GameItem>()

      const image = listBox.get_first_child() as Gtk.Picture
      const label = listBox.get_last_child() as Gtk.Label

      label.label = modelItem.game.title

      const cover = modelItem.game.coverFile

      if (cover) {
        // image.set_from_file(cover)
        image.set_pixbuf(GdkPixbuf.Pixbuf.new_from_file(cover))
      }

      modelItem.gridUi = listBox
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

  showFavorites() {
    this.selectPlatform(null)
    this.favoriteFilter.expression = Gtk.PropertyExpression.new(
      Game.$gtype,
      Gtk.PropertyExpression.new(GameItem.$gtype, null, 'game'),
      'favorite'
    )
  }

  selectPlatform(platform: Game['platform'] | null) {
    this.favoriteFilter.expression = Gtk.ConstantExpression.new_for_value(true)
    this.platformFilter.search = platform ?? ''
    this._platformColumn.visible = platform === null

    const nItems = this.filterModel.get_n_items()
    const search = this.titleFilter.search ?? ''

    if (nItems === 0 && search.length === 0 && !platform) {
      this.visibleChild = this._noGames
    } else if (nItems === 0 && search.length === 0) {
      this.visibleChild = this._noGamesForPlatform
    } else if (nItems === 0 && search.length > 0) {
      this.visibleChild = this._noResultsFound
    } else {
      this.visibleChild = this.viewGrid ? this._grid : this._items
    }
  }

  search(query: string) {
    this.titleFilter.search = query ?? ''

    const nItems = this.filterModel.get_n_items()
    const platform = this.platformFilter.search ?? ''

    if (nItems === 0 && platform.length === 0 && query.length === 0) {
      this.visibleChild = this._noGames
    } else if (nItems === 0 && query.length === 0) {
      this.visibleChild = this._noGamesForPlatform
    } else if (nItems === 0) {
      this.visibleChild = this._noResultsFound
    } else {
      this.visibleChild = this.viewGrid ? this._grid : this._items
    }
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

  private setupCell(widget: Gtk.Widget, item: Gtk.ListItem) {
    const rightClickEvent = new Gtk.GestureClick({ button: Gdk.BUTTON_SECONDARY })
    rightClickEvent.connect('pressed', (_source, _nPress, x, y) => {
      this.selectionModel.select_item(item.get_position(), true)

      const point = new Graphene.Point({ x, y })
      const [, targetPoint] = widget.compute_point(this._items, point)
      const position = new Gdk.Rectangle({ x: targetPoint.x, y: targetPoint.y })
      this._popoverMenu.pointingTo = position
      this._popoverMenu.popup()
    })
    widget.add_controller(rightClickEvent)
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
