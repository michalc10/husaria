import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from 'src/app/globals';
import { ICreateUserPayload, IUpdateUserPayload, IUser } from 'src/app/models/user';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly route = `${API_BASE_URL}/user`;

  constructor(private http: HttpClient) {}

  list(): Observable<IUser[]> {
    return this.http.get<IUser[]>(this.route);
  }

  create(payload: ICreateUserPayload): Observable<IUser> {
    return this.http.post<IUser>(this.route, payload);
  }

  update(id: string, payload: IUpdateUserPayload): Observable<IUser> {
    return this.http.put<IUser>(`${this.route}/${encodeURIComponent(id)}`, payload);
  }

  resetPassword(id: string, temporaryPassword: string): Observable<IUser> {
    return this.http.post<IUser>(`${this.route}/${encodeURIComponent(id)}/reset-password`, { temporaryPassword });
  }

  activate(id: string): Observable<IUser> {
    return this.http.post<IUser>(`${this.route}/${encodeURIComponent(id)}/activate`, {});
  }

  deactivate(id: string): Observable<IUser> {
    return this.http.post<IUser>(`${this.route}/${encodeURIComponent(id)}/deactivate`, {});
  }
}
