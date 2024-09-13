import GObject from 'gi://GObject'

export class Currency extends GObject.Object {
  iso!: string
  name!: string
  symbol!: string

  static {
    GObject.registerClass({
      Properties: {
        iso: GObject.ParamSpec.string(
          'iso',
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
        symbol: GObject.ParamSpec.string(
          'symbol',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          ''
        )
      }
    }, this)
  }

  constructor(params: Partial<Currency>) {
    super(params)
    Object.assign(this, params)
  }
}

export const currencies: Currency[] = [
  new Currency({ iso: 'BRL', name: _('Brazilian real'), symbol: 'R$' }),
  new Currency({ iso: 'EUR', name: _('Euro'), symbol: '€' }),
  new Currency({ iso: 'GBP', name: _('Pound sterling'), symbol: '£' }),
  new Currency({ iso: 'JPY', name: _('Japanese yen'), symbol: '¥' }),
  new Currency({ iso: 'USD', name: _('United States dollar'), symbol: '$' }),
]

const currenciesMap = Object.fromEntries(currencies.map(p => [p.iso, p])) as Record<string, Currency>

export function getCurrency(iso: string): Currency | undefined {
  return currenciesMap[iso]
}

export function currencyName(iso: string): string {
  return getCurrency(iso)?.name ?? _('Unknown')
}

