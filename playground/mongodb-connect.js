const {MongoClient, ObjectID} = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/Products', (err, db) => {
    if (err){
        return console.log('Unable to connect to MongoDB server');
    }
    console.log('Connected to MongoDB server');

    db.collection('Users').insertOne({
        firstName: 'Rahul',
        lastName: 'Verma',
        email: 'rahulv74@hotmail.com',
        location: 'Bangalore'
    }, (err,result) => {
        if (err){ 
            return console.log('Unable to insert user', err);
        }
        console.log(JSON.stringify(result.ops, undefined, 2));
    });

    db.close();
});