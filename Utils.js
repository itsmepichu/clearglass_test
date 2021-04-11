const multer = require('multer');
const path = require('path');
const _ = require('lodash');

let userDirStorage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, __dirname + '/public/images');
    },
    filename: (req, file, callback) => {
        callback(null, file.originalname)
    }
})

let upload = multer({storage: userDirStorage})

// destination: (req, file, cb) ->
//     cb null, nconf.get('uploads_path')
//
// filename: (req, file, cb) ->
//     cb null, "#{file.originalname}"
//
// upload = multer
// storage: userdirStorage

let checkRequestValidation = (fields_to_validate, req_body) => {
    console.log(fields_to_validate);
    console.log(req_body);
    for (let field of fields_to_validate) {
        console.log('field --------------', field)
        if (
            !req_body[field] ||
            req_body[field] == null ||
            req_body[field] === undefined ||
            req_body[field] === '' ||
            req_body[field] === ' '
        ) {
            console.log("Invalid field in request body: " + field)
            return false;
        }
    }
    return true;
}

let paramValidator = (req, res, next) => {
    let query_params = req.query;
    if(query_params) {
        for(const key in query_params) {
            if(Array.isArray(query_params[key])) {
                query_params[key] = query_params[key].filter(function (x) {
                    return x != null && x !== ' ' && x!== '';
                });
            }
        }
    }
    req.query_url = req.protocol + '://' + req.get('host') + req.originalUrl;
    next();
}

let filterObject = (keys_to_filter, obj) => {
    newObj = {}
    for (const key in obj) {
        if (key in [keys_to_filter]) {

        } else {
            newObj[key] = obj[key];
        }
    }
    return newObj;
}

let uploadFiles = () => {
    return upload;
}

JSON.clone = (obj) => JSON.parse(JSON.stringify(obj))

module.exports = {
    checkRequestValidation,
    filterObject,
    uploadFiles,
    paramValidator
}
