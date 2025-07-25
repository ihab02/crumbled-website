# Resend Verification Email Feature

## Overview
This feature allows users who try to log in but haven’t verified their email to request a new verification email with a modern, pastel, bakery-themed template.

---

## Implementation Plan

- [x] **Backend: Resend Verification API**
  - [x] Create `app/api/auth/resend-verification/route.ts`.
  - [x] Accept a POST request with the user’s email.
  - [x] Check if the user exists and is not verified.
  - [x] If already verified, return a generic success.
  - [x] If not verified, check for an existing, unexpired token. If found, reuse it; otherwise, generate a new token.
  - [x] Send a new verification email with the token using a pastel, bakery-themed template.
  - [x] Always return a generic success message to avoid email enumeration.

- [x] **Frontend: Login Page**
  - [x] When login fails with the “not verified” error, show a **“Resend Verification Email”** button.
  - [x] On click, call the new API endpoint with the user’s email.
  - [x] Show a toast/message for success or failure.
  - [x] Disable the button while the request is in progress.

- [x] **Email Template**
  - [x] Use a pastel, bakery-themed template for the verification email.
  - [x] The button links to `/auth/verify-email?token=...`.

---

## Status

All tasks for the Resend Verification Email feature are **implemented and done**. 🎉

- Backend API: **Done**
- Frontend logic: **Done**
- Themed email template: **Done**

You can now test the full flow: users with unverified emails will see the resend option and receive a beautiful, on-brand verification email. 