import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay, map } from 'rxjs';

export interface ClassSummary {
  index: string;
  name: string;
  url: string;
}
export interface ClassIndexResponse {
  count?: number;
  results: ClassSummary[];
}
export interface ClassLevelData {
  class_specific?: { rage_count?: number };
  spellcasting?: Record<string, number>;
}
export interface SpellcastingSlots {
  [slotLevel: string]: number;
}

@Injectable({ providedIn: 'root' })
export class DndApiService {
  private http = inject(HttpClient);
  private base = 'https://www.dnd5eapi.co/api/2014/classes';

  private classesCache$?: Observable<ClassIndexResponse>;
  private levelCache = new Map<string, Observable<ClassLevelData>>();

  getClasses(): Observable<ClassIndexResponse> {
    if (!this.classesCache$) {
      this.classesCache$ = this.http
        .get<ClassIndexResponse>(this.base)
        .pipe(shareReplay(1));
    }
    return this.classesCache$;
  }

  getClassLevel(name: string, level: number): Observable<ClassLevelData> {
    const key = `${name.toLowerCase()}_${level}`;
    const cached = this.levelCache.get(key);
    if (cached) return cached;
    const req$ = this.http
      .get<ClassLevelData>(`${this.base}/${name.toLowerCase()}/levels/${level}`)
      .pipe(shareReplay(1));
    this.levelCache.set(key, req$);
    return req$;
  }

  isSpellcaster(name: string, level: number): Observable<boolean> {
    if (!name) return of(false);
    return this.getClassLevel(name, level).pipe(
      map((data) => !!data.spellcasting)
    );
  }
}
