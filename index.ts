const express = require('express');
const sharp = require('sharp');
const { Rembg } = require('@xixiyahaha/rembg-node');
const bodyParser = require('body-parser');

// Initialize express
const app = express();
const port = 3000;

// Increase the limit of the request body size
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// POST route to upload and process the image
app.post('/remove-bg', async (req, res) => {
  try {
    if (!req.body.image) {
      return res.status(400).send('No image data provided');
    }

    // Extract base64 data
    const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const input = sharp(buffer);

    // optional arguments
    const rembg = new Rembg({
      logging: true,
    });

    // Remove background
    const output = await rembg.remove(input);

    // Convert output to webp format and send response
    const processedBuffer = await output.webp().toBuffer();

    // Convert processed buffer back to base64
    const processedBase64 = processedBuffer.toString('base64');

    // Send the processed image as base64
    res.json({ image: `data:image/webp;base64,${processedBase64}` });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});