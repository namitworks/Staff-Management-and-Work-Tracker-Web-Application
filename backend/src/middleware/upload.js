const fs = require('fs');
const path = require('path');
const multer = require('multer');

const avatarsDir = path.join(__dirname, '../../uploads/avatars');

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const rawUserId = req.params.id || req.user?.id || 'user';
    const safeUserId = String(rawUserId).replace(/[^a-zA-Z0-9_-]/g, '');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${safeUserId}-${Date.now()}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExt = ['.jpg', '.jpeg', '.png', '.webp'];

  if (allowedMimes.includes(file.mimetype) && allowedExt.includes(ext)) {
    cb(null, true);
    return;
  }

  cb(new Error('Only jpg, jpeg, png, and webp files are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});

module.exports = upload;
