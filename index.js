const express = require('express')
const cors = require('cors');
const app = express()
const port = process.env.PORT ||3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()




app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.b6nzmpu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const admin = require('firebase-admin');
const serviceAccount = require('./firebase-adminsdk-servicekey-fbsvc-249b1b4609.json'); // path to your service account key JSON

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).send({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.decoded = decoded;
    next();
  } catch (error) {
    return res.status(401).send({ error: 'Unauthorized: Invalid token' });
  }
};



async function run() {
  try {
   
    await client.connect();

    const marathonCollection = client.db('marathonSpinner').collection('/events') ;

    const registeredCollection= client.db('marathonSpinner').collection('/registered');

    

    app.post('/events',async(req ,res )=>{
        const marathonData = req.body;
        marathonData.registrationCount = 0; 
        
        const result =await marathonCollection.insertOne(marathonData);
        res.send(result)
        
    })

    app.post('/registered',verifyToken, async (req, res) => {
  const registeredData = req.body;
  console.log(registeredData);

  const result = await registeredCollection.insertOne(registeredData);

  if (result.insertedId) {
    const eventId = registeredData.registeredId;

    const eventFilter = { _id: new ObjectId(eventId) };
    const update = {
      $inc: { registrationCount: 1 } // increment by 1
    };

    const updateResult = await marathonCollection.updateOne(eventFilter, update);
    console.log("Event registration count updated", updateResult);
  }

  res.send(result);
});

     app.get('/events/availability', async(req , res)=>{
      const cursor =  marathonCollection.find().limit(6);
      const result = await cursor.toArray();
      res.send(result)
    })

    app.get('/registered/event/:registered_id',verifyToken, async(req, res)=>{
      const registered_id = req.params.registered_id ;
      
      const query = {registeredId : registered_id}
      const result =await registeredCollection.find(query).toArray();
      res.send(result)
      
    })

    app.get('/registered',verifyToken,async(req, res)=>{
      const email = req.query.applicant ;
       if (email !== req.decoded.email) {
    return res.status(403).send({ error: 'Forbidden: Email mismatch' });
  }
      const query= {
        applicant: email
      }
      
      const cursor =registeredCollection.find(query);
      const result =await cursor.toArray();
      for (const registration of result) {
        const registeredId = registration.registeredId;
        const eventQuery  ={_id: new ObjectId(registeredId)}
        const event = await marathonCollection.findOne(eventQuery);
        registration.description = event.description ;
        registration.location = event.location;
        registration.distance = event.distance ;
        registration.marathonStartDate= event.marathonStartDate;
      }
      console.log(query , result);
      


      res.send(result)
    })

    app.put('/registered/:id', async (req,res)=>{
      const id = req.params.id;
      const filter ={_id : new ObjectId(id)}
      const options= {upsert: true};
      const updateData = req.body ;
      const updatedDoc ={
        $set: updateData
      };

      const result = await registeredCollection.updateOne(filter, updatedDoc ,options );
      res.send(result)
    })

    app.put('/events/:id', async(req,res)=>{
      const id = req.params.id ;
      const filter = {_id : new ObjectId(id)}
      const options = {upsert : true};
      const updateData = req.body ;
      const updatedDoc ={
        $set: updateData 
      };
      const result = await marathonCollection.updateOne(filter, updatedDoc ,options );
      res.send(result);
    })

    app.get('/events', async(req,res)=>{
      const {sortOrder}= req.query ;
      const cursor = marathonCollection.find().sort({ createdDate: sortOrder === 'asc' ? 1 : -1 });
      const result = await cursor.toArray();
      res.send(result)
    })


    app.delete('/registered/:id', async (req , res) => {
      const id = req.params.id;
      const query = {_id : new ObjectId(id)};
      const result = await registeredCollection.deleteOne(query);
      res.send(result)
    })

    app.delete('/events/:id', async(req, res)=>{
      const id = req.params.id ;
      const query = {_id :new ObjectId(id)};
      const result = await marathonCollection.deleteOne(query);
      res.send(result);
    })

    app.get('/events/:id' , async(req, res)=>{
      const id = req.params.id ;
      const query = {_id: new ObjectId(id)};
      const result = await marathonCollection.findOne(query);
      res.send(result);
    })

   
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Server is running Fine ')
})

app.listen(port, () => {
  console.log(`app running server on port ${port}`)
})
