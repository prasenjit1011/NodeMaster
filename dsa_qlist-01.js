

/*
    // aaaabbccccddccffaaccbbf => 
    // a4b2c3d3
    // { a: 6, b: 4, c: 8, d: 2, f: 3 }
    
    // "I Love Riyan" => "I evoL nayiR"
    // Anagrams : "listen", "silent" => true
    // isPalindrome : madam : true
    // developer => Output: Vowels: 4, Consonants: 5
    // Longest words : I am learning JavaScript
    // Replace Digits with #
    // Rearrange Characters Alphabetically
    // remove all vowels
    
    let arr21 = [[1, 2], [3,2, 4], [5]];
    
    
    console.log('Reverse Integer Array Element : ', 
      [12,13,14], ' => ',
      [12,13,14].map((val)=>{
        return +String(val).split('').reverse().join('');;
      })
    )
    
    console.log('Reduce to flat a array', arr21, '=>',
      [[1, 2], [3, 4], [5]].reduce((acc, val) => acc.concat(val), [])
    );
    
    console.log('Map and Filter', '\n',
      [1,2,3,4,5,6].map((val)=> val%2 == 0), '\n',
      [1,2,3,4,5,6].filter((val)=> val%2 == 0),
    )
    
    console.log('1. Array Sort ', 
      [-5,1,44,9].sort((a,b)=>a-b)
    )
    
    console.log("2. Array Map and Filter ",
      [2, 5, 22, 3, 33].map(val => (val > 10 ? val : undefined)).filter(val => val !== undefined)
    )
    
    console.log("3. Multi Dimension Array to Single Dimension",
      [1, [2, [3, 4], 5]].flat(Infinity))
    
    console.log("4. Remove all vowels : ",
      "Hello World".replace(/[aeiou]/gi, '')); 
    
    console.log("5. Rearrange Characters Alphabetically : ",
      "zyxabc".split('').sort().join('')
    ); 
    
    console.log("6. Replace Digits with # : ",
      "a1b2c3".replace(/\d/g, '#')
    )
    
    console.log("7. Find Longest Word : ", 
      "I love riyan".split(' ').reduce((longest, word) => word.length > longest.length ? word : longest)
    );
    
    console.log("8. isPalindrome : ",
      isPalindrome("kayak")
    )

    
/*

    // Example 06
    function countVowelsAndConsonants(str) {
      const vowels = 'aeiou';
      let vowelCount = 0;
      let consonantCount = 0;
    
      for (let char of str.toLowerCase()) {
        if (/[a-z]/.test(char)) { // only check alphabetic characters
          if (vowels.includes(char)) {
            vowelCount++;
          } else {
            consonantCount++;
          }
        }
      }
    
      return `8. Vowels: ${vowelCount}, Consonants: ${consonantCount}`;
    }
    
    
    console.log(countVowelsAndConsonants("developer")); 
    // Output: Vowels: 4, Consonants: 5
    
    // Example 03 // I evoL nayiR
    let str = "I Love Riyan"; 
    console.log('9.',str, ' => ', str.split(' ').map(word => word.split('').reverse().join('')).join(' '));
    
    
    
    // Example 05 : isPalindrome
    function isPalindrome(str) {
      return str === str.split('').reverse().join('');
    }
    
    
    // Example 04 : Anagrams
    function areAnagrams(str1, str2) {
      const normalize = str => str.toLowerCase().split('').sort().join('');
      return normalize(str1) === normalize(str2);
    }
    
    console.log(areAnagrams("listen", "silent")); // Output: true
    console.log(areAnagrams("hello", "world"));   // Output: false
    
    
    console.log('------------------------');
    const str4 = "aaabbbaaacddddee";
    const arr = {};
    for(let chr of str4){
      if(!arr[chr]){
        arr[chr] = 0;
      }
      arr[chr]++;
    }
    
    
    let str1 = str4.split('').filter(char => arr[char] == 1).join('');
    console.log('Str One : ',str1)
    console.log('------------------------');
    
    const str5 = "hello328888**********22**";
    const count = {};
    
    for (const char of str5) {
      count[char] = (count[char] || 0) + 1;
    }
    
    let maxChar = '';
    let maxCount = 0;
    
    for (const char in count) {
      if (count[char] > maxCount) {
        maxChar = char;
        maxCount = count[char];
      }
    }
    
    console.log(`Max character: ${maxChar}, Count: ${maxCount}`); 
    console.log('------------------------');
    
    
    // Example 01
    function compressString(str) {
      str = str.toLowerCase();
      const countMap = {};
      const order = [];
    
      for (let ch of str) {
        if (!countMap[ch]) {
          countMap[ch] = 1;
          order.push(ch);
        } else {
          countMap[ch]++;
        }
      }
      
      console.log(countMap)
    
      let result = "";
      let str1   = "";
      for (let ch of order) {
        result += ch + countMap[ch];
        str1 += ch;
      }
    
      //console.log(str1)
      return result;
    }
    
    console.log(compressString("aaaabbccccddccffaaccbbf")); // a4b2c3d3
    
    
    // Example 02
    function removeConsecutiveDuplicates(str) {
      return str.replace(/(.)\1+/g, '$1');
    }
    
    console.log(removeConsecutiveDuplicates("aaabbcaacccdee")); // Output: "abcde"
    
    
    console.log('------------------------');
    
    async function main() {
      console.log('A');
      await new Promise(resolve => {
        setImmediate(() => {
          console.log('B');
          resolve();
        });
      });
      console.log('C');
    }
    
    console.log('D');
    main();
    console.log('E');
    
    //Given an integer array nums, find three numbers whose product is maximum and return the maximum product.
    
    
    console.log(maximumProduct([2,4,-6,9,-10]))
    
    function maximumProduct(nums) {
      let max1 = -Infinity, max2 = -Infinity, max3 = -Infinity;
      let min1 = Infinity, min2 = Infinity;
    
      for (let n of nums) {
        if (n > max1) [max3, max2, max1] = [max2, max1, n];
        else if (n > max2) [max3, max2] = [max2, n];
        else if (n > max3) max3 = n;
    
        if (n < min1) [min2, min1] = [min1, n];
        else if (n < min2) min2 = n;
      }
    
      console.log(min1 , min2 , max1)
      return Math.max(max1 * max2 * max3, min1 * min2 * max1);
    }
    


    ---------- Example 02 ----------

    
    const primes = [];
    for (let n = 2; n < 9; n++) {
      if (![...Array(n - 2)].some((_, i) => n % (i + 2) === 0)){primes.push(n)} 
    }
    console.log(primes);
    
    //chkPrime(35)
    
    function chkPrime(number){
      for (let num = 2; num < number; num++) {
        let isPrime = true;
      
        for (let i = 2; i < num; i++) {
          if (num % i === 0) {
            isPrime = false;
            break;
          }
        }
      
        if (isPrime) {
          console.log(num);
        }
      }
    }
    

    --------- Example : Event CRUD ---------------

    const users     = {};
    const app       = require('express')();
    const eventData = new (require('events'))();

    eventData.on('hello',(data)=>{
        const cnt   = Object.keys(users).length
        users[cnt]  = data;
        console.log('Event Hello Received : ', data);
    });

    app.get('/event/hello/:txt',(req, res)=>{
        console.log('Event Hello Emited');
        eventData.emit('hello', req.params.txt);
        res.json('Event Created Successfully!')
    });


    app.get('/event/data',(req, res)=>{
        res.json(users)
    });

    app.get('/event/update/:id/:txt',(req, res)=>{
        users[req.params.id]  = req.params.txt;
        res.json(users)
    });

    app.get('/event/delete/:id',(req, res)=>{
        delete users[req.params.id];
        res.json(users)
    });





    ---------- Example 02 ----------

    const http = require('http');

    const server = http.createServer((req, res) => {
      res.end('Hello');
    });
    
    server.listen(3000, () => {
      console.log('Server is running');
      server.close(); // Will trigger close callback
    });
    
    server.on('close', () => {
      console.log('Server closed (close callback)');
    });
    


    
    ---------- Example 02 ----------
    

    const arr = ["Nodejs", "ReactJS", "MongoDB", "AWS"];
    let str = "";
    let i = 0;
    while(arr[i]){
      str += arr[i++]+'-'
    }
    //Nodejs-ReactJS-MongoDB-AWS






    ---------- Example 02: Context API ----------

    import React from 'react';
    import { createContext, useContext } from "react";
    
    const MyContext = createContext();
    
    const App = () => {
      return 
    }
    
    const CompA = () => {
      const message = "Dummy";
      return 
    }
    
    const CompB = () => {
      return 
    }
    const CompC = () => {
      const { message } = useContext(MyContext);
      return 
Comp-C2-{message}

    }
    
    
    
    export default App
    

-----------------------------
const fs = require("fs");
const path = require("path");

function scandir(dirPath, results = []) {
    let files;

    try {
        files = fs.readdirSync(dirPath);
    } catch (err) {
        console.error("Error reading directory:", err.message);
        return [];
    }

    files.map(file => {
        const ext = path.extname(file);
        if(ext === '') {
            const subDirPath = path.join(dirPath, file);
            if (fs.statSync(subDirPath).isDirectory()) {
                scandir(subDirPath, results);
            }
        }
        if(ext && !results.includes(ext)) {
            results.push(ext);
        }
    });

    return results;
}

const dirPath = "C:\\Users\\prase\\Downloads";
const result = scandir(dirPath);
console.log(result);

