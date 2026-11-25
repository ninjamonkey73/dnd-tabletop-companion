import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import masterDataRaw from '../assets/dnd-5e-2014-master.json';
import {
  DndMasterData,
  MasterLevelData,
  MasterSubclassData,
} from './dnd-master-data.model';

const masterData = masterDataRaw as unknown as DndMasterData;

export interface ClassSummary {
  index: string;
  name: string;
  subclass_level?: number;
  url?: string;
}

export interface ClassIndexResponse {
  count?: number;
  results: ClassSummary[];
}

export interface ClassLevelData {
  level?: number;
  prof_bonus?: number;
  class_specific?: {
    rage_count?: number;
    wild_shape_uses?: number;
    wild_shape_max_cr?: number;
    wild_shape_swim?: boolean;
    wild_shape_fly?: boolean;
    [key: string]: unknown;
  };
  spellcasting?: Record<string, number>;
  pact_magic?: { slots: number; slot_level: number };
}

@Injectable({ providedIn: 'root' })
export class DndApiService {
  getClasses(): Observable<ClassIndexResponse> {
    const classEntries = Object.entries(masterData.classes || {});
    const results: ClassSummary[] = classEntries.map(([index, data]) => ({
      index,
      name: data.name,
      subclass_level: data.subclass_level,
      url: `/api/2014/classes/${index}`,
    }));

    return of({
      count: results.length,
      results,
    });
  }

  getClassLevel(classIndex: string, level: number): Observable<ClassLevelData> {
    const normalizedKey = (classIndex || '').toLowerCase().trim();
    const classData = masterData.classes?.[normalizedKey];
    const levelData: MasterLevelData | undefined =
      classData?.levels?.[String(level)];

    if (!levelData) {
      return of({});
    }

    const result: ClassLevelData = {
      level: levelData.level,
      prof_bonus: levelData.prof_bonus,
      spellcasting: levelData.spellcasting as Record<string, number> | undefined,
      class_specific: levelData.class_specific,
      pact_magic: levelData.pact_magic,
    };

    return of(result);
  }

  getSubclasses(classIndex: string): Observable<MasterSubclassData[]> {
    const normalizedKey = (classIndex || '').toLowerCase().trim();
    const subclasses = masterData.classes?.[normalizedKey]?.subclasses ?? [];
    return of(subclasses);
  }

  getThirdCasterLevel(level: number): Observable<MasterLevelData | null> {
    const thirdCaster = masterData.third_caster_levels?.[String(level)] ?? null;
    return of(thirdCaster);
  }

  isSpellcaster(name: string, level: number): Observable<boolean> {
    if (!name) return of(false);
    const normalizedKey = (name || '').toLowerCase().trim();
    const classData = masterData.classes?.[normalizedKey];
    const levelData = classData?.levels?.[String(level)];
    return of(!!levelData?.spellcasting);
  }
}
