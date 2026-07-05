# Google SSO Design

## Goal

Add Google SSO to the existing login and signup flow while preserving the current email/password authentication and all existing user data.

## Chosen approach

Use Auth.js/NextAuth for the Google OAuth flow, but keep the app's existing `session` JWT cookie as the session consumed by protected routes and APIs.

Auth.js handles provider redirects, CSRF/state, token exchange, and its short-lived OAuth session. After Google returns a verified profile, a server-side bridge route reads the Auth.js session, maps the Google email to a local `User`, creates the local app session with `createSession(user.id)`, and sends the user to `/dashboard`.

## Account linking

Google SSO links by email:

- If `User.email` already exists, sign in as that user and keep the existing `passwordHash` and invitations.
- If no user exists for that email, create a new user with `email` and no password hash.
- Email/password login continues to work for users with a password hash.
- Google-only users cannot use password login unless a password setup flow is added later.

Google profiles without an email, or with an unverified email, are rejected and redirected back to login with a generic error.

## User interface

`AuthForm` remains the shared login/signup UI. It gets a Google SSO button in addition to the existing email/password form.

The button text should be Vietnamese and mode-aware:

- Login: `Tiếp tục với Google`
- Signup: `Đăng ký với Google`

The existing email/password fields and submit behavior remain unchanged.

## Configuration

Required environment variables:

- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- existing `SESSION_SECRET`

Google Console must allow the deployed Auth.js callback URL for the production domain and the local callback URL for development. The app also exposes a local bridge endpoint, for example `/api/auth/google/complete`, that runs after Auth.js has accepted the Google login.

## Data model

The existing Prisma `User` model already supports this flow because `email` and `passwordHash` are nullable:

- `email String? @unique`
- `passwordHash String?`

No schema migration is required for the first version.

## Error handling

OAuth cancellation or provider errors redirect back to `/login` with a short user-facing error. The app should avoid exposing provider internals.

If the database write fails while creating a new Google user, the request fails normally and is visible in server logs.

## Testing

Verification should cover:

- `npm run typecheck`
- `npm run build`
- Email/password signup still creates a user and session.
- Email/password login still works for existing password users.
- Google login with a new verified email creates a user and opens `/dashboard`.
- Google login with an existing email opens the existing account and preserves invitations.
- Google OAuth cancellation returns to login without creating a local user.
