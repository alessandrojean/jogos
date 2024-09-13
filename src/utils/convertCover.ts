import Gio from 'gi://Gio'
import GLib from 'gi://GLib'

// @ts-ignore
Gio._promisify(Gio.Subprocess.prototype, 'wait_async')

export default async function convertCover(coverFile: Gio.File, gameId: number) {
  try {
    const finalCoverPath = GLib.build_filenamev([GLib.get_home_dir(), '.jogos', 'covers', `${gameId}.jpg`])
    const coverPath = coverFile.get_path()

    if (!coverPath) {
      return
    }

    const magick = Gio.Subprocess.new(
      ['magick', coverPath, finalCoverPath],
      Gio.SubprocessFlags.NONE,
    )

    await magick.wait_async(null)
  } catch (e: any) {
    console.error(e)
  }
}
