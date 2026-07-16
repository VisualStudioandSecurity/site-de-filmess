"# MovieHub Test Credentials

## Admin Account
- Email: `admin@moviehub.com`
- Password: `Admin@123`
- Role: admin

## Auth Endpoints
- POST `/api/auth/login` — body: `{email, password}` — returns user + sets cookies
- POST `/api/auth/logout`
- GET `/api/auth/me` — requires auth cookie
- POST `/api/auth/refresh`

## Notes
- Login uses email/password with bcrypt hashing.
- JWT tokens are set as httpOnly cookies (access_token 15min, refresh_token 7d) AND also returned in response body as `access_token` for Bearer usage.
- Frontend admin routes: `/admin/login`, `/admin`
"
