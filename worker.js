const { parentPort } = require("worker_threads");

function heavyTask() {
  let sum = 0;

  for (let i = 0; i < 1e10; i++) {
    sum += i;
  }

  return sum;
}

const result = heavyTask();

// Send result back to main thread
parentPort.postMessage(result);