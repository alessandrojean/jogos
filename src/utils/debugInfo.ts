import GLib from 'gi://GLib'

const container = GLib.getenv('container') ? 'Flatpak' : 'None'

export const debugInfo = (appDirectory: string) => `
App Version: ${pkg.version}
Container: ${container}
Data Directory: ${appDirectory}

System Name: ${GLib.get_os_info('PRETTY_NAME')}
System Version: ${GLib.get_os_info('VERSION')}
`.trim()
