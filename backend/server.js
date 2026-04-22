const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const dashboardRoutes = require('./src/routes/dashboard');
const staffRoutes = require('./src/routes/staff');
const attendanceRoutes = require('./src/routes/attendance');
const leaveRoutes = require('./src/routes/leaves');
const performanceRoutes = require('./src/routes/performance');
const salaryRoutes = require('./src/routes/salary');
const payslipRoutes = require('./src/routes/payslip');
const projectRoutes = require('./src/routes/projects');
const taskRoutes = require('./src/routes/tasks');
const idCardsRoutes = require('./src/routes/idcards');
const notificationsRoutes = require('./src/routes/notifications');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: "API running" });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/payslip', payslipRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/idcards', idCardsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: 'SERVER_ERROR'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
