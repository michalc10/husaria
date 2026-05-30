import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { API_BASE_URL } from 'src/app/globals';
import { ILoginResponse, IUser } from 'src/app/models/user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSubject = new BehaviorSubject<IUser | null>(null);
  private loaded = false;

  readonly user$ = this.userSubject.asObservable();
  readonly isAdmin$ = this.user$.pipe(map(user => user?.role === 'ADMIN'));

  constructor(private http: HttpClient) {}

  get currentUser(): IUser | null {
    return this.userSubject.value;
  }

  login(email: string, password: string): Observable<IUser> {
    return this.http.post<ILoginResponse>(`${API_BASE_URL}/auth/login`, { email, password }).pipe(
      map(response => response.user),
      tap(user => this.setUser(user))
    );
  }

  loadCurrentUser(force = false): Observable<IUser | null> {
    if (this.loaded && !force) {
      return of(this.currentUser);
    }

    return this.http.get<IUser>(`${API_BASE_URL}/auth/me`).pipe(
      tap(user => this.setUser(user)),
      catchError(() => {
        this.clearUser();
        return of(null);
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<IUser> {
    return this.http.post<IUser>(`${API_BASE_URL}/auth/change-password`, { currentPassword, newPassword }).pipe(
      tap(user => this.setUser(user))
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${API_BASE_URL}/auth/logout`, {}).pipe(
      tap(() => this.clearUser())
    );
  }

  setUser(user: IUser): void {
    this.loaded = true;
    this.userSubject.next(user);
  }

  clearUser(): void {
    this.loaded = true;
    this.userSubject.next(null);
  }
}
