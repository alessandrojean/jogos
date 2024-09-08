import Gio from 'gi://Gio'

export function createFolder(path: string) {
  const file = Gio.File.new_for_path(path)
  const exists = file.query_exists(null)
  const isDirectory = file.query_file_type(Gio.FileQueryInfoFlags.NONE, null) === Gio.FileType.DIRECTORY

  if (exists && isDirectory) {
    return
  }

  file.make_directory(null)
}
