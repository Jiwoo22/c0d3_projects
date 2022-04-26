const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.static(__dirname + "/public"));
app.use(express.json({ limit: "25mb" }));

let imgName = `${Date.now()}.png`;

app.post("/api/selfies", (req, res) => {
  const imgData = req.body.imgData;
  imgName = `${Date.now()}.png`;

  fs.writeFile(
    __dirname + `/public/photo/${imgName}`,
    imgData,
    "base64",
    (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("File written successfully\n");
      }
    }
  );
  res.send(imgName);
});

app.get("/api/selfies/:img", (req, res) => {
  const imgFile = req.params.img;
  res.sendFile(__dirname + `/public/photo/${imgFile}`);
});

app.listen(8123);
