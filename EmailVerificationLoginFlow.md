# Email Verification Login Flow

## Overview
This document describes the flow and logic for enforcing email verification during customer login, and how the resend verification email feature works.

---

## 1. Login API Logic (`app/api/auth/customer/login/route.ts`)

- When a user submits their email and password to log in:
  1. The API checks if the email and password are provided and valid.
  2. It fetches the customer record from the database, including the `email_verified` field.
  3. The password is validated (supports both legacy plain text and hashed passwords).
  4. **Email Verification Check:**
     - If `email_verified` is `0` or `false`, the API returns a `403` error with the message:
       > "Your email address is not verified. Please check your inbox and click the verification link before logging in."
     - If `email_verified` is `1` or `true`, the login proceeds as normal (session and tokens are created).

---

## 2. Frontend Login Page (`app/auth/login/page.tsx`)

- When the login API returns a `403` with the above message:
  - The UI displays a clear error message.
  - A **“Resend Verification Email”** button is shown.
  - When clicked, the frontend calls `/api/auth/resend-verification` with the user’s email.
  - A toast is shown for success or failure.

---

## 3. Resend Verification Email API (`app/api/auth/resend-verification/route.ts`)

- Accepts a POST request with the user’s email.
- Checks if the user exists and is not verified.
- If already verified, returns a generic success.
- If not verified:
  - Checks for an existing, unexpired token. If found, reuses it; otherwise, generates a new token.
  - Sends a new verification email using a pastel, bakery-themed template.
- Always returns a generic success message to avoid email enumeration.

---

## 4. User Experience

- If a user tries to log in with an unverified email:
  - They see a message and a button to resend the verification email.
  - After clicking, they receive a new, on-brand verification email.
  - Once verified, they can log in normally.

---

## 5. Security Notes

- The backend never reveals whether an email is registered or not in the resend endpoint.
- The verification link expires after 24 hours.

---

**This flow ensures only verified users can log in, and provides a seamless, branded way to resend verification emails.** 