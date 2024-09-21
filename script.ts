const express = require('express');
const sharp = require('sharp');
const { Rembg } = require('@xixiyahaha/rembg-node');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Initialize express
const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

// Increase the limit of the request body size
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Function to fetch image from URL
const fetchImage = (url) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      response.on('error', (err) => reject(err));
    }).on('error', (err) => reject(err));
  });
};

// Function to remove background from an image
const removeBackground = async (imagePath) => {
  try {
    // Read image from the file system
    const buffer = fs.readFileSync(imagePath);

    // Process image with sharp
    const input = sharp(buffer);

    // Remove background
    const rembg = new Rembg({ logging: true });
    const output = await rembg.remove(input);

    // Convert output to JPEG format
    const processedBuffer = await output.png().toBuffer();

    // Save the processed image
    const outputPath = imagePath.replace('.jpg', '-no-bg.jpg');
    fs.writeFileSync(outputPath, processedBuffer);

    console.log(`Processed and saved: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error(`Error processing image ${imagePath}:`, error);
    throw error;
  }
};

// POST route to upload and process the image
app.post('/remove-bg', async (req, res) => {
  try {
    if (!req.body.imageUrl) {
      return res.status(400).json({ error: 'No image URL provided' });
    }

    // Fetch the image from the URL
    const buffer = await fetchImage(req.body.imageUrl);

    // Process image with sharp
    const input = sharp(buffer);

    // Remove background
    const rembg = new Rembg({ logging: true });
    const output = await rembg.remove(input);

    // Convert output to JPEG format
    const processedBuffer = await output.png().toBuffer();

    // Define the path to save the image
    const outputPath = path.join(__dirname, 'examples', `${Date.now()}.jpg`);

    // Ensure the 'examples' directory exists
    if (!fs.existsSync(path.dirname(outputPath))) {
      fs.mkdirSync(path.dirname(outputPath));
    }

    // Save the processed image to the file system
    fs.writeFileSync(outputPath, processedBuffer);

    // Respond with the path to the saved image
    res.json({ imageUrl: `http://localhost:${port}/examples/${Date.now()}.jpg` });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// GET route to remove background from all images in the 'examples' directory
app.get('/remove-bg-from-examples', async (req, res) => {
  try {
    const examplesDir = path.join(__dirname, 'examples');

    // Get all .jpg files in the 'examples' directory
    const files = fs.readdirSync(examplesDir);

    if (files.length === 0) {
      return res.status(404).json({ message: 'No images found in the examples directory.' });
    }

    const processedFiles = [];

    // Process each image
    for (const file of files) {
      const filePath = path.join(examplesDir, file);
      const processedFilePath = await removeBackground(filePath);
      processedFiles.push(processedFilePath);
    }

    // Respond with a list of processed image paths
    res.json({ message: 'Images processed successfully', processedFiles });
  } catch (error) {
    console.error('Error processing images:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// Serve static files from the 'examples' directory
app.use('/examples', express.static(path.join(__dirname, 'examples')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ error: 'Something broke!', details: err.message });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
