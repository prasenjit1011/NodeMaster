const { Worker } = require("worker_threads");

console.log("Main thread started");

const worker = new Worker("./worker.js");

worker.on("message", (result) => {
  console.log("Result from worker:", result);
});

worker.on("error", (err) => {
  console.log("Worker error:", err);
});

worker.on("exit", (code) => {
  console.log("Worker exited with code:", code);
});

console.log("Main thread is free to do other work");