import GObject from 'gi://GObject'

export type StorageMediaId = 'CARTRIDGE' | 'CD' | 'DVD' | 'BLURAY' | 'FLOPPY_DISK'

export class StorageMedia extends GObject.Object {
  id!: StorageMediaId
  name!: string

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
      }
    }, this)
  }

  constructor(params: Partial<StorageMedia>) {
    super()
    Object.assign(this, params)
  }
}

export const storageMedias: StorageMedia[] = [
  new StorageMedia({ id: 'BLURAY', name: _!('Blu-ray') }),
  new StorageMedia({ id: 'DVD', name: _!('DVD') }),
  new StorageMedia({ id: 'CD', name: _!('CD') }),
  new StorageMedia({ id: 'FLOPPY_DISK', name: _!('Floppy disk') }),
  new StorageMedia({ id: 'CARTRIDGE', name: _!('Cartridge') }),
]

const storageMediaMap = Object.fromEntries(storageMedias.map(p => [p.id, p])) as Record<StorageMediaId, StorageMedia>

export function getStorageMedia(id: StorageMediaId) {
  return storageMediaMap[id]
}

export function storageMediaName(id: StorageMediaId): string {
  return getStorageMedia(id)?.name ?? _!('Unknown')
}

