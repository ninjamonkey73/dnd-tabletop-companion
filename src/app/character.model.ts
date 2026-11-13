export interface ClassLevel {
  class: string;
  level: number;
}

export interface Resource {
  id: number;
  name: string;
  value: number;
}

export interface Character {
  name: string;
  currentHP: number;
  maxHP: number;
  kiPoints: number;
  classes: ClassLevel[];
  /** @deprecated Legacy scalar class, use `classes` instead */
  class?: string;
  /** @deprecated Legacy scalar level, use `classes` instead */
  level?: number;
  cp: number;
  sp: number;
  gp: number;
  pp: number;
  tempHP: number;
  deathSaveSuccess: boolean[];
  deathSaveFailure: boolean[];
  stable: boolean;
  spellSlots: number[];
  spellSlotsRemaining: number[];
  hitDie: number;
  rage: number;
  rageRemaining: number;
  wildShapeRemaining: number;
  resources: Resource[];
  sneakAttack: number;
  exhaustion: number;
}

export const defaultCharacter: Character = {
  name: '',
  currentHP: 0,
  maxHP: 0,
  kiPoints: 0,
  classes: [],
  class: '',
  level: 1,
  cp: 0,
  sp: 0,
  gp: 0,
  pp: 0,
  tempHP: 0,
  deathSaveSuccess: [false, false, false],
  deathSaveFailure: [false, false, false],
  stable: false,
  spellSlots: [],
  spellSlotsRemaining: [],
  hitDie: 0,
  rage: 0,
  rageRemaining: 0,
  wildShapeRemaining: 0,
  resources: [
    { id: 1, name: `Resource 1`, value: 0 },
    { id: 2, name: `Resource 2`, value: 0 },
    { id: 3, name: `Resource 3`, value: 0 },
    { id: 4, name: `Resource 4`, value: 0 },
  ],
  sneakAttack: 0,
  exhaustion: 0,
};
