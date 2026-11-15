# Vesutil authentication and company access

## Sessions
Migration 0004 adds opaque random session tokens in HttpOnly, SameSite=Lax cookies (Secure in production). PostgreSQL stores only SHA-256 hashes. Sessions expire after seven days and can be revoked server-side.

## Local email authentication
Migration 0005 adds an Argon2id password hash, email verification timestamps, hashed one-time email tokens, and persistent rate-limit buckets. Registration requires configured SMTP and remains unavailable otherwise. Email verification links expire after 30 minutes. Login is refused until email verification succeeds.

SMTP is provider-independent. Configure these server-side variables only:
- SMTP_HOST
- SMTP_PORT (Gmail: 587)
- SMTP_SECURE (false for Gmail STARTTLS on 587)
- SMTP_USER
- SMTP_PASS (Google App Password, never the normal Google account password)
- SMTP_FROM (for example: Vesutil <luserl308@gmail.com>)

For Gmail, enable Google 2-Step Verification and create an App Password. Never commit SMTP credentials or share them in chat. A later REG.RU mailbox migration requires changing only SMTP variables.

## API
- POST /api/auth/register: JSON { email, password, displayName }; sends verification email.
- POST /api/auth/verify-email: JSON { token }; consumes a single-use verification token.
- POST /api/auth/login: JSON { email, password }; issues a revocable session only after email verification.
- GET /api/auth/me: returns a safe authenticated profile; never exposes session identifiers.
- POST /api/auth/logout: revokes the current session.

Registration does not create a company yet. Company onboarding is a separate stage. Password recovery is not enabled in this stage; do not enable public production registration until recovery and operational mail delivery are tested.

All state-changing browser requests require a same-origin Origin header and JSON content type where applicable. Authentication endpoints use persistent PostgreSQL rate-limit buckets. Passwords are hashed with Argon2id; email tokens are stored as SHA-256 hashes only.

## Company authorization and audit
Use requireCompanyRole(companyId, minimumRole) in server-side handlers. Roles: owner > admin > editor > viewer. Audit events are append-only via migration 0003.
