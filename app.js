
function heavyTask() {
  let sum = 0;

  for (let i = 0; i < 1e10; i++) {
    sum += i;
    if(i%100000000 == 0){
        console.log(i)
    }
  }

  return sum;
}

console.log("Start");

const result = heavyTask();

console.log("Result:", result);
console.log("End");


console.clear();
console.log('\n\n-: App Started :-');

