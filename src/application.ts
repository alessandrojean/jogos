import Adw from 'gi://Adw'
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'
import Gtk from 'gi://Gtk?version=4.0'

import { Settings } from './settings.js'
import { createFolder } from './utils/createFolder.js'
import { GamesWidget } from './widgets/games.js'
import { SidebarItemWidget } from './widgets/sidebarItem.js'
import { Window } from './window.js'

export class Application extends Adw.Application {
  private window?: Window

  static settings: Settings

  static {
    GObject.registerClass(this)
  }

  constructor() {
    super({
      application_id: 'org.jogos.Jogos',
      flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
    })

    this.initActions()
    this.initAboutDialog()

    Gio._promisify(Gtk.UriLauncher.prototype, 'launch', 'launch_finish')

    Application.settings = new Settings({ schema: pkg.name })
  }

  public vfunc_startup(): void {
    super.vfunc_startup()

    this.initDataFolders()

    GObject.type_ensure(GamesWidget.$gtype)
    GObject.type_ensure(SidebarItemWidget.$gtype)
  }

  // When overriding virtual functions, the function name must be `vfunc_$funcname`.
  public vfunc_activate(): void {
    if (!this.window) {
      this.window = new Window({ application: this })
    }

    this.window.present()
  }

  private initActions() {
    const quit_action = new Gio.SimpleAction({ name: 'quit' })
    quit_action.connect('activate', () => {
      this.quit()
    })

    this.add_action(quit_action)
    this.set_accels_for_action('app.quit', ['<Control>q'])
  }

  private initAboutDialog() {
    const show_about_action = new Gio.SimpleAction({ name: 'about' })

    show_about_action.connect('activate', () => {
      const aboutDialog = new Adw.AboutDialog({
        applicationName: _('Jogos'),
        applicationIcon: 'org.jogos.Jogos',
        developerName: 'Alessandro Jean',
        version: '0.1',
        developers: ['Alessandro Jean https://alessandrojean.github.io'],
        copyright: '© 2024 Alessandro Jean',
        licenseType: Gtk.License.MIT_X11,
      })

      aboutDialog.present(this.active_window)
    })

    this.add_action(show_about_action)
  }

  private initDataFolders() {
    const homeDir = GLib.get_home_dir()
    const appFolderPath = GLib.build_filenamev([homeDir, '.jogos'])
    const coversFolderPath = GLib.build_filenamev([appFolderPath, 'covers'])

    createFolder(appFolderPath)
    createFolder(coversFolderPath)
  }
}
