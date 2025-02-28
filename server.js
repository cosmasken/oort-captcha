// const AWS = require("aws-sdk");
// require("dotenv").config();
// const express = require('express');
// const fs = require('fs');
// const path = require('path');
// const bodyParser = require('body-parser');
// const session = require('express-session');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.static('public'));
// app.use(session({
//   secret: 'captcha-secret-key',
//   resave: false,
//   saveUninitialized: true,
//   cookie: { maxAge: 600000 } // 10 minutes
// }));

// // Path to captcha images folder
// const CAPTCHA_FOLDER = path.join(__dirname, 'captcha_images');
// const CAPTCHA_METADATA_FILE = path.join(__dirname, 'captcha_metadata.json');

// // Function to get random captcha images
// function getRandomCaptchaImages(count = 9, correctCount = 3) {
//   // Read all images from the captcha folder
//   const files = fs.readdirSync(CAPTCHA_FOLDER);
//   const captchaImages = [];
  
//   // Read metadata file
//   const metadata = JSON.parse(fs.readFileSync(CAPTCHA_METADATA_FILE, 'utf8'));
  
//   // Get a random label from the metadata
//   const labels = Object.values(metadata);
//   const uniqueLabels = [...new Set(labels)];
//   const desiredLabel = uniqueLabels[Math.floor(Math.random() * uniqueLabels.length)];
  
//   // Filter files to get only those that match the desired label
//   const labelFiles = files.filter(file => metadata[file] === desiredLabel);
  
//   // Ensure there are at least 3 correct images
//   if (labelFiles.length < correctCount) {
//     return { error: `Not enough images for label: ${desiredLabel}` };
//   }
  
//   // Shuffle the label files and select the required number of correct images
//   const shuffledLabelFiles = labelFiles.sort(() => 0.5 - Math.random()).slice(0, correctCount);
  
//   // Add the correct images to the captchaImages array
//   shuffledLabelFiles.forEach((file, index) => {
//     captchaImages.push({
//       id: index,
//       file: file,
//       path: `/captcha_images/${file}`,
//       isCorrect: true,
//       label: desiredLabel
//     });
//   });
  
//   // Fill the remaining slots with random images
//   const remainingFiles = files.filter(file => !shuffledLabelFiles.includes(file));
//   const shuffledRemainingFiles = remainingFiles.sort(() => 0.5 - Math.random()).slice(0, count - correctCount);
  
//   shuffledRemainingFiles.forEach((file, index) => {
//     const label = metadata[file];
//     captchaImages.push({
//       id: correctCount + index,
//       file: file,
//       path: `/captcha_images/${file}`,
//       isCorrect: label === desiredLabel,
//       label: label
//     });
//   });
  
//   // Shuffle the entire captchaImages array
//   const shuffledCaptchaImages = captchaImages.sort(() => 0.5 - Math.random());
  
//   return { images: shuffledCaptchaImages, label: desiredLabel };
// }

// const s3 = new AWS.S3({
//   endpoint: process.env.OORT_ENDPOINT,
//   accessKeyId: process.env.OORT_ACCESS_KEY_ID,
//   secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY,
//   s3ForcePathStyle: true,
//   signatureVersion: "v4",
// });

// AWS.config.update({ region: "us-east-1" });

// // Endpoint to list buckets
// app.get("/api/list-buckets", async (req, res) => {
//   try {
//     const data = await s3.listBuckets().promise();
//     res.json(data.Buckets);
//   } catch (err) {
//     res.status(500).send({ error: err.message });
//   }
// });

// // Endpoint to list objects in a bucket
// app.get("/api/list-objects/:bucketName", async (req, res) => {
//   const params = {
//     Bucket: req.params.bucketName,
//   };
//   try {
//     const data = await s3.listObjectsV2(params).promise();
//     res.json(data.Contents);
//   } catch (err) {
//     console.log("Server Error:", err);
//     res.status(500).send({ error: err.message });
//   }
// });
 
