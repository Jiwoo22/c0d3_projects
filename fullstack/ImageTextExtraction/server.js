const express = require("express");
const multer = require("multer");
const app = express();
const Tesseract = require("tesseract.js");
const upload = multer({ dest: "uploads/" });
const { uuid } = require("uuidv4");

app.use(express.static(__dirname + "/public"));

const jobs = {};

app.post("/api/files", upload.array("userFiles"), (req, res) => {
  const jobId = uuid();
  jobs[jobId] = {
    isDone: false,
    processed: [],
  };
  const files = req.files;
  files.forEach((e) => {
    Tesseract.recognize(e.path, "eng", {
      logger: console.log,
    }).then((each) => {
      jobs[jobId].processed.push(each.data.text);
      if (files.length === jobs[jobId].processed.length) {
        jobs[jobId].isDone = true;
      }
    });
  });
  return res.send(`/jobs/${jobId}`);
});

app.get("/api/jobs/:jobId", (req, res) => {
  const jobId = req.params.jobId;
  const job = jobs[jobId];
  console.log("jobId", jobId);
  console.log("jobs", jobs);
  if (!job) {
    return res.status(404).json({
      error: { messaage: "No job found" },
    });
  }
  res.send(job);
});

app.get("/jobs/:jobId", (req, res) => {
  const jobId = req.params.jobId;
  const job = jobs[jobId];
  if (!job) {
    return res.status(404).json({
      error: { messaage: "No job found" },
    });
  }
  res.sendFile(__dirname + "/public/imageTexts.html");
});

app.listen(8123);
