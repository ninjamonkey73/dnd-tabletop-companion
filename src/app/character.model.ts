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
}

export const defaultCharacter: Character = {
  name: '',
  currentHP: 0,
  maxHP: 100,
  kiPoints: 2,
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
};
