# Vesutil authentication and company access foundation

This stage adds the server-side session and authorization foundation. It deliberately does not expose password registration or trust client-supplied user/company IDs.

## Session configuration

Set `AUTH_SECRET` to a cryptographically random value of at least 32 characters. The session cookie is HttpOnly, SameSite=Lax, Secure in production, and expires after seven days. The cookie contains only a user ID and expiry, authenticated with HMAC-SHA256. User status is rechecked against PostgreSQL on every request.

`issueSessionCookie(userId)` is server-only and must only be called after a trusted identity provider has authenticated the person and the application has mapped the provider subject to `app_users`. Never expose a route that accepts an arbitrary user ID and calls this function.

## API

- `GET /api/auth/me`: returns the current authenticated profile or `authenticated: false`.
- `POST /api/auth/logout`: clears the session cookie.

## Company authorization

Use `requireCompanyRole(companyId, minimumRole)` inside server-side handlers before reading or mutating private company data. Role hierarchy: owner > admin > editor > viewer. Never authorize using a company ID or role supplied by the browser alone.

## Audit

Use `writeAuditEvent` after successful business mutations. Migration `0003_audit_integrity.sql` installs a database trigger that rejects UPDATE and DELETE operations on audit events.

## Not yet enabled

A real sign-in/sign-up flow still requires selecting and configuring a trusted OIDC identity provider (issuer, client ID, client secret, redirect URI). No password storage or home-grown password authentication is introduced in this stage. Invitation acceptance and company onboarding will be added on top of verified identity.
