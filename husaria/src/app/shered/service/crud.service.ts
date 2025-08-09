import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from 'src/app/globals';

@Injectable({ providedIn: 'root' })
export class CrudService {
  constructor(private http: HttpClient) {}

  // GET /:route/:id
  read<T>(route: string, id: string | number): Observable<T> {
    return this.http.get<T>(this.url(route, id));
  }

  // GET /:route
  list<T>(route: string): Observable<T[]> {
    return this.http.get<T[]>(this.url(route));
  }

  // POST /:route
  create<TBody, TResp = TBody>(route: string, data: TBody): Observable<TResp> {
    return this.http.post<TResp>(this.url(route), data);
  }

  // PUT /:route/:id
  update<TBody, TResp = TBody>(route: string, id: string | number, data: Partial<TBody>): Observable<TResp> {
    return this.http.put<TResp>(this.url(route, id), data);
  }

  // PATCH /:route/:id (opcjonalnie)
  patch<TBody, TResp = TBody>(route: string, id: string | number, data: Partial<TBody>): Observable<TResp> {
    return this.http.patch<TResp>(this.url(route, id), data);
  }

  // DELETE /:route/:id
  delete(route: string, id: string | number): Observable<void> {
    return this.http.delete<void>(this.url(route, id));
  }

  // Helpers
  private url(route: string, id?: string | number): string {
    const trim = (s: string) => s.replace(/^\/+|\/+$/g, '');
    const base = trim(API_BASE_URL);
    const r = trim(route);
    const path = id !== undefined ? `${r}/${encodeURIComponent(String(id))}` : r;
    return `${base}/${path}`;
  }
}