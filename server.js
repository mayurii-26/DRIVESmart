const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const csv = require('csv-parser');
const bcrypt = require('bcryptjs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables from .env file
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'drive-smart-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Authentication middleware for HTML files (before static files)
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    // Allow login and signup pages
    if (req.path === '/login.html' || req.path === '/signup.html') {
      if (req.session.user) {
        return res.redirect('/dashboard.html');
      }
      return next();
    }
    
    // Admin page requires admin role
    if (req.path === '/admin.html') {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Access denied. Admin privileges required.');
      }
      return next();
    }
    
    // All other HTML pages require authentication
    if (!req.session.user) {
      return res.redirect('/login.html');
    }
  }
  next();
});

// Serve static files from public directory (absolute path for Render compatibility)
app.use(express.static(path.join(__dirname, 'public'), {
  index: false,
  dotfiles: 'deny'
}));

// Disable directory listing
app.use((req, res, next) => {
  if (req.path.endsWith('/') && req.path !== '/') {
    return res.status(403).send('Directory listing disabled');
  }
  next();
});

// Initialize data storage
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const usersFile = path.join(dataDir, 'users.json');
const problemsFile = path.join(dataDir, 'problems.json');
const activitiesFile = path.join(dataDir, 'activities.json');
const uploadsFile = path.join(dataDir, 'uploads.json');

// Initialize data files
function initDataFile(filePath, defaultValue = []) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  }
}

initDataFile(usersFile);
initDataFile(problemsFile);
initDataFile(activitiesFile);
initDataFile(uploadsFile);

// Create default admin user if not exists
function initAdmin() {
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  const adminExists = users.find(u => u.email === 'admin@drivesmart.gov.in');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    users.push({
      id: 'admin-001',
      name: 'Administrator',
      email: 'admin@drivesmart.gov.in',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  }
}

initAdmin();

// Cloudinary configuration - ONLY if real environment variables are present
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Validate Cloudinary credentials - only configure if all real values are present
let isCloudinaryConfigured = false;
if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET &&
    CLOUDINARY_CLOUD_NAME !== 'your-cloud-name' &&
    CLOUDINARY_API_KEY !== 'your-api-key' &&
    CLOUDINARY_API_SECRET !== 'your-api-secret' &&
    CLOUDINARY_CLOUD_NAME.trim() !== '' &&
    CLOUDINARY_API_KEY.trim() !== '' &&
    CLOUDINARY_API_SECRET.trim() !== '') {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME.trim(),
    api_key: CLOUDINARY_API_KEY.trim(),
    api_secret: CLOUDINARY_API_SECRET.trim()
  });
  isCloudinaryConfigured = true;
  console.log('✅ Cloudinary configured successfully');
} else {
  console.warn('⚠️ Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env file');
  console.warn('   File uploads will not work until Cloudinary is properly configured.');
}

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Only allow PDF, JPG, and PNG files
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const allowedExtensions = /\.(jpg|jpeg|png|pdf)$/i;
    
    const isValidMimeType = allowedMimeTypes.includes(file.mimetype);
    const isValidExtension = allowedExtensions.test(file.originalname);
    
    if (isValidMimeType && isValidExtension) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, JPG, and PNG files are allowed'));
  }
});

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login.html');
}

function requireAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.status(403).send('Access denied. Admin privileges required.');
}

// Routes

// Default route - always serve login
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/dashboard.html');
  } else {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }
});

