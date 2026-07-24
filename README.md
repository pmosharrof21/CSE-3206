# Hotel Management System

Full-stack hotel booking application built with Django REST Framework, React, Tailwind CSS, and MySQL.

## Local development

1. Copy `backend/.env.example` to `backend/.env` and configure MySQL.
2. In `backend`, create a virtual environment, install `requirements.txt`, then run migrations and `python manage.py runserver`.
3. In `frontend`, run `npm install` then `npm run dev`.

Set `USE_SQLITE=true` in `backend/.env` for a local fallback when MySQL is unavailable.
