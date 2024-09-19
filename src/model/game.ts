import Gda from 'gi://Gda'
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'

import { coversDirectory } from '../application.js'
import { CertificationId } from './certification.js'
import { GameConditionId } from './gameCondition.js'
import { PlatformId } from './platform.js'
import { StorageMediaId } from './storageMedia.js'

export default class Game extends GObject.Object {
  id!: number
  title!: string
  developer!: string
  publisher!: string
  releaseYear!: number
  barcode: string | null = null
  platform!: PlatformId
  story!: string
  certification!: CertificationId
  storageMedia!: StorageMediaId
  condition!: GameConditionId
  favorite: boolean = false
  wishlist: boolean = false
  boughtDate: number | null = null
  store: string | null = null
  paidPriceCurrency: string = 'USD'
  paidPriceAmount: number = 0.0

  igdbSlug: string | null = null

  creationDate: number = GLib.DateTime.new_now_local().to_unix()
  modificationDate: number = GLib.DateTime.new_now_local().to_unix()

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
        storageMedia: GObject.ParamSpec.string(
          'storage-media',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          ''
        ),
        condition: GObject.ParamSpec.string(
          'condition',
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
        ),
        wishlist: GObject.ParamSpec.boolean(
          'wishlist',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          false,
        ),
        boughtDate: GObject.ParamSpec.long(
          'bought-date',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          Number.MIN_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
          0,
        ),
        store: GObject.ParamSpec.string(
          'store',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          ''
        ),
        paidPriceCurrency: GObject.ParamSpec.string(
          'paid-price-currency',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          'USD'
        ),
        paidPriceAmount: GObject.ParamSpec.double(
          'paid-price-amount',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          Number.MIN_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
          0.0
        ),
        igdbSlug: GObject.ParamSpec.string(
          'igdb-slug',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          '',
        ),
        creationDate: GObject.ParamSpec.long(
          'creation-date',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          Number.MIN_SAFE_INTEGER,
          Number.MAX_SAFE_INTEGER,
          0,
        ),
        modificationDate: GObject.ParamSpec.long(
          'modification-date',
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

  constructor(params: Partial<Game>) {
    super()
    Object.assign(this, params)
  }

  static fromIterator(iterator: Gda.DataModelIter): Game {
    const getValueForField = <T>(iterator: Gda.DataModelIter, field: string): T => {
      return iterator.get_value_for_field(field) as unknown as T
    }

    return new Game({
      id: getValueForField(iterator, 'id'),
      title: getValueForField(iterator, 'title'),
      developer: getValueForField(iterator, 'developer'),
      publisher: getValueForField(iterator, 'publisher'),
      releaseYear: getValueForField(iterator, 'release_year'),
      barcode: getValueForField(iterator, 'barcode'),
      platform: getValueForField(iterator, 'platform'),
      story: getValueForField(iterator, 'story'),
      certification: getValueForField(iterator, 'certification'),
      storageMedia: getValueForField(iterator, 'storage_media'),
      condition: getValueForField(iterator, 'condition'),
      favorite: Boolean(getValueForField<number>(iterator, 'favorite')),
      wishlist: Boolean(getValueForField<number>(iterator, 'wishlist')),
      boughtDate: getValueForField(iterator, 'bought_at'),
      store: getValueForField(iterator, 'store'),
      paidPriceCurrency: getValueForField(iterator, 'paid_price_currency'),
      paidPriceAmount: getValueForField(iterator, 'paid_price_amount'),
      igdbSlug: getValueForField(iterator, 'igdb_slug'),
      creationDate: getValueForField(iterator, 'created_at'),
      modificationDate: getValueForField(iterator, 'updated_at'),
    })
  }

  get cover(): Gio.File {
    const fileUri = GLib.build_filenamev([coversDirectory, `${this.id}.jpg`])

    return Gio.File.new_for_path(fileUri)
  }

  get coverFile(): string | null {
    const file = this.cover
    const exists = file.query_exists(null)
    const isFile = file.query_file_type(Gio.FileQueryInfoFlags.NONE, null) === Gio.FileType.REGULAR

    return (exists && isFile) ? this.cover.get_path() : null
  }

  get createdAt(): Date {
    return new Date(this.creationDate * 1_000)
  }

  get modifiedAt(): Date {
    return new Date(this.modificationDate * 1_000)
  }

  get boughtAt() {
    return this.boughtDate ? new Date(this.boughtDate * 1_000) : null
  }

  get createdAtDateTime() {
    return GLib.DateTime.new_from_unix_local(this.creationDate)
  }

  get modifiedAtDateTime() {
    return GLib.DateTime.new_from_unix_local(this.modificationDate)
  }

  get boughtAtDateTime() {
    return this.boughtDate ? GLib.DateTime.new_from_unix_local(this.boughtDate) : null
  }
}

