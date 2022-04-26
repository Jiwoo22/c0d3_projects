const express = require("express");
const fs = require("fs");
const app = express();
const fetch = require("node-fetch");

app.use(express.static("public"));
app.use(express.json());

const fileCache = {};

app.get("/api/files", (req, res) => {
  console.log("request for api/files");
  fs.readdir("./public", (err, data) => {
    data.forEach((e) => {
      fileCache[e] = Date.now();
    });
    return res.json(data);
  });
});

app.put("/api/files", (req, res) => {
  console.log(req.body);
  const fileName = req.body.fileName;
  const content = req.body.content;
  if (!fileCache[fileName]) {
    fileCache[fileName] = Date.now();
    fs.writeFile(`./public/${fileName}`, content, (err) => {
      if (err) {
        return res.status(500).json({
          message: "file cannot be saved, try again",
        });
      }
      return res.json({
        message: "success",
      });
    });
  }
});

app.get("/api/files/:filename", (req, res) => {
  const fileName = req.params.filename;
  console.log("received request for", fileName);
  fs.readFile(`./public/${fileName}`, (err, data) => {
    if (err) {
      console.log("err", err);
    }
    res.set("content-type", "text/html");
    return res.send(data);
  });
});

const clearCache = () => {
  // Clear Cache every minute by deleting files with 5 min mark
  setTimeout(() => {
    console.log("inside setTimeout");
    console.log("fileCache", fileCache);
    const fileNames = Object.keys(fileCache) || [];
    console.log("fileNames", fileNames);
    if (!fileNames.length) {
      console.log("empty cache");
      return clearCache();
    }
    fileNames.forEach((e) => {
      if (Date.now() - fileCache[e] > 5 * 60 * 1000 && e !== "index.html") {
        fs.unlink(`./public/${e}`, (err) => {
          if (err) {
            console.log(err);
            return;
          }
        });
        console.log("cleaning", e);
        delete fileCache[e];
      }
    });
    return clearCache();
  }, 60 * 1000);
};

app.listen(8001, () => {
  clearCache();
  console.log("listening on port  for incoming request");
});