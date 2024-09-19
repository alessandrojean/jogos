import Gda from 'gi://Gda'
import GLib from 'gi://GLib'
import Game from '../model/game.js'
import { getPlatform, Platform, PlatformId } from '../model/platform.js'
import { Database } from './database.js'

export default class GamesRepository {
  private database!: Database
  private static _instance: GamesRepository

  private constructor(database: Database) {
    this.database = database
  }

  static get instance(): GamesRepository {
    if (!GamesRepository._instance) {
      GamesRepository._instance = new GamesRepository(Database.instance)
    }

    return GamesRepository._instance
  }

  count() {
    const request = this.database.connection.execute_select_command(/* sql */`
      SELECT COUNT(id) FROM game;
    `)

    return request.get_value_at(0, 0) as any as number ?? 0
  }

  lastId() {
    const request = this.database.connection.execute_select_command(/* sql */`
      SELECT MAX(id) from game;
    `)

    return request.get_value_at(0, 0) as any as number ?? 1
  }

  async list() {
    const request = this.database.connection.execute_select_command(/* sql */`
      SELECT * FROM game WHERE wishlist = 0 ORDER BY title ASC;
    `)

    const a = Gda.SqlBuilder.new(Gda.SqlStatementType.SELECT)


    const iterator = request.create_iter()
    const games: Game[] = []

    while (iterator.move_next()) {
      games.push(Game.fromIterator(iterator))
    }

    return games
  }

  async listByPlatform(platform: PlatformId) {
    const [statement, params] = this.database.connection.parse_sql_string(/* sql */`
      SELECT * FROM game WHERE platform = ##platform::string AND wishlist = 0 ORDER BY title;
    `)

    // @ts-ignore
    params!.get_holder('platform').set_value(platform)

    const request = this.database.connection.statement_execute_select(statement, params)

    const iterator = request.create_iter()
    const games: Game[] = []

    while (iterator.move_next()) {
      games.push(Game.fromIterator(iterator))
    }

    return games
  }

  async listFavorites() {
    const request = this.database.connection.execute_select_command(/* sql */`
      SELECT * FROM game WHERE favorite = 1 ORDER BY title ASC;
    `)

    const iterator = request.create_iter()
    const games: Game[] = []

    while (iterator.move_next()) {
      games.push(Game.fromIterator(iterator))
    }

    return games
  }

  async listWishlist() {
    const request = this.database.connection.execute_select_command(/* sql */`
      SELECT * FROM game WHERE wishlist = 1 ORDER BY title ASC;
    `)

    const iterator = request.create_iter()
    const games: Game[] = []

    while (iterator.move_next()) {
      games.push(Game.fromIterator(iterator))
    }

    return games
  }

  async listRecents() {
    const request = this.database.connection.execute_select_command(/* sql */`
      SELECT * FROM game WHERE wishlist = 0 ORDER BY updated_at DESC LIMIT 30;
    `)

    const iterator = request.create_iter()
    const games: Game[] = []

    while (iterator.move_next()) {
      games.push(Game.fromIterator(iterator))
    }

    return games
  }

  listPlatforms() {
    const request = this.database.connection.execute_select_command(/* sql */`
      SELECT DISTINCT platform FROM game WHERE wishlist = 0;
    `)

    const iterator = request.create_iter()
    const platforms: Platform[] = []

    while (iterator.move_next()) {
      const id = iterator.get_value_for_field('platform') as unknown as PlatformId
      const platform = getPlatform(id)

      platforms.push(platform)
    }

    // Sort here as some consoles like NES have different names depending
    // on the region and translation. Sorting by id would be inaccurate.

    return platforms.sort((a, b) => a.name.localeCompare(b.name))
  }

  get(id: number) {
    const [statement, params] = this.database.connection.parse_sql_string(/* sql */`
      SELECT * FROM game WHERE id = ##id::gint;
    `)

    // @ts-expect-error
    params!.get_holder('id').set_value(id)

    const request = this.database.connection.statement_execute_select(statement, params)

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

    this.database.connection.statement_execute_non_select(builder.get_statement(), null)

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

    this.database.connection.statement_execute_non_select(builder.get_statement(), null)
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

    this.database.connection.statement_execute_non_select(builder.get_statement(), null)
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

    this.database.connection.statement_execute_non_select(builder.get_statement(), null)

    const cover = game.cover

    if (cover.query_exists(null)) {
      cover.delete(null)
    }
  }
}

