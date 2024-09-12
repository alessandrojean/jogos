import GObject from 'gi://GObject'

export type GameConditionId = 'LOOSE' | 'CIB' | 'SEALED'

export class GameCondition extends GObject.Object {
  id!: GameConditionId
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

  constructor(params: Partial<GameCondition>) {
    super(params)
    Object.assign(this, params)
  }
}

export const gameConditions: GameCondition[] = [
  new GameCondition({ id: 'CIB', name: _('CIB') }),
  new GameCondition({ id: 'LOOSE', name: _('Loose') }),
  new GameCondition({ id: 'SEALED', name: _('Sealed') }),
]

const gameConditionMap = Object.fromEntries(gameConditions.map(p => [p.id, p])) as Record<GameConditionId, GameCondition>

export function getGameCondition(id: GameConditionId) {
  return gameConditionMap[id]
}

export function gameConditionName(id: GameConditionId): string {
  return getGameCondition(id)?.name ?? _('Unknown')
}

