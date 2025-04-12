import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private dataUrl = 'http://localhost:3000/characterData'; // Adjust based on your data.json structure

  constructor(private http: HttpClient) {}

  getCharacterData(): Observable<any> {
    return this.http.get(this.dataUrl);
  }

  setCharacterData(data: any): Observable<any> {
    return this.http.put(this.dataUrl, data); // Use PUT for full updates
  }
}
