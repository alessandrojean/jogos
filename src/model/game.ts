import GLib from 'gi://GLib'
import GObject from 'gi://GObject'
import Gio from 'gi://Gio'

export type GamePlatform = 'PLAYSTATION_4' | 'PLAYSTATION_5' | 'XBOX_SERIES'
  | 'NINTENDO_3DS' | 'NINTENDO_SWITCH' | 'PLAYSTATION_VITA' | 'NINTENDO_WII_U'
  | 'XBOX_ONE' | 'NINTENDO_DS' | 'PSP' | 'PLAYSTATION_3' | 'NINTENDO_WII'
  | 'XBOX_360' | 'DREAMCAST' | 'GAME_BOY_ADVANCE' | 'GAMECUBE' | 'PLAYSTATION_2'
  | 'XBOX' | 'GAME_BOY_COLOR' | 'NINTENDO_64' | 'PLAYSTATION' | 'SATURN'
  | 'GAME_BOY' | 'MEGA_DRIVE' | 'SUPER_NINTENDO' | 'MASTER_SYSTEM' | 'NES'
  | 'ATARI_2600' | 'PC'

export type StorageMedia = 'CARTRIDGE' | 'CD' | 'DVD' | 'BLURAY'

export default class Game extends GObject.Object {
  id!: number
  title!: string
  developer!: string
  publisher!: string
  releaseYear!: number
  barcode?: string
  platform!: GamePlatform
  story!: string
  certification!: string
  storageMedia!: StorageMedia
  favorite: boolean = false

  static {
    GObject.registerClass({
      Properties: {
        id: GObject.ParamSpec.int64(
          'id',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          Number.MIN_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
          0,
        ),
        title: GObject.ParamSpec.string(
          'title',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          ''
        ),
        developer: GObject.ParamSpec.string(
          'developer',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          ''
        ),
        publisher: GObject.ParamSpec.string(
          'publisher',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          ''
        ),
        releaseYear: GObject.ParamSpec.int64(
          'release-year',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          Number.MIN_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
          0,
        ),
        barcode: GObject.ParamSpec.string(
          'barcode',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          ''
        ),
        platform: GObject.ParamSpec.string(
          'platform',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          ''
        ),
        story: GObject.ParamSpec.string(
          'story',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          ''
        ),
        certification: GObject.ParamSpec.string(
          'certification',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          ''
        ),
        favorite: GObject.ParamSpec.boolean(
          'favorite',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          false,
        )
      }
    }, this)
  }

  constructor(params: Partial<Game>) {
    super()
    Object.assign(this, params)
  }

  get coverFile(): string | null {
    const fileUri = GLib.build_filenamev([
      GLib.get_home_dir(), '.jogos', 'covers', `${this.id}.jpg`
    ])
    const file = Gio.File.new_for_path(fileUri)
    const exists = file.query_exists(null)
    const isFile = file.query_file_type(Gio.FileQueryInfoFlags.NONE, null) === Gio.FileType.REGULAR

    return (exists && isFile) ? fileUri : null
  }
}

const platformNames: Record<GamePlatform, string> = {
  'PLAYSTATION_4': 'PlayStation 4',
  'PLAYSTATION_5': 'PlayStation 5',
  'XBOX_SERIES': 'Xbox Series',
  'NINTENDO_3DS': 'Nintendo 3DS',
  'NINTENDO_SWITCH': 'Nintendo Switch',
  'PLAYSTATION_VITA': 'PlayStation Vita',
  'NINTENDO_WII_U': 'Nintendo Wii U',
  'XBOX_ONE': 'Xbox One',
  'NINTENDO_DS': 'Nintendo DS',
  'PSP': 'PSP',
  'PLAYSTATION_3': 'PlayStation 3',
  'NINTENDO_WII': 'Nintendo Wii',
  'XBOX_360': 'Xbox 360',
  'DREAMCAST': 'Dreamcast',
  'GAME_BOY_ADVANCE': 'Game Boy Advance',
  'GAMECUBE': 'GameCube',
  'PLAYSTATION_2': 'PlayStation 2',
  'XBOX': 'Xbox',
  'GAME_BOY_COLOR': 'Game Boy Color',
  'NINTENDO_64': 'Nintendo 64',
  'PLAYSTATION': 'PlayStation',
  'SATURN': 'Saturn',
  'GAME_BOY': 'Game Boy',
  'MEGA_DRIVE': 'Mega Drive',
  'SUPER_NINTENDO': 'Super Nintendo',
  'MASTER_SYSTEM': 'Master System',
  'NES': 'NES',
  'ATARI_2600': 'Atari 2600',
  'PC': 'PC',
}

export function platformName(id: GamePlatform): string {
  return platformNames[id]
}
