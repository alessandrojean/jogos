import GObject from 'gi://GObject'

export type PlatformId = 'PLAYSTATION_4' | 'PLAYSTATION_5' | 'XBOX_SERIES'
  | 'NINTENDO_3DS' | 'NINTENDO_SWITCH' | 'PLAYSTATION_VITA' | 'NINTENDO_WII_U'
  | 'XBOX_ONE' | 'NINTENDO_DS' | 'PSP' | 'PLAYSTATION_3' | 'NINTENDO_WII'
  | 'XBOX_360' | 'DREAMCAST' | 'GAME_BOY_ADVANCE' | 'GAMECUBE' | 'PLAYSTATION_2'
  | 'XBOX' | 'GAME_BOY_COLOR' | 'NINTENDO_64' | 'PLAYSTATION' | 'SATURN'
  | 'GAME_BOY' | 'MEGA_DRIVE' | 'SUPER_NINTENDO' | 'MASTER_SYSTEM' | 'NES'
  | 'ATARI_2600' | 'WINDOWS' | 'MAC_OS' | 'ATARI_7800' | 'ATARI_JAGUAR'

export class Platform extends GObject.Object {
  id!: PlatformId
  name!: string
  generation!: number
  iconName!: string

  static {
    GObject.registerClass({
      Properties: {
        id: GObject.ParamSpec.string(
          'id',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          ''
        ),
        name: GObject.ParamSpec.string(
          'name',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          ''
        ),
        generation: GObject.ParamSpec.int64(
          'generation',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          Number.MIN_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
          0,
        ),
        iconName: GObject.ParamSpec.string(
          'icon-name',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          ''
        )
      }
    }, this)
  }

  constructor(params: Partial<Platform>) {
    super()
    Object.assign(this, params)
  }
}

export const platforms: Platform[] = [
  new Platform({ id: 'MAC_OS', name: 'macOS', iconName: 'mac-os', generation: -1 }),
  new Platform({ id: 'WINDOWS', name: 'Windows', iconName: 'windows', generation: -1 }),

  new Platform({ id: 'PLAYSTATION_5', name: 'PlayStation 5', iconName: 'playstation', generation: 9 }),
  new Platform({ id: 'XBOX_SERIES', name: 'Xbox Series', iconName: 'xbox', generation: 9 }),

  new Platform({ id: 'NINTENDO_3DS', name: 'Nintendo 3DS', iconName: 'nintendo-3ds', generation: 8 }),
  new Platform({ id: 'NINTENDO_SWITCH', name: 'Nintendo Switch', iconName: 'nintendo-switch', generation: 8 }),
  new Platform({ id: 'NINTENDO_WII_U', name: 'Nintendo Wii U', iconName: 'wii-u', generation: 8 }),
  new Platform({ id: 'PLAYSTATION_4', name: 'PlayStation 4', iconName: 'playstation', generation: 8 }),
  new Platform({ id: 'PLAYSTATION_VITA', name: 'PlayStation Vita', iconName: 'playstation', generation: 8 }),
  new Platform({ id: 'XBOX_ONE', name: 'Xbox One', iconName: 'xbox', generation: 8 }),

  new Platform({ id: 'NINTENDO_DS', name: 'Nintendo DS', iconName: 'nintendo-ds', generation: 7 }),
  new Platform({ id: 'NINTENDO_WII', name: 'Nintendo Wii', iconName: 'wii', generation: 7 }),
  new Platform({ id: 'PLAYSTATION_3', name: 'PlayStation 3', iconName: 'playstation', generation: 7 }),
  new Platform({ id: 'PSP', name: 'PSP', iconName: 'playstation', generation: 7 }),
  new Platform({ id: 'XBOX_360', name: 'Xbox 360', iconName: 'xbox', generation: 7 }),

  new Platform({ id: 'DREAMCAST', name: 'Dreamcast', iconName: 'dreamcast', generation: 6 }),
  new Platform({ id: 'GAME_BOY_ADVANCE', name: 'Game Boy Advance', iconName: 'nintendo-game-boy-advance', generation: 6 }),
  new Platform({ id: 'GAMECUBE', name: 'GameCube', iconName: 'gamecube', generation: 6 }),
  new Platform({ id: 'PLAYSTATION_2', name: 'PlayStation 2', iconName: 'playstation', generation: 6 }),
  new Platform({ id: 'XBOX', name: 'Xbox', iconName: 'xbox', generation: 6 }),

  new Platform({ id: 'ATARI_JAGUAR', name: 'Atari Jaguar', iconName: 'atari-jaguar', generation: 5 }),
  new Platform({ id: 'GAME_BOY_COLOR', name: 'Game Boy Color', iconName: 'nintendo-game-boy', generation: 5 }),
  new Platform({ id: 'NINTENDO_64', name: 'Nintendo 64', iconName: 'nintendo-64', generation: 5 }),
  new Platform({ id: 'PLAYSTATION', name: 'PlayStation', iconName: 'playstation', generation: 5 }),
  new Platform({ id: 'SATURN', name: 'Saturn', iconName: 'sega-saturn', generation: 5 }),

  new Platform({ id: 'GAME_BOY', name: 'Game Boy', iconName: 'nintendo-game-boy', generation: 4 }),
  new Platform({ id: 'MEGA_DRIVE', name: 'Mega Drive', iconName: 'sega-mega-drive', generation: 4 }),
  new Platform({ id: 'SUPER_NINTENDO', name: 'Super Nintendo', iconName: 'snes', generation: 4 }),

  new Platform({ id: 'ATARI_7800', name: 'Atari 7800', iconName: 'atari', generation: 3 }),
  new Platform({ id: 'MASTER_SYSTEM', name: 'Master System', iconName: 'sega-master-system', generation: 3 }),
  new Platform({ id: 'NES', name: 'NES', iconName: 'nes', generation: 3 }),

  new Platform({ id: 'ATARI_2600', name: 'Atari 2600', iconName: 'atari', generation: 2 }),
]

const platformMap = Object.fromEntries(platforms.map(p => [p.id, p])) as Record<PlatformId, Platform>

export function getPlatform(id: PlatformId) {
  return platformMap[id]
}

export function platformName(id: PlatformId): string {
  return getPlatform(id)?.name ?? _!('Unknown')
}

