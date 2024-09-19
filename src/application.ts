import Adw from 'gi://Adw'
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk?version=4.0'

import Soup from 'gi://Soup'
import { GameGridItem } from './games/gameGridItem.js'
import { GamesView } from './games/gamesView.js'
import { IgdbApi } from './igdb/api.js'
import { Database } from './repositories/database.js'
import { Settings } from './settings.js'
import { createFolder } from './utils/createFolder.js'
import { debugInfo } from './utils/debugInfo.js'
import { ContextMenuBin } from './widgets/contextMenuBin.js'
import { PreferencesDialog } from './widgets/preferencesDialog.js'
import { SidebarItem } from './widgets/sidebarItem.js'
import { Window } from './window.js'

export const appDirectory = GLib.build_filenamev([GLib.get_user_data_dir(), 'jogos'])
export const coversDirectory = GLib.build_filenamev([appDirectory, 'covers'])

export class Application extends Adw.Application {
  private window?: Window

  static settings: Settings
  static igdb: IgdbApi

  static {
    GObject.registerClass(this)
  }

  constructor() {
    super({
      application_id: 'io.github.alessandrojean.jogos',
      flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
    })

    this.initDataFolders()
    this.initActions()
    this.initAboutDialog()

    Gio._promisify(Gtk.UriLauncher.prototype, 'launch', 'launch_finish')
    Gio._promisify(Adw.AlertDialog.prototype, 'choose', 'choose_finish')
    Gio._promisify(Gtk.FileDialog.prototype, 'open', 'open_finish')
    Gio._promisify(Gio.Subprocess.prototype, 'communicate_utf8_async')
    Gio._promisify(Gio.Subprocess.prototype, 'wait_async')
    Gio._promisify(Soup.Session.prototype, 'send_and_read_async', 'send_and_read_finish')

    Application.settings = new Settings({ schema: pkg.name })
    Application.igdb = new IgdbApi(Application.settings)

    Database.instance.connect()
  }

  public vfunc_startup(): void {
    super.vfunc_startup()

    GObject.type_ensure(GamesView.$gtype)
    GObject.type_ensure(SidebarItem.$gtype)
    GObject.type_ensure(ContextMenuBin.$gtype)
    GObject.type_ensure(GameGridItem.$gtype)
  }

  // When overriding virtual functions, the function name must be `vfunc_$funcname`.
  public vfunc_activate(): void {
    if (!this.window) {
      this.window = new Window({ application: this })
    }

    this.window.present()
  }

  public vfunc_shutdown(): void {
    this.window?.run_dispose()
    this.window = undefined

    Database.instance.disconnect()

    super.vfunc_shutdown()
  }

  private initActions() {
    const quitAction = new Gio.SimpleAction({ name: 'quit' })
    quitAction.connect('activate', () => this.quit())
    this.add_action(quitAction)

    const preferencesAction = new Gio.SimpleAction({ name: 'preferences' })
    preferencesAction.connect('activate', () => this.onPreferencesAction())
    this.add_action(preferencesAction)

    this.set_accels_for_action('app.quit', ['<Control>q'])
    this.set_accels_for_action('app.preferences', ['<Control>comma'])
  }

  private initAboutDialog() {
    const show_about_action = new Gio.SimpleAction({ name: 'about' })

    show_about_action.connect('activate', () => {
      const aboutDialog = new Adw.AboutDialog({
        applicationName: _!('Jogos'),
        applicationIcon: 'io.github.alessandrojean.jogos',
        developerName: 'Alessandro Jean',
        version: '0.1',
        developers: ['Alessandro Jean https://alessandrojean.github.io'],
        copyright: '© 2024 Alessandro Jean',
        website: 'https://alessandrojean.github.io/jogos',
        issueUrl: 'https://github.com/alessandrojean/jogos/issues/new/choose',
        licenseType: Gtk.License.GPL_3_0,
        debugInfo: debugInfo(appDirectory),
      })

      aboutDialog.add_link(_!('Sponsor'), 'https://github.com/sponsors/alessandrojean')

      aboutDialog.add_credit_section(_!('Icons'), [
        'Lucide https://lucide.dev',
        'Highscore https://gitlab.gnome.org/World/highscore',
        'Simple Icons https://simpleicons.org',
      ])

      aboutDialog.add_acknowledgement_section(_!('Inspiration'), [
        'GNOME Highscore https://gitlab.gnome.org/World/highscore'
      ])

      aboutDialog.present(this.active_window)
    })

    this.add_action(show_about_action)
  }

  private initDataFolders() {
    createFolder(appDirectory)
    createFolder(coversDirectory)
  }

  private onPreferencesAction() {
    const preferencesDialog = new PreferencesDialog()
    preferencesDialog.present(this.window)
  }
}
