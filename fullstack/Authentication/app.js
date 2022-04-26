const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const atob = require("atob");
const jwt = require("jsonwebtoken");

const app = express();
const saltRounds = 10;
const jsonParser = bodyParser.json();

const SYSTEM_password = 'jiwoo_js5_authentication';

//middleware to put a body property in the reqiest object
app.use(express.json())
//middleware to create a path for every file in current folder
app.use(express.static("./"));

const userCache = {}
const emailCache = {}

app.options('/api/*', (req, res) => {
    res.header('Access-Control-Allow-Credentials', true)
    res.header('Access-Control-Allow-Origin', req.headers.origin)
    res.header('Access-Control-Allow-Methods', 'GET', 'PUT', 'POST', 'PATCH', 'DELETE')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Credentials')
    res.send('ok')
})

const sendError = (res, message) => {
    return res.status(400).json({
        error: { message }
    })
}

//create a new user
app.post('/api/users', jsonParser, (req, res) => {
    const userData = req.body || {}
    const pwd = userData.password
    const userName = userData.username
    const email = userData.email

    if(userCache[userName]) {
        return sendError(res, "Username is not available")
    }

    if(emailCache[email]){
        return sendError(res, "Email already taken")
    }

    //caching userData
    userCache[userName] = userData
    emailCache[email] = userName

    //secure user password
    bcrypt.hash(pwd, saltRounds, function(err, hash){
        userCache[userName].password = hash
    })

    const token = jwt.sign({userId: userName}, SYSTEM_password)
    userCache[userName].token = token

    return res.status(200).json({
        message: "userdata saved"
    })
})

//creat a new session
app.post('/api/session', jsonParser, (req, res) => {
    const { username, password } = req.body;

    if(userCache[username]){
        bcrypt.compare(password, userCache[username].password).then( result => {
            if(result) {
                return res.json({
                    username : username,
                    token : userCache[username].token
                })
            } else {
                res.status(403).json({
                    message: 'password incorrect'
                })
            }
        })
    } else {
        res.status(403).json({
            message:'username incorrect'
        })
    }
})

//get the currenly logged in user
app.get('/api/session', jsonParser, (req, res) => {
    const token = (req.get("Authorization") || "").replace('Bearer ', '');
    jwt.verify(token, SYSTEM_password, function(err, decoded){
        if (err || !decoded || !decoded.userId) {
            return res.status(403).json({
                message: 'Unverified'
            })
        }
        return res.json({username : decoded.userId})
    })
})



app.listen(8000);