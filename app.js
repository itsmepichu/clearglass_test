const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser')
const logger = require('morgan');
const cors = require('cors');

const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/config/app.config.json')[env];
const utils = require('./Utils');

let indexRouter = require('./routes/index');
let userRouter = require('./routes/explorer');

let app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(bodyParser.json({limit: '6mb'}))
app.use(bodyParser.urlencoded({ extended: true, limit: '6mb' }))
app.use(cookieParser());
app.use(cors());

app.use('/explorer', userRouter);


/* Error Handler */
app.use(function (err, req, res, next) {
    console.log(err);
    if (res.headersSent) {
        return next(err);
    }
    res.status(err.code || 500).send({message: err.message || "Internal server error!", data: null});
})

app.listen(config.port, () => {
    console.log("Server started at port: " + config.port);
})

module.exports = app;
