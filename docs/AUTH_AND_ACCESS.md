# Vesutil authentication and company access foundation

This stage adds revocable server-side sessions and company authorization. It deliberately does not expose password registration or trust client-supplied user/company IDs.

## Sessions

Migration `0004_user_sessions.sql` creates the session store. A cryptographically random opaque token is placed in an HttpOnly, SameSite=Lax cookie (Secure in production), with a seven-day expiry. PostgreSQL stores only the SHA-256 hash of the token. Every authenticated request checks that the session exists, has not expired or been revoked, and belongs to an active user.

Logout revokes the current session in PostgreSQL and clears the browser cookie. A stolen token can therefore be invalidated server-side. Expired rows can be periodically cleaned up with a maintenance job; they do not grant access.

`issueSessionCookie(userId)` is server-only and must only be called after a trusted identity provider has authenticated the person and the application has mapped the provider subject to `app_users`. Never expose a route that accepts an arbitrary user ID and calls this function.

## API

- `GET /api/auth/me`: returns the current authenticated profile or `authenticated: false`.
- `POST /api/auth/logout`: revokes the current session and clears the cookie.

## Company authorization

Use `requireCompanyRole(companyId, minimumRole)` inside server-side handlers before reading or mutating private company data. Role hierarchy: owner > admin > editor > viewer. Never authorize using a company ID or role supplied by the browser alone.

## Audit

Use `writeAuditEvent` after successful business mutations. Migration `0003_audit_integrity.sql` installs a database trigger that rejects UPDATE and DELETE operations on audit events.

## Not yet enabled

A real sign-in/sign-up flow still requires a trusted identity provider or a carefully implemented local credential flow. No password storage or public registration is introduced in this stage. Email verification, password recovery, invitation acceptance and company onboarding must be implemented before public account creation is enabled.
