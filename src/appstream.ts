console.clear();
console.log('\n==== App Started ====\n');

const fs = require("fs");
const filepath = "public/input.txt";
function readFileStream() {
    return new Promise((resolve, reject) => {
        let str = "";
        let i   = 0;

        const readStream = fs.createReadStream(filepath, {    encoding: "utf8"    });
        readStream.on("data",   (chunk) => {    str += chunk;   console.log('=====>> ', ++i, ' | ', chunk.length, ' || ', str.length);  });
        readStream.on("end",    ()      => {    resolve(str);   });
        readStream.on("error",  (err)   => {    reject(err);    });
    });
}

async function start() {
    let content = await readFileStream();
    content += "\n==== FILE CONTENT ====\n";



    // const writeStream   = fs.createWriteStream(filepath);
    // writeStream.write(content);
    // writeStream.end();

}

start();


// const fs            = require("fs");
// const filepath      = "public/input.txt";
// let str = '';

// const readStream    = fs.createReadStream(filepath);
// readStream.on("data",   (chunk) => {    str = chunk.toString();    });
// readStream.on("end",    ()      => {    console.log("Stream ended");    });
// readStream.on("error",  (err)   => {    console.error("Error:", err);   });

// console.log('\n\n====',str);




