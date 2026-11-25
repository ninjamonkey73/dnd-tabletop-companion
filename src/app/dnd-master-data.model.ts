export interface MasterClassSpecific {
  rage_count?: number;
  rage_damage_bonus?: number;
  wild_shape_uses?: number;
  wild_shape_max_cr?: number;
  wild_shape_swim?: boolean;
  wild_shape_fly?: boolean;
  [key: string]: unknown;
}

export interface MasterPactMagicData {
  slots: number;
  slot_level: number;
}

export interface MasterSpellcastingData {
  cantrips_known?: number;
  spells_known?: number;
  spell_slots_level_1?: number;
  spell_slots_level_2?: number;
  spell_slots_level_3?: number;
  spell_slots_level_4?: number;
  spell_slots_level_5?: number;
  spell_slots_level_6?: number;
  spell_slots_level_7?: number;
  spell_slots_level_8?: number;
  spell_slots_level_9?: number;
  [key: string]: number | undefined;
}

export interface MasterLevelData {
  level: number;
  prof_bonus?: number;
  spellcasting?: MasterSpellcastingData;
  class_specific?: MasterClassSpecific;
  pact_magic?: MasterPactMagicData;
}

export interface MasterSubclassData {
  index: string;
  name: string;
  source: string;
  caster_type?: string;
  subdomain_label?: string;
  subdomains?: string[];
}

export interface MasterClassData {
  name: string;
  hit_die: number;
  subclass_level?: number;
  caster_type?: 'full' | 'half' | 'half_up' | 'third' | 'pact' | 'none';
  subclasses?: MasterSubclassData[];
  levels: Record<string, MasterLevelData>;
}

export interface DndMasterData {
  version: string;
  multiclass_spell_slots: Record<string, number[]>;
  third_caster_levels: Record<string, MasterLevelData>;
  classes: Record<string, MasterClassData>;
}
