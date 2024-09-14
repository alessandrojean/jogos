import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import { coversDirectory } from '../application.js'

export default async function convertCover(coverFile: Gio.File, gameId: number) {
  try {
    const finalCoverPath = GLib.build_filenamev([coversDirectory, `${gameId}.jpg`])
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
