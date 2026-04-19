// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3010;


if(false){
  const file = fs.createWriteStream("public/large.json");
  let i = 0;
  let size = 0;
  const targetSize = 5 * 1024 * 1024; // 500MB
  file.write("[\n");
  while (size < targetSize) {
    const obj = {
      id: i,
      name: `User_${i}`,
      value: Math.random(),
    };

    let json = JSON.stringify(obj);
    json = (i === 0 ? "" : ",\n") + json;

    size += Buffer.byteLength(json);
    file.write(json);

    i++;
  }
  file.write("\n]");
  file.end();
  console.log("Approx size:", size / (1024 * 1024), "MB");
}


app.get('/getdata', (req, res) => {
  const stream = fs.createReadStream('public/dummy_posts.json');

  res.setHeader('Content-Type', 'application/json');
  stream.pipe(res);

  stream.on('error', (err) => {
    res.status(500).send('Error reading file');
  });
});


app.get('/profile', (req, res, next)=>{
  next();
  res.send('profile 01')
  next();
});

app.get('/profile', (req, res)=>{
  res.send('profile 02')
});


console.log(path.join(__dirname, '../video/v1.mp4'));

// // Route to stream the video
app.get('/video', (req, res) => {
  const videoPath = path.join(__dirname,  '../video/v1.mp4');
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const CHUNK_SIZE = 1024 * 1024; // 1 MB
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    //const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const end = Math.min(start + CHUNK_SIZE - 1, fileSize - 1);
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    });

    let dtd = new Date;
    console.log(`${dtd.getMinutes()}:${dtd.getSeconds( )} bytes ${start}-${end}/${fileSize}`);console.log(parts)
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    });

    fs.createReadStream(videoPath).pipe(res);
  }
});

app.use(express.static(__dirname)); // Serve HTML

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
