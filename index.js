const dns = require('dns');
//to load .env values into process.env
require('dotenv').config();
const bodyParser = require('body-parser');
const nanoid = require('nanoid');
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;

const app = express();
app.use(bodyParser.json());

//configure expresss to handle static files
app.use(express.static(path.join(__dirname, 'public')));

//Connecting to mongodb
mongoose.connect(DATABASE_URL, {
    useNewUrlParser: true
}, (err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to Database');
});

//Model
mongoose.model('ShortenedUrl', mongoose.Schema({
    originalUrl: {
        type: String,
        require: true
    },
    shortUrl: String,
},{
    timestamps: true,
}));

const ShortenedUrl = mongoose.model('ShortenedUrl');

//Main Entry Point
app.get('/', (req, res) => {
    const htmlPath = path.join(__dirname, 'public', 'index.html');
    res.sendFile(htmlPath);
});

//new entry
app.post('/new', (req, res) => {
    try {
        originalUrl = new URL(req.body.url);
    } catch (err) {
        return res.status(400).send({
            error: "Invalid URL"
        });
    }
    dns.lookup(originalUrl.hostnmae, (err) => {
        if (err) {
            return res.status(404).send({
                error: 'Address not found'
            });
        }
    });
    ShortenedUrl.findOneAndUpdate({
        originalUrl: req.body.url
    }, {
        $setOnInsert: {
            originalUrl: req.body.url,
            shortUrl: nanoid(7)
        }

    }, {
        new: true,
        upsert: true,
        useFindAndModify: true,
    }).then(result=>{
        console.log(result);
        res.json(result);
    }).catch((err)=>{
        console.log(err);
    });
});


app.get('/:shortUrl',(req,res)=>{
    ShortenedUrl.findOne({shortUrl: req.params.shortUrl},function (err,result){
        if (err){
            throw err;
        }else{
            console.log(result);
            res.redirect(result.originalUrl);
        }
    });

});


app.set('port', process.env.PORT || 8080);
const server = app.listen(app.get('port'), () => {
    console.log(`Url Shortner service running on PORT: ${server.address().port}`);
});