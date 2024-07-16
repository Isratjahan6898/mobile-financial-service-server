const express = require('express')
const app = express()
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config()
const cors = require('cors')



const port = process.env.PORT || 5000

// middleware
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))

app.use(express.json())




const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kowhoxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {


    const usersCollection = client.db('mobileService').collection('users');





//register related
    app.post('/api/register', async (req, res) => {
      const { name, pin, mobile, email } = req.body;
    
      try {
        const hashedPin = await bcrypt.hash(pin, 10);
        const newUser = { name, pin: hashedPin, mobile, email, status: 'pending', role: 'user' };
    
        await usersCollection.insertOne(newUser);
        res.status(201).send('User registered successfully');
      } catch (error) {
        console.error(error);
        res.status(500).send('Registration failed');
      }
    });


    //login related

    app.post('/login', async (req, res) => {
      const { identifier, pin } = req.body;

      try {
          // Validate identifier and pin
          if (!identifier || !pin) {
              return res.status(400).json({ error: 'Identifier and PIN are required' });
          }

          // Find user by mobile or email
          const user = await usersCollection.findOne({
              $or: [{ mobile: identifier }, { email: identifier }]
          });

          if (!user) {
              return res.status(400).json({ error: 'User not found' });
          }

          // Log the user and received pin
          console.log('User found:', user);
          console.log('Received PIN:', pin);

          // Compare hashed pin
          const isMatch = await bcrypt.compare(pin, user.pin);
          console.log('Is PIN match:', isMatch);

          if (!isMatch) {
              return res.status(400).json({ error: 'Invalid PIN' });
          }

          // Generate JWT token
          const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

          res.json({ token });
      } catch (error) {
          console.error('Login error:', error);
          res.status(500).json({ error: 'Server error' });
      }
  });


  //get all users

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



//1mphrO6icxpK6C3v
//mobileSevice



app.get('/', (req, res) => {
    res.send('Hello from mobile financial service..')
  })
  
  app.listen(port, () => {
    console.log(`mobile financial service is running on port ${port}`)
  })
  