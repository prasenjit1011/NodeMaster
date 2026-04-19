const fn = (x) => {
  let id;

  const promise = new Promise((resolve) => {
    id = setTimeout(() => resolve(x), x * 1000);
  });

  return {
    promise,
    cancel: () => clearTimeout(id)
  };
};













const fn1 = (x) => {
  const promise = new Promise(() => {
    setTimeout(() => {
      console.log('+++++', x);
    }, x * 1000);
    // resolve('Success : ' + x);   
  });

  return {
    promise,
    cancel: () => clearTimeout(id)
  };
};

for (let i = 0; i < 8; i++) {
  fn1(i);
}


// const p9 = (x) => new Promise((res, rej)=>{
  
//   console.log('****************',x);
//     (async (x)=>{await setTimeout((x)=>{
//       console.log('+++++',x)
//       res('Success : '+x)
//     },x*1000)})(x)
    
  
// });

// for(let i=0; i<8;i++){
//   p9(i);
// }












// const p9 = (x) => new Promise((res, rej)=>{
//   if(x%2){
//     (async (x)=>{await setTimeout((x)=>{
//       console.log('+++++',x)
//     },x*1000)})(x)
//     res('Success : '+x)
//   }
//   else{
//     (async (x)=>{await setTimeout((x)=>{
//       console.log('******',x)
//     },x*1000)})(x)
//     rej('Try Again :'+x)
//   }
// });

// for(let i=0; i<8;i++){
//   p9(i).then(data=>console.log('Data: ',data))
//   .catch(err=>console.log('Err',err))
// }







// const p1 = Promise.resolve(10);
// const p2 = Promise.resolve(20);
// const p3 = Promise.resolve(30);
// const p4 = Promise.reject(40);

// Promise.all([p1, p2, p3]).then(res => console.log('All Result',res)).catch(err => console.log("All Error: ", err));
// Promise.all([p1, p2, p3, p4]).then(res => console.log('All Result',res)).catch(err => console.log("All Error: ", err));
// Promise.any([p1, p2, p3, p4]).then(res => console.log('Any Result ',res)).catch(err => console.log("Any Error: ", err));
// Promise.race([p1, p2, p3, p4]).then(res => console.log('Race Result',res)).catch(err => console.log("Race Error: ", err));
// Promise.allSettled([p1, p2, p3, p4]).then(res => console.log('All Settled Result',res)).catch(err => console.log("All Settled Error: ", err));




// let i = 0;
// const timer = setInterval(() => {
//   console.log("Hello : ", i++);
// }, 1000);

// setTimeout(() => {
//   clearInterval(timer);
//   console.log("Interval stopped");
// }, 5000);


// let i = 0;
// setInterval(() => {

//     console.log(i++);
// }, 1000);


// function delay(ms) {
//   return new Promise((resolve, reject) => {
//     if (ms % 200 !== 0) {
//       reject(new Error("Invalid delay time"));
//     } else {
//       setTimeout(resolve, 100);
//     }
//   });
// }

// async function run() {
//     for (let i = 0; i < 20; i++) {
//         await delay(i*100);
//         console.log(i);
//     }
// }

// run();


// function delay(ms) {
//   return new Promise((resolve, reject) => {
//     if (ms % 200 !== 0) {
//       reject(new Error("Invalid delay time"));
//       return;
//     }
//     setTimeout(resolve, ms);
//   });
// }

// async function run() {
//   for (let i = 0; i < 20; i++) {
//     try {
//       await delay(i * 100);
//       console.log(i);
//     } catch (err) {
//       console.log("Error at i =", i, err.message);
//     }
//   }
// }

// run();