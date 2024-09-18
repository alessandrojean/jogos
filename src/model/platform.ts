import GObject from 'gi://GObject'

export type PlatformId = 'PLAYSTATION_4' | 'PLAYSTATION_5' | 'XBOX_SERIES'
  | 'NINTENDO_3DS' | 'NINTENDO_SWITCH' | 'PLAYSTATION_VITA' | 'NINTENDO_WII_U'
  | 'XBOX_ONE' | 'NINTENDO_DS' | 'PSP' | 'PLAYSTATION_3' | 'NINTENDO_WII'
  | 'XBOX_360' | 'DREAMCAST' | 'GAME_BOY_ADVANCE' | 'GAMECUBE' | 'PLAYSTATION_2'
  | 'XBOX' | 'GAME_BOY_COLOR' | 'NINTENDO_64' | 'PLAYSTATION' | 'SATURN'
  | 'GAME_BOY' | 'MEGA_DRIVE' | 'SUPER_NINTENDO' | 'MASTER_SYSTEM' | 'NES'
  | 'ATARI_2600' | 'WINDOWS' | 'MAC_OS' | 'ATARI_7800' | 'ATARI_JAGUAR'
  | 'ATARI_LYNX' | 'GAME_GEAR' | 'NEO_GEO_POCKET' | 'PC_ENGINE' | 'SG_1000'
  | 'VIRTUAL_BOY' | 'WONDERSWAN' | 'APPLE_PIPPIN'

export class Platform extends GObject.Object {
  id!: PlatformId
  name!: string
  generation!: number
  iconName!: string
  igdbId!: number

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
        ),
        igdbId: GObject.ParamSpec.int64(
          'igdbId',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          Number.MIN_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
          0,
        )
      }
    }, this)
  }

  constructor(params: Partial<Platform>) {
    super()
    Object.assign(this, params)
  }
}

