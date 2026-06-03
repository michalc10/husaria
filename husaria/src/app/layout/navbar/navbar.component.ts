import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { AuthService } from 'src/app/modules/auth/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: false
})
export class NavbarComponent {
  readonly user$ = this.authService.user$;
  readonly isAdmin$ = this.authService.isAdmin$;

  menuOpen = false;
  changePasswordOpen = false;
  currentPassword = '';
  newPassword = '';
  repeatedPassword = '';
  passwordError = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private transloco: TranslocoService
  ) {}

  isActive(prefix: string): boolean {
    return this.router.url.startsWith(prefix);
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  openChangePassword(): void {
    this.menuOpen = false;
    this.passwordError = '';
    this.currentPassword = '';
    this.newPassword = '';
    this.repeatedPassword = '';
    this.changePasswordOpen = true;
  }

  savePassword(): void {
    this.passwordError = '';

    if (!this.currentPassword || !this.newPassword || !this.repeatedPassword) {
      this.passwordError = this.transloco.translate('auth.requiredPasswordFields');
      return;
    }

    if (this.newPassword !== this.repeatedPassword) {
      this.passwordError = this.transloco.translate('auth.passwordMismatch');
      return;
    }

    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.changePasswordOpen = false;
      },
      error: error => {
        this.passwordError = error?.error?.message || this.transloco.translate('auth.changePasswordError');
      }
    });
  }

  logout(): void {
    this.menuOpen = false;
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
