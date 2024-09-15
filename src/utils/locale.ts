import Gio from 'gi://Gio'
import { Application } from '../application.js'

export interface LocaleOptions {
  followSystem: boolean
  currencyIso: string
  currencySymbol: string
  dateFormat: string
  timeFormat: string
  dateTimeFormat: string
}

export function localeOptions(): LocaleOptions {
  const {
    useSystemLocale,
    preferredCurrency,
    dateFormat,
    use24HourClock,
  } = Application.settings
  const systemOptions = systemLocaleOptions()

  if (useSystemLocale && systemOptions) {
    return systemOptions
  }

  const timeFormat = use24HourClock ? '%T' : '%I:%M:%S %p'
  const dateFormatParsed = parseDateFormat(dateFormat)

  return {
    followSystem: false,
    currencyIso: preferredCurrency.iso,
    currencySymbol: preferredCurrency.symbol,
    dateFormat: dateFormatParsed,
    timeFormat: timeFormat,
    dateTimeFormat: `${dateFormatParsed} ${timeFormat}`,
  }
}

export function systemLocaleOptions(): LocaleOptions | null {
  const monetary = locale('LC_MONETARY')
  const time = locale('LC_TIME')

  if (!monetary || !time) {
    return null
  }

  return {
    followSystem: true,
    currencyIso: monetary.int_curr_symbol,
    currencySymbol: monetary.currency_symbol,
    dateFormat: time.d_fmt,
    timeFormat: time.t_fmt,
    dateTimeFormat: `${time.d_fmt} ${time.t_fmt}`
  }
}

type LocaleCategory = 'LC_MONETARY' | 'LC_TIME' | 'LC_NUMERIC'

interface LocaleMonetary {
  int_curr_symbol: string
  currency_symbol: string
}

interface LocaleTime {
  d_fmt: string
  t_fmt: string
}

interface LocaleNumeric {
  decimal_point: string
}

type LocaleReturn<C extends LocaleCategory> = C extends 'LC_MONETARY'
  ? LocaleMonetary : C extends 'LC_TIME'
  ? LocaleTime : C extends 'LC_NUMERIC'
  ? LocaleNumeric : never

const cache: { [K in LocaleCategory]?: LocaleReturn<K> } = {}

function locale<C extends LocaleCategory>(category: C) {
  if (cache[category]) {
    return cache[category]
  }

  try {
    const process = Gio.Subprocess.new(
      ['locale', '-k', category],
      Gio.SubprocessFlags.STDOUT_PIPE
    )

    const [successful, stdout] = process.communicate_utf8(null, null)

    if (successful) {
      // @ts-ignore
      cache[category] = parseLocale(stdout) as unknown as LocaleReturn<C>

      return cache[category]
    } else {
      return null
    }
  } catch (_e: any) {
    console.error(_e)
    return null
  }
}

function parseLocale(stdout: string) {
  const entries = stdout.trim().split('\n').map<[string, string | number]>(line => {
    const [key, valueEncoded] = line.split('=')
    const value = valueEncoded.startsWith('"')
      ? valueEncoded.slice(1, -1).trim()
      : Number.parseInt(valueEncoded.trim())

    return [key, value]
  })

  return Object.fromEntries(entries)
}

function parseDateFormat(format: string) {
  return format
    .replace('dd', '%d')
    .replace('mm', '%m')
    .replace('yyyy', '%Y')
    .replace('yy', '%y')
}
