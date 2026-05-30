import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Table } from 'primeng/table';
import { ICreateUserPayload, IUser, UserRole } from 'src/app/models/user';
import { UserService } from '../../user.service';

interface UserForm {
  _id?: string;
  email: string;
  name: string;
  role: UserRole;
  temporaryPassword: string;
}

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  standalone: false
})
export class UserListComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  users: IUser[] = [];
  formVisible = false;
  resetVisible = false;
  submitted = false;
  loading = false;
  errorMessage = '';
  resetPasswordValue = '';
  selectedUser: IUser | null = null;

  form: UserForm = this.emptyForm();

  constructor(
    private userService: UserService,
    private transloco: TranslocoService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.list().subscribe({
      next: users => {
        this.users = users;
        this.errorMessage = '';
        this.loading = false;
      },
      error: error => {
        this.errorMessage = error?.error?.message || this.transloco.translate('users.loadError');
        this.loading = false;
      }
    });
  }

  onGlobalFilter(event: Event): void {
    this.dt.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  createUser(): void {
    this.form = this.emptyForm();
    this.submitted = false;
    this.formVisible = true;
  }

  editUser(user: IUser): void {
    this.form = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      temporaryPassword: ''
    };
    this.submitted = false;
    this.formVisible = true;
  }

  saveUser(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (!this.form.email.trim() || !this.form.name.trim() || (!this.form._id && !this.form.temporaryPassword)) {
      return;
    }

    if (this.form._id) {
      this.userService.update(this.form._id, {
        email: this.form.email,
        name: this.form.name,
        role: this.form.role
      }).subscribe({
        next: () => this.afterMutation(),
        error: error => this.handleError(error, 'users.saveError')
      });
      return;
    }

    const payload: ICreateUserPayload = {
      email: this.form.email,
      name: this.form.name,
      role: this.form.role,
      temporaryPassword: this.form.temporaryPassword
    };

    this.userService.create(payload).subscribe({
      next: () => this.afterMutation(),
      error: error => this.handleError(error, 'users.saveError')
    });
  }

  openResetPassword(user: IUser): void {
    this.selectedUser = user;
    this.resetPasswordValue = '';
    this.submitted = false;
    this.resetVisible = true;
  }

  resetPassword(): void {
    this.submitted = true;
    if (!this.selectedUser || !this.resetPasswordValue) return;

    this.userService.resetPassword(this.selectedUser._id, this.resetPasswordValue).subscribe({
      next: () => this.afterMutation(),
      error: error => this.handleError(error, 'users.resetError')
    });
  }

  setActive(user: IUser, active: boolean): void {
    const request = active ? this.userService.activate(user._id) : this.userService.deactivate(user._id);
    request.subscribe({
      next: () => this.loadUsers(),
      error: error => this.handleError(error, active ? 'users.activateError' : 'users.deactivateError')
    });
  }

  roleLabel(role: UserRole): string {
    return role === 'ADMIN' ? this.transloco.translate('users.admin') : this.transloco.translate('users.judge');
  }

  get roleOptions(): Array<{ label: string; value: UserRole }> {
    return [
      { label: this.transloco.translate('users.admin'), value: 'ADMIN' },
      { label: this.transloco.translate('users.judge'), value: 'JUDGE' }
    ];
  }

  private afterMutation(): void {
    this.formVisible = false;
    this.resetVisible = false;
    this.selectedUser = null;
    this.submitted = false;
    this.loadUsers();
  }

  private handleError(error: any, key: string): void {
    this.errorMessage = error?.error?.message || this.transloco.translate(key);
  }

  private emptyForm(): UserForm {
    return {
      email: '',
      name: '',
      role: 'JUDGE',
      temporaryPassword: ''
    };
  }
}