// // Endpoint to generate a signed URL for uploading
// app.get("/api/upload-url/:bucketName/:fileName", async (req, res) => {
//   const { bucketName, fileName } = req.params;
//   const params = {
//     Bucket: bucketName,
//     Key: fileName,
//     Expires: 60, // URL expires in 60 seconds
//     ContentType: "application/octet-stream", // You can specify the content type
//   };
//   try {
//     const url = await s3.getSignedUrlPromise("putObject", params);
//     res.json({ uploadUrl: url });
//   } catch (err) {
//     console.log("Server Error:", err);
//     res.status(500).send({ error: err.message });
//   }
// });

// // Routes
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// // Get new captcha images
// app.get('/api/captcha', (req, res) => {
//   try {
//     const result = getRandomCaptchaImages();
    
//     if (result.error) {
//       return res.status(400).json({ error: result.error });
//     }
    
//     const captchaImages = result.images;
//     const desiredLabel = result.label;
    
//     // Store correct answers in session
//     const correctImages = captchaImages.filter(img => img.isCorrect);
//     req.session.correctCaptchaIds = correctImages.map(img => img.id);
    
//     // Return only the necessary data to the client
//     const clientImages = captchaImages.map(img => ({
//       id: img.id,
//       path: img.path,
//       label: img.label
//     }));
    
//     res.json({
//       message: `Select all the ${desiredLabel} images`,
//       type: desiredLabel, // Instruction based on image type
//       images: clientImages
//     });
//   } catch (error) {
//     console.error('Error generating captcha:', error);
//     res.status(500).json({ error: 'Failed to generate captcha' });
//   }
// });

// // Verify captcha submission
// app.post('/api/verify-captcha', (req, res) => {
//   const { selectedIds } = req.body;
  
//   if (!req.session.correctCaptchaIds) {
//     return res.status(400).json({ 
//       success: false, 
//       message: 'CAPTCHA session expired. Please try again.' 
//     });
//   }
  
//   // Convert to arrays of numbers if they aren't already
//   const selected = Array.isArray(selectedIds) ? selectedIds : [selectedIds];
//   const correct = req.session.correctCaptchaIds;
  
//   // Check if all correct images were selected (and no incorrect ones)
//   const allCorrectSelected = correct.every(id => selected.includes(id));
//   const noIncorrectSelected = selected.every(id => correct.includes(id));
  
//   const success = allCorrectSelected && noIncorrectSelected;
  
//   // Clear the session data after verification
//   if (success) {
//     req.session.correctCaptchaIds = null;
//   }
  
//   res.json({
//     success: success,
//     message: success ? 'CAPTCHA verification successful!' : 'CAPTCHA verification failed. Please try again.'
//   });
// });

// // Serve captcha images
// app.use('/captcha_images', express.static(CAPTCHA_FOLDER));

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

const AWS = require("aws-sdk");
require("dotenv").config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors'); // Import the cors package

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'captcha-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 600000 } // 10 minutes
}));

// Path to captcha images folder
const CAPTCHA_FOLDER = path.join(__dirname, 'captcha_images');
const CAPTCHA_METADATA_FILE = path.join(__dirname, 'captcha_metadata.json');

// Function to get random captcha images
function getRandomCaptchaImages(count = 9, correctCount = 3) {
  // Read all images from the captcha folder
  const files = fs.readdirSync(CAPTCHA_FOLDER);
  const captchaImages = [];
  
  // Read metadata file
  const metadata = JSON.parse(fs.readFileSync(CAPTCHA_METADATA_FILE, 'utf8'));
  
  // Get a random label from the metadata
  const labels = Object.values(metadata);
  const uniqueLabels = [...new Set(labels)];
  const desiredLabel = uniqueLabels[Math.floor(Math.random() * uniqueLabels.length)];
  
  // Filter files to get only those that match the desired label
  const labelFiles = files.filter(file => metadata[file] === desiredLabel);
  
  // Ensure there are at least 3 correct images
  if (labelFiles.length < correctCount) {
    return { error: `Not enough images for label: ${desiredLabel}` };
  }
  
  // Shuffle the label files and select the required number of correct images
  const shuffledLabelFiles = labelFiles.sort(() => 0.5 - Math.random()).slice(0, correctCount);
  
  // Add the correct images to the captchaImages array
  shuffledLabelFiles.forEach((file, index) => {
    captchaImages.push({
      id: index,
      file: file,
      path: `/captcha_images/${file}`,
      isCorrect: true,
      label: desiredLabel
    });
  });
  
  // Fill the remaining slots with random images
  const remainingFiles = files.filter(file => !shuffledLabelFiles.includes(file));
  const shuffledRemainingFiles = remainingFiles.sort(() => 0.5 - Math.random()).slice(0, count - correctCount);
  
  shuffledRemainingFiles.forEach((file, index) => {
    const label = metadata[file];
    captchaImages.push({
      id: correctCount + index,
      file: file,
      path: `/captcha_images/${file}`,
      isCorrect: label === desiredLabel,
      label: label
    });
  });
  
  // Shuffle the entire captchaImages array
  const shuffledCaptchaImages = captchaImages.sort(() => 0.5 - Math.random());
  
  return { images: shuffledCaptchaImages, label: desiredLabel };
}

