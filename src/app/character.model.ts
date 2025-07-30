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
  class: string;
  cp: number;
  sp: number;
  gp: number;
  pp: number;
  level: number;
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
}

export const defaultCharacter: Character = {
  name: '',
  currentHP: 0,
  maxHP: 0,
  kiPoints: 0,
  class: '',
  cp: 0,
  sp: 0,
  gp: 0,
  pp: 0,
  level: 1,
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
    { id: 1, name: 'Resource 1', value: 0 },
    { id: 2, name: 'Resource 2', value: 0 },
    { id: 3, name: 'Resource 3', value: 0 },
    { id: 4, name: 'Resource 4', value: 0 },
  ],
};
