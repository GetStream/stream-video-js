const process = require("child_process");
const express = require("express");
const app = express();
const port = 7654;

app.use(express.json());

app.listen(port);

app.post("/terminal", (req, res) => {
  const output = process.exec(req.body.command).toString("utf8").trim();
  res.send(output);
});
