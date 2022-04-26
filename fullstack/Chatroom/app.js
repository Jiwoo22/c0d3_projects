const express = require("express");
const fetch = require("node-fetch")
const app = express();
const btoa = require("btoa");
app.use(express.static('public'))
app.use(express.json())

const chatMessages = {}
const userIdentity = {}

app.use('/api',  async (req, res, next) => {
    if( userIdentity[req.get('Authorization')]) {
      req.user = userIdentity[req.get('Authorization')]
    } 
    else {
      const userInfo = await fetch('https://js5.c0d3.com/auth/api/session', {
        headers: {
          Authorization: req.get('Authorization')
        }
      }).then( r => {
        return r.json()
      })
  
      if (!userInfo || !userInfo.username) {
        return res.status(403).json({
          message: 'not authorized'
        })
      }
      req.user = userInfo
      userIdentity[req.get('Authorization')] = req.user
    }
    next()
})

app.post('/api/messages', (req, res) => {
  const roomName = req.body.roomName
  console.log(roomName)
  const messages = chatMessages[roomName] || []
  messages.push({
    username: req.user.username,
    message: req.body.message
  })
  chatMessages[roomName] = messages
  res.json(messages)
})


app.get('/api/messages', (req, res) => {
  const roomName = req.query.roomName
  const roomMsg = chatMessages[roomName] || []
  res.json(roomMsg)
})

app.get('/:roomname', (_req, res) => {
  res.sendFile(__dirname + '/public/chat.html')
});

app.listen(8123);