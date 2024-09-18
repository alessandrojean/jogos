import GLib from 'gi://GLib'
import Gio from 'gi://Gio'
import Soup from 'gi://Soup'
import { coversDirectory } from '../application.js'

Gio._promisify(Gio.File.prototype, 'replace_contents_bytes_async', 'replace_contents_finish')

export async function convertCover(coverFile: Gio.File, gameId: number) {
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

export async function downloadCover(tmpFileName: string, coverUrl: string) {
  const tempFileName = GLib.build_filenamev([GLib.get_tmp_dir(), tmpFileName])
  const bytes = await getRemoteImageBytes(coverUrl)

  if (!bytes) {
    return null
  }

  try {
    const tempFile = Gio.File.new_for_path(tempFileName)

    // TODO: Remove the Promise cast when ts-for-gir fixes this.
    // https://github.com/gjsify/ts-for-gir/issues/171
    const [success] = await (tempFile.replace_contents_bytes_async(bytes, null, false, Gio.FileCreateFlags.NONE, null) as any as Promise<[boolean, string]>)

    return success ? tempFile : null
  } catch (e: any) {
    console.error(e)
    return null
  }

}

export async function getRemoteImageBytes(imageUrl: string) {
  try {
    const session = new Soup.Session()
    const message = new Soup.Message({
      method: 'GET',
      uri: GLib.Uri.parse(imageUrl, GLib.UriFlags.NONE)
    })

    // TODO: Remove the Promise cast when ts-for-gir fixes this.
    // https://github.com/gjsify/ts-for-gir/issues/171
    const bytes = await (session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null) as any as Promise<GLib.Bytes>)

    return message.get_status() === Soup.Status.OK ? bytes : null
  } catch (e: any) {
    console.error(e)
    return null
  }
}
