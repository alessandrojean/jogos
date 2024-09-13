import GObject from 'gi://GObject'

export type CertificationSystem = 'ESRB' | 'CLASSIND' | 'PEGI' | 'CERO'
export type EsrbCertification = 'ESRB_E' | 'ESRB_E10' | 'ESRB_T' | 'ESRB_M17' | 'ESRB_AO'
export type PegiCertification = 'PEGI_3' | 'PEGI_7' | 'PEGI_12' | 'PEGI_16' | 'PEGI_18'
export type ClassIndCertification = 'CLASSIND_L' | 'CLASSIND_10' | 'CLASSIND_12' | 'CLASSIND_14' | 'CLASSIND_16' | 'CLASSIND_18'
export type CeroCertification = 'CERO_A' | 'CERO_B' | 'CERO_C' | 'CERO_D' | 'CERO_Z'

export type CertificationId = EsrbCertification | ClassIndCertification
  | PegiCertification | CeroCertification

export class Certification extends GObject.Object {
  id!: CertificationId
  name!: string
  system!: CertificationSystem
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
        system: GObject.ParamSpec.string(
          'system',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          '',
        ),
        iconName: GObject.ParamSpec.string(
          'icon-name',
          '',
          '',
          GObject.ParamFlags.READWRITE,
          '',
        )
      }
    }, this)
  }

  constructor(params: Partial<Certification>) {
    super(params)
    Object.assign(this, params)
  }
}

export const certifications: Certification[] = [
  /* Entertainment Software Rating Board (ESRB) */
  new Certification({ id: 'ESRB_E', system: 'ESRB', name: 'Everyone', iconName: 'esrb-everyone' }),
  new Certification({ id: 'ESRB_E10', system: 'ESRB', name: 'Everyone 10+', iconName: 'esrb-everyone-10-plus' }),
  new Certification({ id: 'ESRB_T', system: 'ESRB', name: 'Teen', iconName: 'esrb-teen' }),
  new Certification({ id: 'ESRB_M17', system: 'ESRB', name: 'Mature', iconName: 'esrb-mature' }),
  new Certification({ id: 'ESRB_AO', system: 'ESRB', name: 'Adults Only', iconName: 'esrb-adults-only' }),

  /* Pan-European Game Information (PEGI) */
  new Certification({ id: 'PEGI_3', system: 'PEGI', name: 'PEGI 3', iconName: 'pegi-3-years' }),
  new Certification({ id: 'PEGI_7', system: 'PEGI', name: 'PEGI 7', iconName: 'pegi-7-years' }),
  new Certification({ id: 'PEGI_12', system: 'PEGI', name: 'PEGI 12', iconName: 'pegi-12-years' }),
  new Certification({ id: 'PEGI_16', system: 'PEGI', name: 'PEGI 16', iconName: 'pegi-16-years' }),
  new Certification({ id: 'PEGI_18', system: 'PEGI', name: 'PEGI 18', iconName: 'pegi-18-years' }),

  /* Computer Entertainment Rating Organization (CERO) */
  new Certification({ id: 'CERO_A', system: 'CERO', name: 'CERO A', iconName: 'cero-a' }),
  new Certification({ id: 'CERO_B', system: 'CERO', name: 'CERO B', iconName: 'cero-b' }),
  new Certification({ id: 'CERO_C', system: 'CERO', name: 'CERO C', iconName: 'cero-c' }),
  new Certification({ id: 'CERO_D', system: 'CERO', name: 'CERO D', iconName: 'cero-d' }),
  new Certification({ id: 'CERO_Z', system: 'CERO', name: 'CERO Z', iconName: 'cero-z' }),

  /* Classificação Indicativa (ClassInd) */
  new Certification({ id: 'CLASSIND_L', system: 'CLASSIND', name: 'Livre', iconName: 'classind-livre' }),
  new Certification({ id: 'CLASSIND_10', system: 'CLASSIND', name: '10 anos', iconName: 'classind-10-anos' }),
  new Certification({ id: 'CLASSIND_12', system: 'CLASSIND', name: '12 anos', iconName: 'classind-12-anos' }),
  new Certification({ id: 'CLASSIND_14', system: 'CLASSIND', name: '14 anos', iconName: 'classind-14-anos' }),
  new Certification({ id: 'CLASSIND_16', system: 'CLASSIND', name: '16 anos', iconName: 'classind-16-anos' }),
  new Certification({ id: 'CLASSIND_18', system: 'CLASSIND', name: '18 anos', iconName: 'classind-18-anos' }),
]

const certificationMap = Object.fromEntries(certifications.map(p => [p.id, p])) as Record<CertificationId, Certification>

export function getCertification(id: CertificationId) {
  return certificationMap[id]
}

export function certificationName(id: CertificationId): string {
  return getCertification(id)?.name ?? _('Unknown')
}

const systemMap: Record<CertificationSystem, string> = {
  'ESRB': 'ESRB',
  'PEGI': 'PEGI',
  'CERO': 'CERO',
  'CLASSIND': 'ClassInd',
}

export const certificationSystems = Object.keys(systemMap) as CertificationSystem[]

export function certificationSystemName(id: CertificationSystem) {
  return systemMap[id]
}

