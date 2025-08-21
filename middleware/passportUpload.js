// middleware/passportUpload.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'passport-uploads',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
    resource_type: 'auto', // Allows both images and raw files like PDF
    transformation: [
      {
        width: 800,
        height: 600,
        crop: 'limit',
        quality: 'auto:good'
      }
    ]
  }
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Middleware for single passport file upload
const uploadPassport = upload.single('passport');

// Wrapper middleware with error handling
const passportUploadMiddleware = (req, res, next) => {
  uploadPassport(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size allowed is 5MB.'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${error.message}`
        });
      }
      
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No passport file provided'
      });
    }
    
    next();
  });
};

module.exports = passportUploadMiddleware;