import Gda from 'gi://Gda?version=6.0'
import GLib from 'gi://GLib'
import Game from '../model/game.js'

export default class GamesRepository {
  private connection!: Gda.Connection
  private static _instance: GamesRepository

  private constructor() {}

  static get instance(): GamesRepository {
    if (!GamesRepository._instance) {
      GamesRepository._instance = new GamesRepository()
    }

    return GamesRepository._instance
  }

  connect() {
    const databasePath = GLib.build_filenamev([GLib.get_home_dir(), '.jogos'])

    this.connection = new Gda.Connection({
      provider: Gda.Config.get_provider('SQLite'),
      cncString: `DB_DIR=${databasePath};DB_NAME=jogos`,
    })

    this.connection.open()

    this.createTables()
  }

  disconnect() {
    this.connection.close()
  }

  private createTables() {
    this.connection.execute_non_select_command(/* sql */`
      CREATE TABLE IF NOT EXISTS game (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        developer TEXT NOT NULL,
        publisher TEXT NOT NULL,
        release_year INTEGER NOT NULL,
        barcode TEXT,
        platform TEXT NOT NULL,
        story TEXT NOT NULL,
        certification TEXT NOT NULL,
        storage_media TEXT NOT NULL,
        condition TEXT NOT NULL,
        favorite INTEGER NOT NULL DEFAULT 0,
        wishlist INTEGER NOT NULL DEFAULT 0,
        bought_at INTEGER DEFAULT NULL,
        store TEXT DEFAULT NULL,
        paid_price_currency TEXT NOT NULL,
        paid_price_amount REAL NOT NULL DEFAULT 0.0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `)
  }

  count() {
    const request = this.connection.execute_select_command(/* sql */`
      SELECT COUNT(id) FROM game;
    `)

    return request.get_value_at(0, 0) as any as number ?? 0
  }

  lastId() {
    const request = this.connection.execute_select_command(/* sql */`
      SELECT MAX(id) from game;
    `)

    return request.get_value_at(0, 0) as any as number ?? 1
  }

  list() {
    const request = this.connection.execute_select_command(/* sql */`
      SELECT * FROM game ORDER BY title ASC;
    `)

    const iterator = request.create_iter()
    const games: Game[] = []

    while (iterator.move_next()) {
      games.push(Game.fromIterator(iterator))
    }

    return games
  }

  get(id: number) {
    const request = this.connection.execute_select_command(/* sql */`
      SELECT * FROM game WHERE id = ${id};
    `)

    const iterator = request.create_iter()
    let game: Game | null = null

    while (iterator.move_next()) {
      game = Game.fromIterator(iterator)
    }

    return game
  }

  create(game: Game) {
    const now = GLib.DateTime.new_now_local().to_unix()

    const builder = new Gda.SqlBuilder({
      stmt_type: Gda.SqlStatementType.INSERT,
    })

    builder.set_table('game')
    builder.add_field_value_as_gvalue('title', game.title as any)
    builder.add_field_value_as_gvalue('developer', game.developer as any)
    builder.add_field_value_as_gvalue('publisher', game.publisher as any)
    builder.add_field_value_as_gvalue('release_year', game.releaseYear as any)
    builder.add_field_value_as_gvalue('barcode', game.barcode as any)
    builder.add_field_value_as_gvalue('platform', game.platform as any)
    builder.add_field_value_as_gvalue('story', game.story as any)
    builder.add_field_value_as_gvalue('certification', game.certification as any)
    builder.add_field_value_as_gvalue('storage_media', game.storageMedia as any)
    builder.add_field_value_as_gvalue('condition', game.condition as any)
    builder.add_field_value_as_gvalue('favorite', Number(game.favorite) as any)
    builder.add_field_value_as_gvalue('wishlist', Number(game.wishlist) as any)
    builder.add_field_value_as_gvalue('bought_at', game.boughtDate as any)
    builder.add_field_value_as_gvalue('store', game.store ?? Gda.value_new_null() as any)
    builder.add_field_value_as_gvalue('paid_price_currency', game.paidPriceCurrency as any)
    builder.add_field_value_as_gvalue('paid_price_amount', game.paidPriceAmount as any)
    builder.add_field_value_as_gvalue('created_at', now as any)
    builder.add_field_value_as_gvalue('updated_at', now as any)

    this.connection.statement_execute_non_select(builder.get_statement(), null)

    game.id = this.lastId()

    return game.id
  }

  toggleFavorite(game: Game) {
    const now = GLib.DateTime.new_now_local().to_unix()

    const builder = new Gda.SqlBuilder({
      stmt_type: Gda.SqlStatementType.UPDATE,
    })

    builder.set_table('game')
    builder.add_field_value_as_gvalue('favorite', !game.favorite as any)
    builder.add_field_value_as_gvalue('updated_at', now as any)

    builder.set_where(
      builder.add_cond(
        Gda.SqlOperatorType.EQ,
        builder.add_field_id('id', null),
        builder.add_expr_value(game.id as any),
        0
      )
    )

    this.connection.statement_execute_non_select(builder.get_statement(), null)
  }

  update(game: Game) {
    const now = GLib.DateTime.new_now_local().to_unix()

    const builder = new Gda.SqlBuilder({
      stmt_type: Gda.SqlStatementType.UPDATE,
    })

    builder.set_table('game')
    builder.add_field_value_as_gvalue('title', game.title as any)
    builder.add_field_value_as_gvalue('developer', game.developer as any)
    builder.add_field_value_as_gvalue('publisher', game.publisher as any)
    builder.add_field_value_as_gvalue('release_year', game.releaseYear as any)
    builder.add_field_value_as_gvalue('barcode', game.barcode as any)
    builder.add_field_value_as_gvalue('platform', game.platform as any)
    builder.add_field_value_as_gvalue('story', game.story as any)
    builder.add_field_value_as_gvalue('certification', game.certification as any)
    builder.add_field_value_as_gvalue('storage_media', game.storageMedia as any)
    builder.add_field_value_as_gvalue('condition', game.condition as any)
    builder.add_field_value_as_gvalue('favorite', Number(game.favorite) as any)
    builder.add_field_value_as_gvalue('wishlist', Number(game.wishlist) as any)
    builder.add_field_value_as_gvalue('bought_at', game.boughtDate as any)
    builder.add_field_value_as_gvalue('store', game.store ?? Gda.value_new_null() as any)
    builder.add_field_value_as_gvalue('paid_price_currency', game.paidPriceCurrency as any)
    builder.add_field_value_as_gvalue('paid_price_amount', game.paidPriceAmount as any)
    builder.add_field_value_as_gvalue('updated_at', now as any)

    builder.set_where(
      builder.add_cond(
        Gda.SqlOperatorType.EQ,
        builder.add_field_id('id', null),
        builder.add_expr_value(game.id as any),
        0
      )
    )

    this.connection.statement_execute_non_select(builder.get_statement(), null)
  }

  delete(game: Game) {
    const builder = new Gda.SqlBuilder({
      stmt_type: Gda.SqlStatementType.DELETE,
    })

    builder.set_table('game')

    builder.set_where(
      builder.add_cond(
        Gda.SqlOperatorType.EQ,
        builder.add_field_id('id', null),
        builder.add_expr_value(game.id as any),
        0
      )
    )

    this.connection.statement_execute_non_select(builder.get_statement(), null)

    const cover = game.cover

    if (cover.query_exists(null)) {
      cover.delete(null)
    }
  }
}

