const express = require('express')
const cors = require('cors');
const app = express()
const port = process.env.PORT ||3000;
const { MongoClient, ServerApiVersion } = require('mongodb');
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

async function run() {
  try {
   
    await client.connect();

    const marathonCollection = client.db('marathonSpinner').collection('/events') 
    

    app.post('/events',async(req ,res )=>{
        const marathonData = req.body;
        console.log(marathonData);
        const result =await marathonCollection.insertOne(marathonData);
        res.send(result)
        
    })

    app.get('/events', async(req,res)=>{
      const cursor = marathonCollection.find();
      const result = await cursor.toArray();
      res.send(result)
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
