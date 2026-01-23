# Drive Smart Portal

A comprehensive unified web application for RTO services, learning resources, and document management.

## Features

- 🔐 **Secure Authentication**: Login/Sign-Up system with session management
- 🤖 **RTO AI Assistant**: Verified, structured responses for all RTO services
- 💬 **Dataset Chatbot**: Upload CSV/JSON files and query with intelligent search
- 📚 **Learning Hub**: 14+ curated learning resources with progress tracking
- 🔗 **Resource Links**: 20+ government portals with detailed guides
- 📤 **Document Upload**: Secure cloud storage with Cloudinary integration
- ❓ **Ask Your Problem**: Submit issues for admin review
- 👨‍💼 **Admin Panel**: Analytics, user management, and activity tracking

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. (Optional) Set up Cloudinary for document uploads:
   - Create a `.env` file in the root directory
   - Add your Cloudinary credentials:
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```
   - If not set, document uploads will use placeholder credentials (configure for production)

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

### Default Admin Credentials

- **Email**: `admin@drivesmart.gov.in`
- **Password**: `admin123`

⚠️ **Important**: Change the admin password in production!

## Project Structure

```
drive-smart-portal/
├── server.js              # Express server (backend + API routes)
├── package.json           # Dependencies and scripts
├── data/                  # JSON data storage (auto-created)
│   ├── users.json
│   ├── activities.json
│   ├── uploads.json
│   └── problems.json
└── public/                # Frontend files
    ├── css/
    │   └── style.css      # Unified stylesheet
    ├── js/
    │   ├── auth.js        # Authentication logic
    │   └── nav.js         # Navigation logic
    └── *.html             # All HTML pages
```

## Pages

- `/` or `/login.html` - Login/Sign-Up (default)
- `/dashboard.html` - Main dashboard
- `/rto-assistant.html` - RTO AI Assistant
- `/chatbot.html` - Dataset-based chatbot
- `/learning.html` - Learning Hub
- `/resources.html` - Government resource links
- `/upload.html` - Document upload system
- `/ask-problem.html` - Submit problems
- `/about.html` - About us page
- `/admin.html` - Admin panel (admin only)

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### RTO Assistant
- `POST /api/rto-assistant` - Query RTO services

### Chatbot
- `POST /api/chatbot/upload` - Upload CSV/JSON dataset
- `POST /api/chatbot/query` - Query dataset
- `GET /api/chatbot/dataset` - Check dataset status

### Documents
- `POST /api/upload` - Upload document
- `GET /api/uploads` - Get user's documents

### Problems
- `POST /api/problem` - Submit problem

### Admin
- `GET /api/admin/stats` - Get statistics
- `GET /api/admin/activities` - Get activities
- `GET /api/admin/users` - Get all users
- `GET /api/admin/problems` - Get all problems

## Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **Authentication**: Express Sessions, bcryptjs
- **File Upload**: Multer, Cloudinary
- **Data Storage**: JSON files (can be migrated to database)

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- Protected routes with middleware
- Admin role-based access control
- Secure file upload validation

## Development

The application runs as a single unified server. All frontend files are served from the `/public` directory, and all API routes are handled by the Express server in `server.js`.

### Adding New Features

1. **New Page**: Create HTML file in `/public` directory
2. **New API Route**: Add route handler in `server.js`
3. **Styling**: Use existing CSS variables in `/public/css/style.css`

## Production Deployment

1. Set environment variables for Cloudinary
2. Change session secret in `server.js`
3. Change default admin password
4. Consider migrating from JSON files to a database
5. Enable HTTPS
6. Set up proper error logging

## License

ISC

## Support

For issues or questions, submit a problem through the "Ask Your Problem" page in the application.

