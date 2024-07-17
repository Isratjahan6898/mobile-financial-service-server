const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db('job-task');
    const collection = db.collection('users');

    // User Registration
    app.post('/register', async (req, res) => {
      const { name, email, pin, mobile } = req.body;

      // Check if email already exists
      const existingUser = await collection.findOne({ $or: [{ email }, { mobile }] });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists'
        });
      }

      // Hash the pin
      const hashedPin = await bcrypt.hash(pin, 10);

      // Insert user into the database
      await collection.insertOne({
        name,
        email,
        mobile,
        hashedPin,
        status: 'pending',
        role: 'user'
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully'
      });
    });

    // User Login
    app.post('/login', async (req, res) => {
      const { emailOrMobile, pin } = req.body;

      // Find user by email or mobile
      const user = await collection.findOne({
        $or: [{ email: emailOrMobile }, { mobile: emailOrMobile }]
      });
      if (!user) {
        return res.status(401).json({ message: 'user not found' });
      }

      // Compare hashed pin
      const isPinValid = await bcrypt.compare(pin, user.hashedPin);
      if (!isPinValid) {
        return res.status(401).json({ message: 'Invalid pin' });
      }

      // Generate JWT token
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.EXPIRES_IN });

      res.json({
        success: true,
        message: 'Login successful',
        token
      });
    });


    

    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });

  } finally {
  }
}

run().catch(console.dir);

// Test route
app.get('/', (req, res) => {
  const serverStatus = {
    message: 'Server is running smoothly',
    timestamp: new Date()
  };
  res.json(serverStatus);
});
