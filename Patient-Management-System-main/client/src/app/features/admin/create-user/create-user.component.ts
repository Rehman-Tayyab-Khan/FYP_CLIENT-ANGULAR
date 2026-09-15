import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-create-user',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css'],
})
export class CreateUserComponent {
  authService = inject(AuthService);
  createUserForm = new FormBuilder().group({
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    role: ['doctor', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  isLoading = false;

  get firstName() {
    return this.createUserForm.get('first_name');
  }

  get lastName() {
    return this.createUserForm.get('last_name');
  }

  get email() {
    return this.createUserForm.get('email');
  }

  get password() {
    return this.createUserForm.get('password');
  }

  onSubmit(): void {
    if (this.createUserForm.invalid) {
      this.createUserForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const payload = this.createUserForm.value;

    // TODO: Replace with real user creation API call.
    console.log('Create user payload', payload);
    setTimeout(() => {
      this.isLoading = false;
      alert('User created successfully (placeholder)');
      this.createUserForm.reset({ role: 'doctor' });
    }, 500);
  }
}
