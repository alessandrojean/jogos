import Adw from 'gi://Adw'
import GdkPixbuf from 'gi://GdkPixbuf'
import Gio from 'gi://Gio'
import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk?version=4.0'
import Pango from 'gi://Pango'

import Game, { platformName } from '../model/game.js'

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
  private filter!: Gtk.EveryFilter
  private platformFilter!: Gtk.StringFilter
  private titleFilter!: Gtk.StringFilter
  private favoriteFilter!: Gtk.BoolFilter
  private filterModel!: Gtk.FilterListModel

  private viewGrid = true

  static {
    GObject.registerClass({
      GTypeName: 'GamesWidget',
      Template: 'resource:///org/jogos/Jogos/ui/games.ui',
      InternalChildren: [
        'items', 'noResultsFound', 'noGamesForPlatform', 'columnView',
        'titleColumn', 'platformColumn', 'developerColumn', 'yearColumn',
        'noGames', 'grid', 'gridView',
      ]
    }, this)
  }

  constructor() {
    super()

    this.initCommon()
    this.initColumnView()
    this.initGridView()
  }

  private initCommon() {
    this.platformFilter = new Gtk.StringFilter({
      expression: Gtk.PropertyExpression.new(Game.$gtype, null, 'platform'),
      matchMode: Gtk.StringFilterMatchMode.EXACT,
    })

    this.titleFilter = new Gtk.StringFilter({
      expression: Gtk.PropertyExpression.new(Game.$gtype, null, 'title'),
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

    this.dataModel = new Gio.ListStore({ itemType: Game.$gtype })
    this.dataModel.splice(0, 0, [
      new Game({
        id: 1,
        title: 'Detroit Become Human',
        developer: 'Quanticdream',
        publisher: '',
        releaseYear: 2018,
        barcode: '',
        platform: 'PLAYSTATION_4',
        story: '',
        certification: ''
      }),
      new Game({
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
        favorite: true,
      }),
      new Game({
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
      }),
      new Game({
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
      }),
      new Game({
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

    factoryTitle.connect('setup', (_self, listItem: Gtk.ListItem) => {
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

      listItem.set_child(box)
    })

    factoryTitle.connect('bind', (_self, listItem: Gtk.ListItem) => {
      const box = listItem.get_child() as Gtk.Box
      const picture = box.get_first_child() as Gtk.Picture
      const label = box.get_last_child() as Gtk.Label
      const modelItem = listItem.get_item<Game>()
      label.label = modelItem.title

      const cover = modelItem.coverFile

      if (cover) {
        picture.set_pixbuf(GdkPixbuf.Pixbuf.new_from_file(cover))
      }
    })

    const factoryPlatform = this._platformColumn.factory as Gtk.SignalListItemFactory

    factoryPlatform.connect('setup', (_self, listItem: Gtk.ListItem) => {
      const label = new Gtk.Label({
        label: '',
        xalign: 0.0,
        cssClasses: ['dim-label']
      })
      listItem.set_child(label)
    })

    factoryPlatform.connect('bind', (_self, listItem: Gtk.ListItem) => {
      const label = listItem.get_child() as Gtk.Label
      const modelItem = listItem.get_item<Game>()
      label.label = platformName(modelItem.platform)
    })

    const factoryDeveloper = this._developerColumn.factory as Gtk.SignalListItemFactory

    factoryDeveloper.connect('setup', (_self, listItem: Gtk.ListItem) => {
      const label = new Gtk.Label({
        label: '',
        xalign: 0.0,
        cssClasses: ['dim-label']
      })
      listItem.set_child(label)
    })

    factoryDeveloper.connect('bind', (_self, listItem: Gtk.ListItem) => {
      const label = listItem.get_child() as Gtk.Label
      const modelItem = listItem.get_item<Game>()
      label.label = modelItem.developer
    })

    const factoryYear = this._yearColumn.factory as Gtk.SignalListItemFactory

    factoryYear.connect('setup', (_self, listItem: Gtk.ListItem) => {
      const label = new Gtk.Label({
        label: '',
        xalign: 0.0,
        cssClasses: ['dim-label']
      })
      listItem.set_child(label)
    })

    factoryYear.connect('bind', (_self, listItem: Gtk.ListItem) => {
      const label = listItem.get_child() as Gtk.Label
      const modelItem = listItem.get_item<Game>()
      label.label = modelItem.releaseYear.toString()
    })

    const sortModel = new Gtk.SortListModel({
      model: this.dataModel,
      sorter: this._columnView.sorter,
    })

    this.filterModel = new Gtk.FilterListModel({
      model: sortModel,
      filter: this.filter,
    })

    this._columnView.model = new Gtk.SingleSelection({
      model: this.filterModel,
    })
  }

  private initGridView() {
    const factory = this._gridView.factory as Gtk.SignalListItemFactory

    factory.connect('setup', (_self, listItem: Gtk.ListItem) => {
      const listBox = new Gtk.Box({
        spacing: 8,
        orientation: Gtk.Orientation.VERTICAL,
        widthRequest: 104,
      })
      const image = new Gtk.Picture({
        widthRequest: 96,
        // heightRequest: 144,
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

      listItem.set_child(listBox)
    })

    factory.connect('bind', (_self, listItem: Gtk.ListItem) => {
      const listBox = listItem.get_child() as Gtk.Box
      const modelItem = listItem.get_item<Game>()

      const image = listBox.get_first_child() as Gtk.Picture
      const label = listBox.get_last_child() as Gtk.Label

      label.label = modelItem.title

      const cover = modelItem.coverFile

      if (cover) {
        // image.set_from_file(cover)
        image.set_pixbuf(GdkPixbuf.Pixbuf.new_from_file(cover))
      }

    })

    this._gridView.model = new Gtk.SingleSelection({ model: this.filterModel })
  }

  showFavorites() {
    this.selectPlatform(null)
    this.favoriteFilter.expression = Gtk.PropertyExpression.new(Game.$gtype, null, 'favorite')
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
}