// API Routes

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: 'user-' + Date.now(),
      name,
      email,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    
    res.json({ success: true, message: 'Registration successful' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    // Log activity
    const activities = JSON.parse(fs.readFileSync(activitiesFile, 'utf8'));
    activities.push({
      userId: user.id,
      userName: user.name,
      action: 'login',
      timestamp: new Date().toISOString(),
      details: { email: user.email }
    });
    fs.writeFileSync(activitiesFile, JSON.stringify(activities, null, 2));
    
    res.json({ success: true, user: req.session.user });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/user', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Gemini model priority list — tries each in order if quota exceeded
const GEMINI_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite'
];

const SYSTEM_INSTRUCTION = `You are the Drive Smart Assistant, an AI exclusively for the Drive Smart Portal — an Indian RTO services platform.

You ONLY answer questions related to:
- Traffic rules and road safety in India
- RTO services (Learner's License, Driving License, RC, NOC, PUC, hypothecation removal, vehicle scrappage, international driving permit)
- Vehicle registration, transfer, and documentation
- Driving test preparation and guidance
- Vehicle insurance (motor)
- Traffic challans and penalties
- Navigation and route assistance
- Transport regulations and Motor Vehicles Act
- Parivahan Sewa portal guidance

If a user asks about ANYTHING outside this domain (movies, coding, politics, sports, personal advice, general knowledge, science, history, etc.), politely refuse:
"I am the Drive Smart Assistant and can only help with transportation, RTO, driving, and traffic-related queries."

Be concise and professional. Use bullet points or numbered steps for procedures. Mention parivahan.gov.in when applicable.`;

// Gemini AI Chat Route
app.post('/api/chat', requireAuth, async (req, res) => {
  const { message, history } = req.body;
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    return res.status(503).json({ error: 'AI service not configured. Please add GEMINI_API_KEY to .env file.' });
  }

  // Limit history to last 6 exchanges to reduce token usage
  const trimmedHistory = (history || []).slice(-12).map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));

  console.log(`📨 [/api/chat] User: ${req.session.user.email} | Message: "${message.substring(0, 80)}"`);

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = null;

  // Try each model in priority order
  for (const modelName of GEMINI_MODELS) {
    console.log(`🤖 Trying model: ${modelName}`);
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_INSTRUCTION
      });

      const chat = model.startChat({ history: trimmedHistory });
      const result = await chat.sendMessage(message.trim());
      const reply = result.response.text();

      // Log activity
      const activities = JSON.parse(fs.readFileSync(activitiesFile, 'utf8'));
      activities.push({
        userId: req.session.user.id,
        userName: req.session.user.name,
        action: 'ai_chat',
        timestamp: new Date().toISOString(),
        details: { message: message.substring(0, 100), model: modelName }
      });
      fs.writeFileSync(activitiesFile, JSON.stringify(activities, null, 2));

      return res.json({ success: true, reply });
    } catch (error) {
      lastError = error;
      console.error(`❌ [${modelName}] Error status: ${error.status} | Message: ${error.message}`);
      const status = error.status || (error.message && error.message.includes('429') ? 429 : 0);
      if (status === 429) {
        console.warn(`⚠️ [${modelName}] Quota exceeded, trying next model...`);
        continue;
      }
      console.error(`❌ [${modelName}] Non-quota error, stopping fallback. Full error:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
      break;
    }
  }

  // All models failed — return appropriate error
  console.error('Gemini API error:', lastError && lastError.message);
  const errMsg = lastError && lastError.message || '';
  if (errMsg.includes('429')) {
    return res.status(429).json({ error: 'AI service is busy right now. Please wait a moment and try again.' });
  }
  if (errMsg.includes('403') || errMsg.includes('API_KEY')) {
    return res.status(403).json({ error: 'AI service configuration error. Please contact admin.' });
  }
  res.status(500).json({ error: 'AI service temporarily unavailable. Please try again.' });
});

// Legacy assistant route — redirects to Gemini chat
app.post('/api/assistant', requireAuth, (req, res) => {
  res.json({ success: false, error: 'This endpoint is deprecated. Please use /api/chat.' });
});

// Document Upload with multer error handling
app.post('/api/upload', requireAuth, (req, res, next) => {
  upload.single('document')(req, res, (err) => {
    if (err) {
      // Handle multer errors (file size, file type, etc.)
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size exceeds 10MB limit' });
        }
        return res.status(400).json({ error: 'Upload error: ' + err.message });
      }
      // Handle fileFilter errors
      if (err.message) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: 'File upload error' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Validate Cloudinary configuration
    if (!isCloudinaryConfigured) {
      console.error('❌ Upload failed: Cloudinary not configured');
      return res.status(500).json({ 
        error: 'Cloudinary not configured – please update .env file with CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET' 
      });
    }
    
    // Double-check env vars are valid (not placeholders)
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
    
    if (!cloudName || !apiKey || !apiSecret ||
        cloudName === 'your-cloud-name' || apiKey === 'your-api-key' || apiSecret === 'your-api-secret') {
      console.error('❌ Upload failed: Invalid Cloudinary credentials in .env');
      return res.status(500).json({ 
        error: 'Cloudinary not configured – please update .env file with real Cloudinary credentials' 
      });
    }
    
    // Validate file buffer exists
    if (!req.file.buffer) {
      return res.status(400).json({ error: 'File buffer is missing' });
    }
    
    // Validate file size (10MB limit)
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 10MB limit' });
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Only PDF, JPG, and PNG files are allowed' });
    }
    
    // Ensure Cloudinary is configured with latest env vars
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });
    
    // Upload to Cloudinary using upload_stream
    const uploadResult = await new Promise((resolve, reject) => {
      const isPdf = req.file.mimetype === 'application/pdf';
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          resource_type: isPdf ? 'raw' : 'image', 
          folder: 'drive-smart',
          allowed_formats: isPdf ? ['pdf'] : ['jpg', 'jpeg', 'png']
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Cloudinary upload successful:', result.secure_url);
            resolve(result);
          }
        }
      );
      
      // Write buffer to upload stream
      // upload_stream.end() can accept data directly, so we write buffer and end stream
      uploadStream.end(req.file.buffer);
    });
    
    if (!uploadResult || !uploadResult.secure_url) {
      throw new Error('Cloudinary upload failed - no URL returned');
    }
    
    const uploadRecord = {
      id: 'upload-' + Date.now(),
      userId: req.session.user.id,
      userName: req.session.user.name,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      cloudinaryUrl: uploadResult.secure_url,
      cloudinaryId: uploadResult.public_id,
      uploadedAt: new Date().toISOString(),
      category: req.body.category || 'general'
    };
    
    // Save upload record
    const uploads = JSON.parse(fs.readFileSync(uploadsFile, 'utf8'));
    uploads.push(uploadRecord);
    fs.writeFileSync(uploadsFile, JSON.stringify(uploads, null, 2));
    
    // Log activity
    const activities = JSON.parse(fs.readFileSync(activitiesFile, 'utf8'));
    activities.push({
      userId: req.session.user.id,
      userName: req.session.user.name,
      action: 'document_upload',
      timestamp: new Date().toISOString(),
      details: { fileName: req.file.originalname, category: uploadRecord.category }
    });
    fs.writeFileSync(activitiesFile, JSON.stringify(activities, null, 2));
    
    res.json({ success: true, upload: uploadRecord });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

app.get('/api/uploads', requireAuth, (req, res) => {
  const uploads = JSON.parse(fs.readFileSync(uploadsFile, 'utf8'));
  const userUploads = req.session.user.role === 'admin' 
    ? uploads 
    : uploads.filter(u => u.userId === req.session.user.id);
  res.json({ success: true, uploads: userUploads });
});

// Ask Your Problem
app.post('/api/problem', requireAuth, (req, res) => {
  try {
    const { problem, category } = req.body;
    const problems = JSON.parse(fs.readFileSync(problemsFile, 'utf8'));
    
    const problemRecord = {
      id: 'prob-' + Date.now(),
      userId: req.session.user.id,
      userName: req.session.user.name,
      userEmail: req.session.user.email,
      problem,
      category: category || 'general',
      status: 'pending',
      submittedAt: new Date().toISOString()
    };
    
    problems.push(problemRecord);
    fs.writeFileSync(problemsFile, JSON.stringify(problems, null, 2));
    
    // Log activity
    const activities = JSON.parse(fs.readFileSync(activitiesFile, 'utf8'));
    activities.push({
      userId: req.session.user.id,
      userName: req.session.user.name,
      action: 'problem_submitted',
      timestamp: new Date().toISOString(),
      details: { problemId: problemRecord.id, category }
    });
    fs.writeFileSync(activitiesFile, JSON.stringify(activities, null, 2));
    
    res.json({ success: true, message: 'Problem submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit problem' });
  }
});

// Admin routes
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  const activities = JSON.parse(fs.readFileSync(activitiesFile, 'utf8'));
  const uploads = JSON.parse(fs.readFileSync(uploadsFile, 'utf8'));
  const problems = JSON.parse(fs.readFileSync(problemsFile, 'utf8'));
  
  const stats = {
    totalUsers: users.filter(u => u.role === 'user').length,
    totalAdmins: users.filter(u => u.role === 'admin').length,
    totalActivities: activities.length,
    totalUploads: uploads.length,
    totalProblems: problems.length,
    recentLogins: activities.filter(a => a.action === 'login').slice(-10),
    aiQueries: activities.filter(a => a.action === 'assistant_query').length,
    chatbotQueries: activities.filter(a => a.action === 'chatbot_query').length,
    uploadsByCategory: {},
    problemsByStatus: {}
  };
  
  uploads.forEach(u => {
    stats.uploadsByCategory[u.category] = (stats.uploadsByCategory[u.category] || 0) + 1;
  });
  
  problems.forEach(p => {
    stats.problemsByStatus[p.status] = (stats.problemsByStatus[p.status] || 0) + 1;
  });
  
  res.json({ success: true, stats });
});

app.get('/api/admin/activities', requireAdmin, (req, res) => {
  const activities = JSON.parse(fs.readFileSync(activitiesFile, 'utf8'));
  res.json({ success: true, activities: activities.reverse().slice(0, 100) });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  const activities = JSON.parse(fs.readFileSync(activitiesFile, 'utf8'));
  
  const usersWithStats = users.map(user => {
    const userActivities = activities.filter(a => a.userId === user.id);
    return {
      ...user,
      password: undefined, // Don't send password
      loginCount: userActivities.filter(a => a.action === 'login').length,
      lastLogin: userActivities.filter(a => a.action === 'login').slice(-1)[0]?.timestamp,
      totalActivities: userActivities.length
    };
  });
  
  res.json({ success: true, users: usersWithStats });
});

app.get('/api/admin/problems', requireAdmin, (req, res) => {
  const problems = JSON.parse(fs.readFileSync(problemsFile, 'utf8'));
  res.json({ success: true, problems: problems.reverse() });
});

// Proxy route for viewing/downloading uploaded documents
app.get('/api/file/:uploadId', requireAuth, async (req, res) => {
  const uploads = JSON.parse(fs.readFileSync(uploadsFile, 'utf8'));
  const upload = uploads.find(u => u.id === req.params.uploadId &&
    (u.userId === req.session.user.id || req.session.user.role === 'admin'));
  if (!upload) return res.status(404).json({ error: 'File not found' });

  try {
    const https = require('https');
    const url = new URL(upload.cloudinaryUrl);
    https.get(upload.cloudinaryUrl, (fileRes) => {
      res.setHeader('Content-Type', upload.fileType);
      const disposition = req.query.download === '1'
        ? `attachment; filename="${upload.fileName}"`
        : `inline; filename="${upload.fileName}"`;
      res.setHeader('Content-Disposition', disposition);
      fileRes.pipe(res);
    }).on('error', () => res.status(500).json({ error: 'Failed to fetch file' }));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Explicit route for ll_questions.json — guaranteed to work on all environments
app.get('/data/ll_questions.json', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'data', 'll_questions.json');
  if (!fs.existsSync(filePath)) {
    console.error('❌ ll_questions.json not found at:', filePath);
    return res.status(404).json({ error: 'Questions file not found' });
  }
  res.sendFile(filePath);
});

// Explicit route for indian-traffic-rules.json
app.get('/data/indian-traffic-rules.json', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'data', 'indian-traffic-rules.json');
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.sendFile(filePath);
});

// HTML files are handled by the middleware above and static file serving

// Start server
app.listen(PORT, () => {
  console.log(`Drive Smart Portal running on http://localhost:${PORT}`);
  console.log('Default admin: admin@drivesmart.gov.in / admin123');
});