const platformsByGeneration: Platform[] = [
  new Platform({ id: 'MAC_OS', name: 'macOS', iconName: 'platform-mac-os-symbolic', generation: -1, igdbId: 14 }),
  new Platform({ id: 'WINDOWS', name: 'Windows', iconName: 'platform-windows-symbolic', generation: -1, igdbId: 6 }),

  new Platform({ id: 'PLAYSTATION_5', name: 'PlayStation 5', iconName: 'platform-playstation-5-symbolic', generation: 9, igdbId: 167 }),
  new Platform({ id: 'XBOX_SERIES', name: 'Xbox Series', iconName: 'platform-xbox-series-symbolic', generation: 9, igdbId: 169 }),

  new Platform({ id: 'NINTENDO_3DS', name: 'Nintendo 3DS', iconName: 'platform-nintendo-3ds-symbolic', generation: 8, igdbId: 37 }),
  new Platform({ id: 'NINTENDO_SWITCH', name: 'Nintendo Switch', iconName: 'platform-nintendo-switch-symbolic', generation: 8, igdbId: 130 }),
  new Platform({ id: 'NINTENDO_WII_U', name: 'Nintendo Wii U', iconName: 'platform-wii-u-symbolic', generation: 8, igdbId: 41 }),
  new Platform({ id: 'PLAYSTATION_4', name: 'PlayStation 4', iconName: 'platform-playstation-4-symbolic', generation: 8, igdbId: 48 }),
  new Platform({ id: 'PLAYSTATION_VITA', name: 'PS Vita', iconName: 'platform-playstation-vita-symbolic', generation: 8, igdbId: 46 }),
  new Platform({ id: 'XBOX_ONE', name: 'Xbox One', iconName: 'platform-xbox-one-symbolic', generation: 8, igdbId: 49 }),

  new Platform({ id: 'NINTENDO_DS', name: 'Nintendo DS', iconName: 'platform-nintendo-ds-symbolic', generation: 7, igdbId: 20 }),
  new Platform({ id: 'NINTENDO_WII', name: 'Nintendo Wii', iconName: 'platform-wii-symbolic', generation: 7, igdbId: 5 }),
  new Platform({ id: 'PLAYSTATION_3', name: 'PlayStation 3', iconName: 'platform-playstation-3-symbolic', generation: 7, igdbId: 9 }),
  new Platform({ id: 'PSP', name: 'PSP', iconName: 'platform-psp-symbolic', generation: 7, igdbId: 38 }),
  new Platform({ id: 'XBOX_360', name: 'Xbox 360', iconName: 'platform-xbox-360-symbolic', generation: 7, igdbId: 12 }),

  new Platform({ id: 'DREAMCAST', name: 'Dreamcast', iconName: 'platform-dreamcast-symbolic', generation: 6, igdbId: 23 }),
  new Platform({ id: 'GAME_BOY_ADVANCE', name: 'Game Boy Advance', iconName: 'platform-nintendo-game-boy-advance-symbolic', generation: 6, igdbId: 24 }),
  new Platform({ id: 'GAMECUBE', name: 'GameCube', iconName: 'platform-gamecube-symbolic', generation: 6, igdbId: 21 }),
  new Platform({ id: 'PLAYSTATION_2', name: 'PlayStation 2', iconName: 'platform-playstation-2-symbolic', generation: 6, igdbId: 8 }),
  new Platform({ id: 'WONDERSWAN', name: 'Wonderswan', iconName: 'platform-wonderswan-symbolic', generation: 6, igdbId: 57  }),
  new Platform({ id: 'XBOX', name: 'Xbox', iconName: 'platform-xbox-symbolic', generation: 6, igdbId: 11 }),

  new Platform({ id: 'APPLE_PIPPIN', name: 'Apple Pippin', iconName: 'platform-apple-pippin-symbolic', generation: 5, igdbId: 476 }),
  new Platform({ id: 'ATARI_JAGUAR', name: 'Atari Jaguar', iconName: 'platform-atari-jaguar-symbolic', generation: 5, igdbId: 62 }),
  new Platform({ id: 'GAME_BOY_COLOR', name: 'Game Boy Color', iconName: 'platform-nintendo-game-boy-symbolic', generation: 5, igdbId: 22 }),
  new Platform({ id: 'NEO_GEO_POCKET', name: 'Neo Geo Pocket', iconName: 'platform-neo-geo-pocket-symbolic', generation: 5, igdbId: 119 }),
  new Platform({ id: 'NINTENDO_64', name: 'Nintendo 64', iconName: 'platform-nintendo-64-symbolic', generation: 5, igdbId: 4 }),
  new Platform({ id: 'PLAYSTATION', name: 'PlayStation', iconName: 'platform-playstation-symbolic', generation: 5, igdbId: 7 }),
  new Platform({ id: 'SATURN', name: 'Saturn', iconName: 'platform-sega-saturn-symbolic', generation: 5, igdbId: 32 }),
  new Platform({ id: 'VIRTUAL_BOY', name: 'Virtual Boy', iconName: 'platform-nintendo-virtual-boy-symbolic', generation: 5, igdbId: 87 }),

  new Platform({ id: 'ATARI_LYNX', name: 'Atari Lynx', iconName: 'platform-atari-lynx-symbolic', generation: 4, igdbId: 61 }),
  new Platform({ id: 'GAME_BOY', name: 'Game Boy', iconName: 'platform-nintendo-game-boy-symbolic', generation: 4, igdbId: 33 }),
  new Platform({ id: 'GAME_GEAR', name: 'Game Gear', iconName: 'platform-sega-game-gear-symbolic', generation: 4, igdbId: 35 }),
  // Translators: Use 'Mega Drive' or 'Genesis' depending on the name adopted in the region.
  new Platform({ id: 'MEGA_DRIVE', name: _!('Mega Drive'), iconName: 'platform-sega-mega-drive-symbolic', generation: 4, igdbId: 29 }),
  // Translators: Use 'PC Engine' or 'TurboGrafx-16' depdning on the name adopted in the region.
  new Platform({ id: 'PC_ENGINE', name: _!('PC Engine'), iconName: 'platform-pc-engine-symbolic', generation: 4, igdbId: 86 }),
  // Translators: Use 'Super Nintendo' or 'Super Famicom' depending on the name adopted in the region.
  new Platform({ id: 'SUPER_NINTENDO', name: _!('Super Nintendo'), iconName: 'platform-snes-symbolic', generation: 4, igdbId: 19 }),

  new Platform({ id: 'ATARI_7800', name: 'Atari 7800', iconName: 'platform-atari-7800-symbolic', generation: 3, igdbId: 60 }),
  new Platform({ id: 'MASTER_SYSTEM', name: 'Master System', iconName: 'platform-sega-master-system-symbolic', generation: 3, igdbId: 64 }),
  // Translators: Use 'NES' or 'Famicom' depending on the name adopted in the region.
  new Platform({ id: 'NES', name: _!('NES'), iconName: 'platform-nes-symbolic', generation: 3, igdbId: 18 }),
  new Platform({ id: 'SG_1000', name: 'SG 1000', iconName: 'platform-sega-sg-1000-symbolic', generation: 3, igdbId: 84 }),

  new Platform({ id: 'ATARI_2600', name: 'Atari 2600', iconName: 'platform-atari-2600-symbolic', generation: 2, igdbId: 59 }),
]

export const platforms = platformsByGeneration.sort((a, b) => a.name.localeCompare(b.name))

const platformMap = Object.fromEntries(platforms.map(p => [p.id, p])) as Record<PlatformId, Platform>
const igdbMap = Object.fromEntries(platforms.map(p => [p.igdbId, p])) as Record<number, Platform>

export function getPlatform(id: PlatformId) {
  return platformMap[id]
}

export function platformFromIgdb(igdbId: number): Platform | undefined {
  return igdbMap[igdbId]
}

export function platformName(id: PlatformId): string {
  return getPlatform(id)?.name ?? _!('Unknown')
}

