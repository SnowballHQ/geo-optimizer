const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// ImgBB upload function
const uploadToImgBB = async (filePath, filename) => {
  const imgbbApiKey = process.env.IMGBB_API_KEY;
  
  if (!imgbbApiKey || imgbbApiKey === 'your_imgbb_api_key_here') {
    throw new Error('ImgBB API key not configured. Please add IMGBB_API_KEY to your .env file');
  }

  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(filePath));
    formData.append('name', filename);

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${imgbbApiKey}`,
      formData,
      {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    if (response.data.success) {
      return {
        success: true,
        data: {
          url: response.data.data.url,
          display_url: response.data.data.display_url,
          delete_url: response.data.data.delete_url,
          size: response.data.data.size,
        }
      };
    } else {
      throw new Error('ImgBB upload failed: ' + (response.data.error?.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('ImgBB upload error:', error.response?.data || error.message);
    throw error;
  }
};

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads/images');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `image-${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'), false);
  }
};

// Configure upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// POST /api/v1/upload/image - Upload single image
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    // Get local file path
    const localFilePath = req.file.path;
    
    try {
      // Upload to ImgBB
      console.log('Uploading to ImgBB:', req.file.filename);
      const imgbbResult = await uploadToImgBB(localFilePath, req.file.filename);
      
      console.log('Image uploaded successfully to ImgBB:', {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        localUrl: `${req.get('x-forwarded-proto') || req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`,
        imgbbUrl: imgbbResult.data.url
      });

      res.json({
        success: true,
        data: {
          url: imgbbResult.data.url, // Use ImgBB URL as primary
          imgbbUrl: imgbbResult.data.url,
          localUrl: `${req.get('x-forwarded-proto') || req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
          deleteUrl: imgbbResult.data.delete_url
        },
        message: 'Image uploaded successfully to ImgBB'
      });

      // Clean up local file after successful ImgBB upload (optional)
      // fs.unlink(localFilePath, (err) => {
      //   if (err) console.warn('Failed to delete local file:', err);
      // });

    } catch (imgbbError) {
      console.error('ImgBB upload failed, falling back to local URL:', imgbbError.message);
      
      // Fallback to local URL if ImgBB fails
      const localUrl = `${req.get('x-forwarded-proto') || req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`;
      
      res.json({
        success: true,
        data: {
          url: localUrl,
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
          warning: 'ImgBB upload failed, using local storage: ' + imgbbError.message
        },
        message: 'Image uploaded locally (ImgBB failed)'
      });
    }

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image'
    });
  }
});

// POST /api/v1/upload/webflow-asset - Upload asset to Webflow (if supported)
router.post('/webflow-asset', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const { siteId } = req.body;
    if (!siteId) {
      return res.status(400).json({
        success: false,
        error: 'Site ID is required for Webflow asset upload'
      });
    }

    // TODO: Implement Webflow asset upload once API supports it
    // For now, fall back to local upload
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    const imageUrl = `${baseUrl}/uploads/images/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        note: 'Uploaded to local server (Webflow asset upload not yet available)'
      },
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading to Webflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload asset to Webflow'
    });
  }
});

// GET /api/v1/upload/images - List uploaded images
router.get('/images', async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../public/uploads/images');
    
    if (!fs.existsSync(uploadsDir)) {
      return res.json({
        success: true,
        data: [],
        message: 'No images found'
      });
    }

    const files = fs.readdirSync(uploadsDir);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });

    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    const images = imageFiles.map(filename => {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      
      return {
        filename,
        url: `${baseUrl}/uploads/images/${filename}`,
        size: stats.size,
        uploadedAt: stats.birthtime
      };
    });

    res.json({
      success: true,
      data: images,
      message: `Found ${images.length} images`
    });

  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list images'
    });
  }
});

module.exports = router;