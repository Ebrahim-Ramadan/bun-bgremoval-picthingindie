const express = require('express');
const sharp = require('sharp');
const { Rembg } = require('@xixiyahaha/rembg-node');
const multer = require('multer');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());

const storage = multer.memoryStorage();
const upload = multer({ storage });


app.post('/remove-bg', upload.single('image'), async (req : Request, res : Response) => {
  try {
    // @ts-ignore
    if (!req.file) {
    // @ts-ignore
      return res.status(400).json({ error: 'No image file provided' });
    }
    // @ts-ignore
    const buffer = req.file.buffer;

    const compressedBuffer = await sharp(buffer)
    .resize(800, 800, { 
      fit: sharp.fit.inside,
      withoutEnlargement: true,
    })
    .jpeg({ quality: 70 }) 
    .toBuffer();
    
    const input = sharp(compressedBuffer);

    const rembg = new Rembg({ logging: true });
    const output = await rembg.remove(input);
    
    const processedBuffer = await output.png().toBuffer();
    // @ts-ignore
    res.set('Content-Type', 'image/png');
    // @ts-ignore
    res.send(processedBuffer);
  } catch (error) {
    console.error('Error processing image:', error);
    // @ts-ignore
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});
    // @ts-ignore
app.use((err,  res : Response,) => {
  console.error('Unhandled Error:', err.stack);
    // @ts-ignore
  res.status(500).json({ error: 'Something broke!', details: err.message });
});


app.listen(port, () => {
  console.log(`Server is running on http:`, port);
});
