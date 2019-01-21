var env = process.env.NODE_ENV || 'development';

if (env === 'development'){
    process.env.PORT = 3000;
    process.env.MONGODB_URI = 'mongodb://localhost:27017/Products';
}else if (env === 'test') {
    process.env.PORT = 3000;
    process.env.MONGODB_URI = 'mongodb://localhost:27017/ProductsTest';
}
const _ = require('lodash');

const {SHA256} = require('crypto-js');
const bcrypt = require('bcryptjs');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const path = require('path');
const multer = require('multer');
const upload = multer({dest: 'uploads/'});
const publicPath = path.join(__dirname, '../public');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var {mongoose} = require('./db/mongoose.js');
var {Product} = require('./models/product');
var {User} = require('./models/user');

var port = process.env.PORT || 3000;

var app = express();

var server = http.createServer(app);
app.use(bodyParser.json());
app.use(express.static(publicPath));
app.use(cookieParser());
// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
    key: 'user_sid',
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));

// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');        
    }
    next();
});

// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_sid) {
        res.redirect('/products');
    } else {
        next();
    }    
};

var authenticate = (req, res, next) => {
    var token = req.header('x-auth');
    
        User.findByToken(token).then((user)=>{
            if (!user){
                res.status(404).send();
            }
            //res.send(user);
            req.user = user;
            req.token = token;
            next();
        }).catch((err)=>{
            res.status(401).send(err);
        });
};

app.get('/', sessionChecker, (req, res) => {
    res.redirect('/login');
});

app.route('/login')
    .get(sessionChecker, (req, res) => {
        res.sendFile(path.join(__dirname, '../public/login.html'));
    });

app.route('/products')
    .get(sessionChecker, (req, res)=>{
        res.sendFile(path.join(__dirname, '../public/products.html'));
    });

app.post('/api/products',authenticate, (req, res) => {
    var product = new Product({
        supplier:req.body.supplier,
        quoteDate:req.body.quoteDate,
        productName: req.body.productName,
        productSpecs: req.body.productSpecs,
        price: req.body.price,
        contactEmail: req.body.contactEmail,
        _createdBy: req.user._id
    });
    product.save().then((doc)=>{
        res.send(doc);
    }, (e)=>{
        res.status(400).send(e);
    });
});

app.get('/api/products', authenticate, (req, res)=>{
    Product.find({
        _createdBy: req.user._id
    }).then((products)=>{
        res.send({products});
    }, (e)=> {
        res.status(400).send(e);
    });
});

app.get('/api/users', (req,res)=> {
    User.find().then((users)=>{
        res.send({users});
    })
}, (e)=>{
    res.status(400).send(e);
});

// POST /users
app.post('/api/users',async (req, res)=>{
    try {
        var body = _.pick(req.body, ['firstName', 'lastName', 'email', 'password']);
        var newUser = new User(body);
        await newUser.save();
        var token = await newUser.generateAuthToken();
        res.header('x-auth', token).send(newUser);
    }catch (err) {
        res.status(400).send(err);
    }
});


//use middleware function in below get
app.get('/api/users/me', authenticate, (req, res)=> {
    var token = req.header('x-auth');

    User.findByToken(token).then((user)=>{
        if (!user){
            res.status(404).send();
        }
        res.send(user);
    }).catch((err)=>{
        res.status(401).send(err);
    });

    res.send(req.user);
});

app.post('/api/users/login', async (req, res)=>{
    
    
    // User.findOne({email: body.email}).then((user)=>{
    //     if (!user){
    //         return res.status(404).send('Invalid email or email does not exist'); 
    //     }

    //     bcrypt.genSalt(10, (err, salt)=> {
    //         bcrypt.hash(password,salt, (err,hash)=>{
    //             console.log(hash);
    //         });
    //         console.log(password);
    //     });
    // });
    try {
        const  body = _.pick(req.body, ['email', 'password']);
        const user = await User.findByCredentials(body.email, body.password);
        const token = await user.generateAuthToken();
        res.header('x-auth',token).send(user);
    
    }catch (e) {
        res.status(400).send(e);
    }
});

app.delete('/api/users/me/token', authenticate, async (req, res)=> {
    try {
        await req.user.removeToken(req.token);
        res.status(200).send();
    }catch (e){
        res.status(400).send();
    }
});

app.listen(port, () => {
    console.log(`Started on port ${port}`);
    console.log(process.env.MONGODB_URI);
});


module.exports = {app};