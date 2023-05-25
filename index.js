const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000
// meddleware 

app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mfbdkzg.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const toysCollection = client.db("toysDB").collection('toysData')

    app.get("/totalProduct", async(req,res) =>{
          const result =  await toysCollection.estimatedDocumentCount()
          res.send({totalProducts:result})
    })

    app.get("/toys", async(req,res) =>{
        if(req.query.sort){  // for data sorting
          const sorting = req.query.sort
          const result = await toysCollection.find().sort({price: sorting}).toArray()
          return res.send(result)

        }
        if(req.query.limit && req.query.skip){     // for pagenation      
          const skip_Count = parseInt(req.query.skip);     
          const limitData = parseInt(req.query.limit);
          
          const result = await toysCollection.find().skip(skip_Count).limit(limitData).toArray()
          return res.json(result)
        }
        const result = await toysCollection.find().toArray()
        res.send(result)
    })


    // route for find catagory ways
    app.get("/toy", async(req,res)=>{
        
        let query = {}
        const catagory = req.query.catagory;
        if(catagory){
          query = { catagory: catagory}
        }
        
        const result = await toysCollection.find(query).toArray()
        res.send(result)

    })

    app.get("/alltoys", async(req,res)=>{
        
        let query = {}
      if(req.query.sort && req.query.email){ // my toys page sorting 
        const email = req.query.email;
        const sorting = parseInt(req.query.sort)
        query = { seller_email: email}
        const result = await toysCollection.find(query).sort({price: sorting}).toArray()
        return res.send(result)
      }

      
      const email = req.query.email;
      if(email){ // for show added toys only users
        query = { seller_email: email}
        const result = await toysCollection.find(query).toArray()
        return res.send(result)
      }
      
      
      const result = await toysCollection.find(query).toArray()
      res.send(result)

  })

    
      // route for load single page 
      app.get("/toys/:id" , async(req,res) =>{
          const id = req.params.id;
          const cursor = {_id: new ObjectId(id)}
          const result = await toysCollection.findOne(cursor)
          res.send(result)
      })

      app.post("/toys", async(req,res) =>{
        const newProduct = req.body;
        
        const result = await toysCollection.insertOne(newProduct)
        res.send(result)
      })

      // edit products router

      app.patch("/editToys/:id", async(req,res) =>{
        const id = req.params.id;
        const editData = req.body;
        
        const filter = {_id: new ObjectId(id)};
        const updateDoc = {
          $set:{
            price:editData.price,
            quantity:editData.quantity,
            description:editData.description
          }
        }
        const result = await toysCollection.updateOne(filter,updateDoc)
        res.send(result)

      })





     

      // create index 
      const indexKeys = {name:1,description:1}
      const indexOptions = {name: "searchText"}

      const result = await toysCollection.createIndex(indexKeys,indexOptions)


      // route for search collection 

      app.get("/toySearch/:text", async(req,res) =>{
        
        const text = req.params.text;
          
        
        const result = await toysCollection.find({
          $or:[
            {name:{$regex:text,$options:"i"}},
            {description:{$regex:text,$options:"i"}}
          ]
        }).toArray()
        
        res.send(result)
      })
      




        // remove items router

        app.delete("/toys/:id", async(req,res)=>{
            const id = req.params.id;
            const cursor = {_id: new ObjectId(id)}
            const result = await toysCollection.deleteOne(cursor)
            res.send(result)
           
        })





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);






app.get("/", (req,res) => {
    res.send("server is running ")
})


app.listen(port, ()=> console.log(`toy server is running port : ${port}`))