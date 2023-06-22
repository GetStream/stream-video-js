const process = require('child_process');
const express = require('express');
const app = express();
const port = 7654;

app.use(express.json());

app.listen(port);

// This is being done in order to gain access to command line from Maestro
// and to be able to run the video-buddy script from the Maestro.
app.post('/terminal', (req, res) => {
  console.log(req.body.command);
  const output = process.exec(req.body.command).toString('utf8').trim();
  res.send(output);
});
