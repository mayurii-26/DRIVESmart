# 🚗 Drive Smart Portal

Drive Smart Portal is an AI-powered smart transportation and RTO assistance web platform designed to simplify transportation-related services, improve driving awareness, and provide intelligent user support through a unified digital system.

The platform integrates AI assistance, smart navigation, learning resources, driving test preparation, document management, and government service access into a single user-friendly web application.

---

# ✨ Key Features

## 🤖 AI-Powered Drive Smart Assistant
- Gemini API integrated conversational AI assistant
- Provides guidance for:
  - Driving License (DL)
  - Learner's License (LL)
  - Vehicle Registration (RC)
  - PUC & Insurance
  - Traffic Rules & Challans
  - Road Safety & Navigation
  - Parivahan Portal support
- Domain-restricted responses (only transportation & RTO related queries)
- Intelligent fallback:
  - “Still need help?”
  - “Submit Issue to Admin”

---

## 🗺️ Smart Maps & Navigation
- Google Maps integration
- Real-time location tracking
- Traffic-aware route suggestions
- Estimated distance and travel time
- Efficient route navigation support

---

## 📚 Learning Hub
- Curated transportation and driving learning resources
- Driving awareness materials
- Government transport information
- Road safety educational content

---

## 📝 Driving Test Practice
- Mock driving license test preparation
- Multiple-choice practice questions
- Traffic sign and rule awareness
- User performance tracking

---

## 📤 Smart Document Management
- Upload and manage:
  - Driving License
  - Registration Certificate (RC)
  - PUC documents
  - Vehicle-related documents
- Cloudinary cloud storage integration
- Secure file upload handling

---

## 🔐 Authentication & User Management
- Secure login and registration system
- Session-based authentication
- Admin access control
- User activity management

---

## 👨‍💼 Admin Panel
- User management
- Uploaded issue monitoring
- System activity tracking
- Analytics and administration tools

---

# 🛠️ Technologies Used

## Frontend
- HTML5
- CSS3
- JavaScript (Vanilla JS)

## Backend
- Node.js
- Express.js

## APIs & Cloud Services
- Gemini API (Google AI)
- Google Maps API
- Cloudinary

## Authentication & Security
- Express Sessions
- bcryptjs

## File Handling
- Multer
- Cloudinary Storage

## Data Storage
- JSON-based structured storage

---

# 🧠 AI Assistant Architecture

```text
User Query
    ↓
Frontend Chat Interface
    ↓
Node.js Backend API
    ↓
Gemini AI API
    ↓
AI-generated Transportation/RTO Response
    ↓
Response Display to User
```

---

# 📁 Project Structure

```text
DriveSmart/
│
├── server.js
├── package.json
├── package-lock.json
├── README.md
├── .env
├── .env.example
├── .gitignore
│
├── data/
│   ├── activities.json
│   ├── ll_questions.json
│   ├── problems.json
│   ├── uploads.json
│   └── users.json
│
├── public/
│   │
│   ├── css/
│   │   ├── ai.css
│   │   ├── maps.css
│   │   └── style.css
│   │
│   ├── js/
│   │   ├── ai.js
│   │   ├── auth.js
│   │   ├── maps.js
│   │   ├── nav.js
│   │   └── upload.js
│   │
│   ├── data/
│   ├── datasets/
│   ├── public/
│   │
│   ├── about.html
│   ├── admin.html
│   ├── ai.html
│   ├── dashboard.html
│   ├── learning.html
│   ├── login.html
│   ├── maps.html
│   ├── practice.html
│   ├── problem.html
│   ├── resources.html
│   └── upload.html
```

---

# ⚙️ Installation & Setup

## Prerequisites
- Node.js (v14 or above)
- npm

---

## 1️⃣ Clone Repository

```bash
git clone https://github.com/mayurii-26/DRIVESmart.git
cd DRIVESmart
```

---

## 2️⃣ Install Dependencies

```bash
npm install
```

---

## 3️⃣ Configure Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000

# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 4️⃣ Start the Application

```bash
npm start
```

---

## 5️⃣ Run the Project

Open browser:

```text
http://localhost:3000
```

or deployed version:

```text
https://drivesmart-4xnr.onrender.com/
```

---

# 🔑 Default Admin Credentials

```text
Email: admin@drivesmart.gov.in
Password: admin123
```

⚠️ Change credentials before production deployment.

---

# 🌐 Main Modules

| Module | Description |
|---|---|
| AI Assistant | Intelligent transportation and RTO guidance |
| Maps & Navigation | Smart route and traffic assistance |
| Learning Hub | Educational transportation resources |
| Driving Test | Mock DL/LL preparation |
| Upload System | Secure document management |
| Admin Panel | Monitoring and management |

---

# 🔒 Security Features

- Password hashing using bcrypt
- Session-based authentication
- Protected API routes
- File upload validation
- Admin role-based access control
- Environment variable protection

---

# 📌 API Endpoints

## Authentication
- `POST /api/register`
- `POST /api/login`
- `POST /api/logout`

## AI Assistant
- `POST /api/chat`

## Uploads
- `POST /api/upload`
- `GET /api/uploads`

## Problems
- `POST /api/problem`

## Admin
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `GET /api/admin/problems`

---

# 🚀 Deployment

The project is deployed using:

- Render (Backend + Hosting)
- GitHub (Version Control)

---

# 📖 Research Focus

The Drive Smart Portal focuses on:
- AI-powered transportation assistance
- Intelligent navigation systems
- Smart RTO digitalization
- Road safety awareness
- Conversational AI integration
- User-centric smart transportation support

---

# 📄 License

This project is developed for academic and research purposes.

---
