const multer = require('multer');
const { BadRequestError } = require('../utils/errors');

// Memory storage keeps file buffers in memory
const storage = multer.memoryStorage();

// File filter restricts uploads to images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Not an image! Please upload only images (jpeg, png, webp).'), false);
  }
};

// Size limit of 2MB
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});

module.exports = upload;
