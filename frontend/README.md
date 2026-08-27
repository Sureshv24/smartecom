# Smart E-Commerce Platform

## Technologies
- React
- FastAPI
- Django
- MySQL
- WebSockets
- Stripe
- Chart.js
- Postman

## 1. Run FastAPI

cd fastapi_backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

Swagger:
http://127.0.0.1:8000/docs

OpenAPI:
http://127.0.0.1:8000/openapi.json

## 2. Run Django Admin

cd django_admin
.\venv\Scripts\Activate.ps1
python manage.py runserver 8001

Django Admin:
http://127.0.0.1:8001/admin/

Analytics:
http://127.0.0.1:8001/analytics/

## 3. Run Frontend

cd frontend
npm install
npm run dev

Frontend:
http://localhost:5173

## Database

MySQL database:
smart_ecommerce

Host:
127.0.0.1

Port:
3306

## API Testing

Import:
Smart_Ecommerce_Postman_Collection.json

into Postman.