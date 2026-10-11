import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAuthErrorMessage(error: any): string {
  if (error.code) {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'Invalid email format. Please check your email and try again.';
      case 'auth/user-not-found':
        return 'No account found with this email. Please sign up first.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please login instead.';
      case 'auth/weak-password':
        return 'Password is too weak. It should be at least 6 characters long.';
      case 'auth/invalid-action-code':
        return 'The password reset link is invalid or has expired. Please request a new one.';
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }
  return error.message || 'An unexpected error occurred.';
}
 