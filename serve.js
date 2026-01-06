const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Schemas
const assignmentSchema = new mongoose.Schema({
  title: String,
  subject: { type: String, enum: ['math', 'science', 'history', 'english', 'cs'] },
  dueDate: Date,
  status: { type: String, enum: ['pending', 'in-progress', 'submitted', 'completed', 'overdue'], default: 'pending' },
  description: String,
  userId: String
});

const noticeSchema = new mongoose.Schema({
  title: String,
  content: String,
  date: { type: Date, default: Date.now }
});

const facultySchema = new mongoose.Schema({
  name: String,
  department: String,
  phone: String
});

const Assignment = mongoose.model('Assignment', assignmentSchema);
const Notice = mongoose.model('Notice', noticeSchema);
const Faculty = mongoose.model('Faculty', facultySchema);

// Sample Data (runs once)
async function seedData() {
  if (await Assignment.countDocuments() === 0) {
    await Assignment.insertMany([
      { title: "Calculus Problem Set #3", subject: "math", dueDate: new Date('2026-01-07'), description: "Complete derivative problems", userId: "demo" },
      { title: "Data Structures Project", subject: "cs", dueDate: new Date('2026-01-18'), description: "Binary search tree implementation", userId: "demo", status: "in-progress" },
      { title: "Literature Essay", subject: "english", dueDate: new Date('2026-01-12'), description: "Great Gatsby analysis", userId: "demo", status: "submitted" }
    ]);
    
    await Notice.insertMany([
      { title: "Mid-term Exam Schedule", content: "Exams Oct 15-20" },
      { title: "Library Hours Extended", content: "Open until 10 PM weekdays" }
    ]);
    
    await Faculty.insertMany([
      { name: "Prof. Robert Chen", department: "Mathematics", phone: "+91-98765-43210" },
      { name: "Dr. Sarah Williams", department: "Computer Science", phone: "+91-98765-43211" }
    ]);
  }
}
seedData();

// API Routes

// Dashboard Stats
app.get('/api/stats', async (req, res) => {
  const stats = {
    pending: await Assignment.countDocuments({ status: 'pending', userId: 'demo' }),
    dueThisWeek: await Assignment.countDocuments({ 
      dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 7*24*60*60*1000) },
      userId: 'demo'
    }),
    completed: await Assignment.countDocuments({ status: 'completed', userId: 'demo' }),
    upcoming: 5
  };
  res.json(stats);
});

// Assignments
app.get('/api/assignments', async (req, res) => {
  const { filter, subject } = req.query;
  let query = { userId: 'demo' };
  
  if (filter && filter !== 'all') query.status = filter;
  if (subject) query.subject = subject;
  
  const assignments = await Assignment.find(query).sort({ dueDate: 1 });
  res.json(assignments);
});

app.post('/api/assignments/:id/complete', async (req, res) => {
  const assignment = await Assignment.findByIdAndUpdate(
    req.params.id, 
    { status: 'completed' },
    { new: true }
  );
  res.json({ success: true, assignment });
});

app.post('/api/assignments/:id/status', async (req, res) => {
  const { status } = req.body;
  const assignment = await Assignment.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );
  res.json({ success: true, assignment });
});

// Notices
app.get('/api/notices', async (req, res) => {
  const notices = await Notice.find().sort({ date: -1 }).limit(5);
  res.json(notices);
});

// Faculty
app.get('/api/faculty', async (req, res) => {
  const faculty = await Faculty.find();
  res.json(faculty);
});

// Courses (static for demo)
app.get('/api/courses', (req, res) => {
  res.json([
    {
      name: "Mathematics",
      professor: "Prof. Robert Chen",
      progress: 75,
      assignments: 4,
      lectures: 12,
      grade: "85%"
    },
    {
      name: "Computer Science",
      professor: "Dr. Sarah Williams", 
      progress: 68,
      assignments: 6,
      lectures: 15,
      grade: "92%"
    }
  ]);
});

// AI Assistant (mock responses)
app.post('/api/ai/assistant', (req, res) => {
  const { question, subject } = req.body;
  res.json({
    response: `For ${subject}: "${question}" - Here's a detailed study plan with key concepts, practice problems, and resources tailored to your needs.`,
    suggestions: [
      "Review key formulas first",
      "Practice 5 similar problems",
      "Watch 2 tutorial videos",
      "Take a 10-min quiz"
    ],
    resources: ["Khan Academy", "YouTube Tutorial", "Practice Worksheet"]
  });
});

app.get('/api/calendar/events', (req, res) => {
  res.json([
    { title: "Calculus Assignment Due", date: "2026-01-07", time: "10:00 AM" },
    { title: "CS Project Review", date: "2026-01-10", time: "2:00 PM" }
  ]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
