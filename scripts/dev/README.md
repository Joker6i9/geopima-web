# Local dev setup

Ports 3000 and 8000 may be taken by another project, so these use 3001 and 8001.

```bash
# Backend (from ~/Desktop/geopima/geopima/backend, branch fix/3-billing-mpesa-permissions)
python3 -m venv ~/geopima-venv && . ~/geopima-venv/bin/activate && pip install -r requirements.txt
export DB_ENGINE=sqlite DJANGO_SECRET_KEY=dev DJANGO_ALLOWED_HOSTS='*' MPESA_PAYBILL=522522
python manage.py migrate
python manage.py shell < ~/Desktop/geopima-web/scripts/dev/seed_users.py   # 7 users, password Geopima@2026
python manage.py shell < ~/Desktop/geopima-web/scripts/dev/seed_data.py    # lease, invoices, M-Pesa payments
python manage.py runserver 8001

# Web (from ~/Desktop/geopima-web)
GEOPIMA_API_URL=http://localhost:8001/api/v1 npx next dev -p 3001
```

Users (all `Geopima@2026`): superadmin, admin, accountant, secretary, fieldagent, landlord, tenant.
The data seed assumes seed_users.py ran first. The database is `backend/local.sqlite3` (git-ignored, so it survives).
