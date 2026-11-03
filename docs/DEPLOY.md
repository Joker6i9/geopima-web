# Deploying GeoPima

Two pieces: the Django API (Render) and this web app (Vercel). The database is the existing Neon Postgres.

## 1. API on Render
1. Push the backend repo (`render.yaml` is at its root) to GitHub.
2. Render → New → Blueprint → pick the repo. It reads `render.yaml`.
3. Fill the secret values it asks for: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and the Daraja keys.
4. If Render gives you a different address than `geopima-api.onrender.com`, update `DJANGO_ALLOWED_HOSTS`,
   `CSRF_TRUSTED_ORIGINS` and `MPESA_PUBLIC_URL` to match.
5. Check `https://<api>/healthz` answers `ok`.
6. First time only, create users in the Render shell: `python manage.py createsuperuser`.

## 2. Web on Vercel
1. Import the web repo in Vercel (framework: Next.js).
2. Add one environment variable: `GEOPIMA_API_URL=https://<api>/api/v1`.
3. Deploy.

## 3. M-Pesa
Open Settings → M-Pesa connection and press Connect. Safaricom now calls the Render address, so ngrok is no longer needed.
For real money, switch `MPESA_ENV=production` and use the live Daraja keys (see the backend `docs/MPESA_GO_LIVE.md`).

## Notes
- Render's free web tier sleeps after idle time, which delays the first request and can miss a Safaricom callback.
  Use a paid instance for live payments.
- Uploaded media is not persisted on Render. Nothing in the app uses uploads yet.
