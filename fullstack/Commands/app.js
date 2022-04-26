const express = require("express");
const app = express();
const fs = require("fs");
const fetch = require("node-fetch");

app.use(express.static("public"));

app.get("/", (req, res) => {
  fs.readdir(`${__dirname}/public`, (err, files) => {
    res.send(
      files.reduce((acc, f) => {
        return (
          acc +
          `
      <div>
        <a href="/${f}" target="__blank">${f}</a>
      </div>
      `
        );
      }, "")
    );
  });
});

const util = require("util");
const exec = util.promisify(require("child_process").exec);

app.use(express.json());

app.post("/commands", async (req, res) => {
  console.log(req.body);
  const input = req.body;
  const { stdout, stderr } = await exec(input.command);
  console.log("stdout:", stdout);
  console.log("stderr:", stderr);
  res.json(stdout);
});

app.get("/commands", async (req, res) => {
  const htmlStr = `
    <head>
    <meta charset="UTF-8">
    <title></title>
    <style>
    .option {
      cursor: pointer;
    }
    </style>
    </head>
    <body data-gr-c-s-loaded="true">
    <h1>Commands</h1>
    <p>For the security of our server, only a few commands are allowed. Try some of these:</p>
    <p class="option">ls</p>
    <p class="option">pwd</p>

    <input class="commandInput" type="text">
    <hr>
    <pre class="output"></pre>
    <script>
      const input = document.querySelector('.commandInput')
      const output = document.querySelector('.output')
      input.focus()

      const commendList = {
        ls : 1,
        pwd: 1,
        cat: 1,
        'git status':1
      }

      async function sendCommand () {
        const inputStr = input.value
        if (!inputStr || !commendList[inputStr]) {
          return 
        }
        const data = await fetch('/commands', {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            command: inputStr
          })
        }).then(r => {
          console.log(r)
          return r.json()
        })

        console.log(data)
        output.innerText = data
        input.value = ''
      }

      input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          sendCommand()
        }
      })
    </script>
    </body>
  `;
  res.send(htmlStr);
});

app.listen(process.env.PORT || 8123);
