# Orbit SaaS Application

Orbit is a modern, full-stack SaaS application built with **React**, **Django REST Framework**, and **PostgreSQL**. It offers a premium task management experience with a Kanban-style board, secure authentication, and a responsive dark-mode design.

## 🛠 Tech Stack
- **Frontend**: React.js (Vite), TypeScript, Framer Motion, Axios, CSS Modules
- **Backend**: Django, Django REST Framework, JWT (Simple JWT), WhiteNoise
- **Database**: PostgreSQL (Supabase / Render)
- **Deployment**: Vercel (Frontend), Render (Backend)

## ✨ Features
- **Secure Authentication**: User registration and login with JWT tokens.
- **Dynamic Kanban Board**: Drag-and-drop-like interaction for managing tasks across different states.
- **Project Organization**: Professional folder structure for easy scalability.
- **Responsive Design**: Polished UI that feels premium on both mobile and desktop.
- **Automated Deployment**: Ready for Vercel and Render with optimized build scripts.

## 📂 Folder Structure
```text
Orbit-saas-application/
│
├── frontend/                # React application (Vite)
│   ├── src/                 # Source code
│   ├── public/              # Static assets
│   ├── package.json         # Dependencies
│   └── README.md            # Frontend specific docs
│
├── backend/                 # Django project
│   ├── manage.py            # Django CLI
│   ├── requirements.txt     # Python dependencies
│   ├── orbit_backend/       # Project core (settings, wsgi)
│   └── core/                # Core application logic (models, views, serializers)
│
├── screenshots/             # UI screenshots for documentation
├── docs/                    # Detailed documentation files
├── README.md                # Main project documentation
├── .gitignore               # Root ignore file
├── LICENSE                  # MIT License
└── docker-compose.yml       # Local development with Docker
```

## ⚙️ Installation Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📡 API Endpoints
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login and get JWT
- `GET /api/tasks/` - Fetch user tasks
- `POST /api/tasks/` - Create a new task

## 📸 Screenshots
*(Add your screenshots to the `screenshots/` folder and link them here)*
![Dashboard](screenshots/dashboard_preview.png)

## 👤 Author
- **Ansil Muhammed**
- [GitHub](https://github.com/Ansil-muhammed)

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.