const s3 = new AWS.S3({
  endpoint: process.env.OORT_ENDPOINT,
  accessKeyId: process.env.OORT_ACCESS_KEY_ID,
  secretAccessKey: process.env.OORT_SECRET_ACCESS_KEY,
  s3ForcePathStyle: true,
  signatureVersion: "v4",
});

AWS.config.update({ region: "us-east-1" });

// Endpoint to list buckets
app.get("/api/list-buckets", async (req, res) => {
  try {
    const data = await s3.listBuckets().promise();
    res.json(data.Buckets);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Endpoint to list objects in a bucket
app.get("/api/list-objects/:bucketName", async (req, res) => {
  const params = {
    Bucket: req.params.bucketName,
  };
  try {
    const data = await s3.listObjectsV2(params).promise();
    res.json(data.Contents);
  } catch (err) {
    console.log("Server Error:", err);
    res.status(500).send({ error: err.message });
  }
});
 
// Endpoint to generate a signed URL for uploading
app.get("/api/upload-url/:bucketName/:fileName", async (req, res) => {
  const { bucketName, fileName } = req.params;
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Expires: 60, // URL expires in 60 seconds
    ContentType: "application/octet-stream", // You can specify the content type
  };
  try {
    const url = await s3.getSignedUrlPromise("putObject", params);
    res.json({ uploadUrl: url });
  } catch (err) {
    console.log("Server Error:", err);
    res.status(500).send({ error: err.message });
  }
});

// Get new captcha images
app.get('/api/captcha', (req, res) => {
  try {
    const result = getRandomCaptchaImages();
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    const captchaImages = result.images;
    const desiredLabel = result.label;
    
    // Store correct answers in session
    const correctImages = captchaImages.filter(img => img.isCorrect);
    req.session.correctCaptchaIds = correctImages.map(img => img.id);
    
    // Return only the necessary data to the client
    const clientImages = captchaImages.map(img => ({
      id: img.id,
      path: img.path,
      label: img.label
    }));
    
    res.json({
      message: `Select all the ${desiredLabel} images`,
      type: desiredLabel, // Instruction based on image type
      images: clientImages
    });
  } catch (error) {
    console.error('Error generating captcha:', error);
    res.status(500).json({ error: 'Failed to generate captcha' });
  }
});

// Verify captcha submission
app.post('/api/verify-captcha', (req, res) => {
  const { selectedIds } = req.body;
  
  if (!req.session.correctCaptchaIds) {
    return res.status(400).json({ 
      success: false, 
      message: 'CAPTCHA session expired. Please try again.' 
    });
  }
  
  // Convert to arrays of numbers if they aren't already
  const selected = Array.isArray(selectedIds) ? selectedIds : [selectedIds];
  const correct = req.session.correctCaptchaIds;
  
  // Check if all correct images were selected (and no incorrect ones)
  const allCorrectSelected = correct.every(id => selected.includes(id));
  const noIncorrectSelected = selected.every(id => correct.includes(id));
  
  const success = allCorrectSelected && noIncorrectSelected;
  
  // Clear the session data after verification
  if (success) {
    req.session.correctCaptchaIds = null;
  }
  
  res.json({
    success: success,
    message: success ? 'CAPTCHA verification successful!' : 'CAPTCHA verification failed. Please try again.'
  });
});

// Serve captcha images
app.use('/captcha_images', express.static(CAPTCHA_FOLDER));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});