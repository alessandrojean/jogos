import Gda from 'gi://Gda'
import { appDirectory, Application } from '../application.js'

export class Database {
  private static _instance: Database
  private EXPECTED_VERSION = 3 as const

  connection!: Gda.Connection

  private constructor() {}

  static get instance(): Database {
    if (!Database._instance) {
      Database._instance = new Database()
    }

    return Database._instance
  }

  connect() {
    this.connection = new Gda.Connection({
      provider: Gda.Config.get_provider('SQLite'),
      cncString: `DB_DIR=${appDirectory};DB_NAME=jogos`,
    })

    console.log(`Using database from ${appDirectory}/jogos.db`)

    this.connection.open()

    this.createTables()
    this.runMigrations()
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

  private runMigrations() {
    const databaseVersion = Application.settings.databaseVersion

    if (databaseVersion === this.EXPECTED_VERSION) {
      return
    }

    if (databaseVersion === 1) {
      this.connection.execute_non_select_command(/* sql */`
        ALTER TABLE game ADD COLUMN igdb_id INTEGER DEFAULT NULL;
      `)
    }

    if (databaseVersion === 2) {
      this.connection.execute_non_select_command(/* sql */`
        ALTER TABLE game DROP COLUMN igdb_id;
      `)

      this.connection.execute_non_select_command(/* sql */`
        ALTER TABLE game ADD COLUMN igdb_slug TEXT DEFAULT NULL;
      `)
    }

    Application.settings.databaseVersion = this.EXPECTED_VERSION
  }
}
