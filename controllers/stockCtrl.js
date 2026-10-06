const fs            = require("fs");
const path          = require("path");
const { parse }     = require("csv-parse");
const csvParser     = require("csv-parser");
const nodeCache     = require("node-cache");
const myCache       = new nodeCache();
const Stock         = require('../models/stock');
const Balancesheet  = require('../models/balancesheet');
const Transaction   = require('../models/transaction');
const Tradebook     = require('../models/tradebook');
const Tradebookipo  = require('../models/tradebookipo');
const lib           = require("../controllers/library");
const tradebookDir  = require('../util/tradebookPath');
    
const apiList       = {
                        tickertape: 'https://quotes-api.tickertape.in/quotes?sids=',//DABU
                        groww: 'https://groww.in/v1/api/charting_service/v2/chart/delayed/exchange/NSE/segment/CASH/',//CAMPUS/all?intervalInDays=3&minimal=true';
                        tickertape_analyze: 'https://analyze.api.tickertape.in/v2/stocks/summary/',//RELI
                    };

               

exports.getStockList = async (req, res, next) => {

    console.log('--- stock/list ---->>>');
    //let resultData = {"status":200, msg:"Iam LTP"};
    //Stock.updateMany({}, {$rename:{"sid_grow":"growCode"}}, true, true)
    //return res.end(JSON.stringify(resultData));




    let cacheSidData        = myCache.get("cacheSidData");
    let cacheApiData        = myCache.get("cacheApiData");
    let stockRank = 99999;

    if(req.query?.rank){
        if(req.query?.rank > 0){
            stockRank = req.query?.rank;
        }
    }

    stockRank = parseInt(stockRank);    

    if(stockRank === 999 && cacheSidData !== undefined &&  cacheApiData !== undefined){
        console.log('-- Cache Data --');
        let resData = {"status":201, msg:"LTP fetch from cache successfully!1234", sidData: cacheSidData, apiData: cacheApiData};
        //return res.end(JSON.stringify(resData));
    }
   
    let fields      = { "_id": 1, "iciciCode": 1, "nseCode": 1, "sid": 1, "share_name": 1, "rank": 1, "qty": 1, "sold_qty": 1, "stock": 1, "sharecode": 1 };
    let sidsData    = await Stock.aggregate([
                                { $sort:{ sid : 1 }},
                                { 
                                    $match: {
                                        // qty:{ $gt: 0 }, 
                                        // rank: 278,
                                        // rank: { $lt: 10 },
                                        // rank: { $lt: stockRank },
                                        // stock: {$ne:null},
                                        // iciciCode: {$eq:null},
                                        sid: {$ne:null} 
                                    } 
                                },
                                //{ $match: { sid:{ $in:['DABU', 'TCS', 'ADAN']}} },//'HAP', 'HUDC', 'ASOK', 'DOLA', , 'BION'
                                { $project: fields }
                            ])
                            .limit(1000)
                            .then(data=>{
                                return data;
                            })
                            .catch(err=>{
                                console.log('-: Data not fetch successfully from database :- ');
                                console.log(err)
                                throw new Error('Data not fetch successfully from database');
                            });
                            //.find({}, fields).limit(3000)
    
    console.log('Type of  ='+ typeof(sidsData), sidsData);
    if(typeof(sidsData) !== 'object'){
        let resData = {"status":201, msg:"LTP not fetch from API!", sidData: [], apiData: []};
        return res.end(JSON.stringify(resData));
    }

    let sids    = sidsData.map(data=>data.sid).toString();
    let sidData = {};
    let rank    = 9999;
    let stockName = 'NA';
    sidsData.forEach(data=>{
        rank = 9999;
        if(data.rank){
            rank = data.rank;
        }

        //stockName = 'NA';
        stockName = data.stock ?? 'NA';
        nseCode = data.nseCode ?? 'NA';
        //stockName = data.stock;

        
        sidData[data.sid] = {"sid": data.sid, "sharecode": data.sharecode, "nseCode": nseCode, "iciciCode": data.iciciCode, "stock": stockName, "share_name": data.share_name, "rank": rank, "qty": data.qty, "sold_qty": data.sold_qty, "cqty": (data.qty-data.sold_qty)};
    });


    let apiUrl = apiList['tickertape']+sids;
    let priceData = await fetch(apiUrl)
            .then(result=>result.json())
            .then(priceData => {

                return priceData['data'];
            })
            .catch(err=>{
                console.log(err);
                let resData = {"status":500, msg:"Internal Server Error!", sidData:[], apiData:[]};
                return res.end(resData);
            }); 
    
    let apiData = [];
    priceData.forEach(data=>{
        apiData.push({...sidData[data.sid], ...data});
    });

    myCache.set( "cacheSidData", sidData, 300 );
    myCache.set( "cacheApiData", apiData, 300 );
    
    let resData = {"status":200, msg:"LTP fetch successfully!", sidData:sidData, apiData:apiData};
    return res.end(JSON.stringify(resData));
}


exports.getNetworth = async (req, res, next) => {

    let balanceData    = await Balancesheet.find().sort({createdAt: "descending"}).limit(300)
                                .then(data=>{
                                    return data;
                                })
                                .catch(err=>console.log(err));
    
    return res.end(JSON.stringify(balanceData));
}


const updBalancesheet = async (todayChange, cmp) => {

    if(todayChange != 0){
        var start = new Date();
        start.setHours(0,0,0,0);
    
        var end = new Date();
        end.setHours(23,59,59,999);
        await Balancesheet
                .updateOne(
                    { createdAt: {$gte: start, $lt: end}}, 
                    { day_status:todayChange, current_share_price:cmp}, 
                    { upsert: true, new: true })
                .then(data=>{   return data;    })
                .catch(err=>console.log(err));
    
    }
}


exports.getTradeData = async (req, res, next) => {
    try{
    let cacheSidData    = myCache.get("cacheSidData");
    let cacheApiData    = myCache.get("cacheApiData");  
    let buyArr          = {};
    let sellArr         = {};
    let ltpArr          = {};
    let currentObj      = {};
    let currentArr      = [];
    let element         = {};
    let stockArr        = {};
    let stockDetails    = {};

    if(cacheSidData === undefined && cacheApiData === undefined){
        let resData = {"status":201, msg:"cacheApiData not found!"};
        return res.end(JSON.stringify(resData));
    }

    let tradebookipo 
        = await Tradebookipo.aggregate([
            { $project: { _id:0, sid:1, qty:1, action:1 } },
            { $group: { _id: { sid: "$sid" }, cnt: { $sum: "$qty"  } } },
            { $sort:{ sid : 1 }},
        ]).then(data=>{
            return data
        }).catch();

    tradebookipo.forEach((val, key)=>{
        buyArr[val._id.sid]         = val.cnt;
        ltpArr[val._id.sid]         = cacheApiData.find(item => item.sid === val._id.sid)?.price;
        stockDetails[val._id.sid]   = cacheApiData.find(item => item.sid === val._id.sid);
        stockArr[val._id.sid]       = cacheSidData[val._id.sid]['stock'];      
    });

    let tradeDetails  
        = await Tradebook.aggregate([
            { $project: { _id:0, sid:1, qty:1, action:1 } },
            // { $match: { sid:{ $in:['REFE', 'HUDC', 'DABU', 'ASOK', 'DOLA', 'BION', 'ADAN']}} },
            { $group: { _id: { sid: "$sid", type: "$action" }, cnt: { $sum: "$qty"  } } },
            
            { $sort:{ sid : 1 }},
            //{ $group: { _id: { sid: "$sid", type: "$action" }, count: { $count: {} } } }
            // {
            //     _id: { day: { $dayOfYear: "$date"}, year: { $year: "$date" } },
            //     totalAmount: { $sum: { $multiply: [ "$price", "$quantity" ] } },
            //     count: { $sum: 1 }
            // }
        ]).then(data=>{
            return data;
        }).catch();

    let tranData = await Tradebook.find().sort({"sid":1}).then(data=>{
        return data;
    }).catch();


    tradeDetails.forEach((val, key)=>{
        
        if(val._id.type === 'Buy'){
            if(buyArr[val._id.sid] !== undefined){
                buyArr[val._id.sid] += val.cnt;
            }
            else{
                buyArr[val._id.sid] = val.cnt;
            }
        }
        
        if(val._id.type === 'Sell'){
            sellArr[val._id.sid] = val.cnt;
        }

        //{ _id: { type: 'Buy' }, cnt: 4 }
        if(cacheSidData[val._id.sid] == undefined || cacheSidData[val._id.sid]['stock'] == undefined){
            console.log('--->>',val);
        }
        else{
            stockDetails[val._id.sid]   = cacheApiData.find(item => item.sid === val._id.sid);
            ltpArr[val._id.sid]         = cacheApiData.find(item => item.sid === val._id.sid)?.price;
            stockArr[val._id.sid]       = cacheSidData[val._id.sid]['stock'];
        }
    });


    let cnt = 0;
    let cmp = 0;
    let currentVal  = 0;   
    let todayChange = 0;
    let iciciStock  = '';
    tradebookipo.forEach((val, key)=>{
        buyArr[val.sid] = val.qty;
    });

    for (const [key, value] of Object.entries(buyArr)) {
        cnt = value;
        if(sellArr[key] !== undefined){
            cnt = value-sellArr[key];
        }

        if(cnt>0){
            currentVal      = ltpArr[key] ? parseInt(ltpArr[key])*cnt : 0;
            cmp             += currentVal;
            if(stockDetails[key]?.change){
                todayChange     += parseInt(stockDetails[key]?.change)*cnt;
            }


            if(stockArr[key] != undefined || stockArr[key] != ''){
                iciciStock  = stockArr[key];
            }
            else{
                iciciStock  = 'NA'
            }
            
            stockTotalChange = cnt*stockDetails[key]?.change;

            currentObj[key] = {qty:cnt, ltp:ltpArr[key], stock:iciciStock, currentVal:currentVal, cmp:cmp};
            currentArr.push({sid:key, stock:iciciStock, qty:cnt, ltp:ltpArr[key], currentVal:currentVal, cmp:cmp, change:stockDetails[key]?.change, stockTotalChange:stockTotalChange, dyChange:stockDetails[key]?.dyChange    });
        }
    }

    updBalancesheet(todayChange, cmp);    
    currentArr.sort( (a,b) => a.stock - b.stock );
    return res.end(JSON.stringify({ cmp:cmp, currentArr:currentArr, todayChange:todayChange}));
    }
    catch(error) {
        console.error(error);
        return res.end(JSON.stringify([45,67]));
    }
}


function weeklydata(apiData){
    let arr2 = [4445];


    let d           = null;
    let d1          = null;
    let d2          = null;
    apiData.forEach((val, key)=>{
        //console.log('Val :: ', val);
    
        d   = new Date(val[0]*1000).getDate()+'/'+new Date(val[0]*1000).getMonth()+'/'+new Date(val[0]*1000).getFullYear();        
        if(d != d1){
            filterData = {};
            arr1    = [];
            apiData.forEach((x,y)=>{
                d2 = new Date(x[0]*1000).getDate()+'/'+new Date(x[0]*1000).getMonth()+'/'+new Date(val[0]*1000).getFullYear();
                if(d == d2){
                    arr1.push(x[1].toFixed(2));
                }
            });
            arr2[d] = {min:Math.min(...arr1), max:Math.max(...arr1)};
            
        }
        d1 = d;
    });;

    return arr2;
}


exports.getShareDetails = async (req, res, next) => {
    ///let data            = undefined;
    let duration        = undefined;
    let interval        = undefined;
    let apiUrl          = undefined;
    let sid             = req.params.sid;
    let shareDetails    = await Stock.findOne({sid:sid}).limit(300)
                                    .then(data=>{
                                        return data;
                                    })
                                    .catch(err=>console.log(err));

    if(!shareDetails){
        let data1 = { 
            rand: parseInt(100*Math.random()), 
            shareDetails:[], 
            transactionDetails:[], 
            weeklyData:[], 
            oneYearData:[], 
            historyData:[] 
        };
        return res.end(JSON.stringify(data1));
    }

    if(typeof(shareDetails?.iciciCode) == 'undefined'){
        var updArr      = {};
        if(typeof(shareDetails?.stock) != 'undefined'){
            updArr['iciciCode']   = shareDetails?.stock;
        }
        else{
            updArr['iciciCode']   = 'NA';
        }
        await Stock.updateOne({ 'sid': sid }, updArr);
    }

    let transactionDetails  = await Tradebook.find({sid:sid}).sort({created_at: "ascending"}).limit(300)
                                                .then(data=>{
                                                    return data;
                                                })
                                                .catch(err=>console.log(err));


    apiUrl          = apiList['tickertape_analyze']+sid;
    let tickertapeAnalyze = await fetch(apiUrl)
                        .then((res)=>res.json())
                        .then(async (res)=>{
                            return res['data'];
                        });

console.log('Tickertape Analyze : ', tickertapeAnalyze);

    apiUrl          = apiList['tickertape']+sid;
    let ltpPrice    = await fetch(apiUrl)
                        .then((res)=>res.json())
                        .then(async (res)=>{
                            return res['data'][0]['price'];
                        });
    
    if(shareDetails.ltp != ltpPrice){
        shareDetails.ltp = ltpPrice;
        await Stock.findOneAndUpdate({sid:sid}, {ltp:ltpPrice});
    }

    let code        = shareDetails.growCode;  
    let arr1        = [];
    let arr2        = [];
    //let weeklyData  = [];
    let d           = null;
    let d1          = null;
    let d2          = null;
    duration        = 'weekly';
    interval            = '1';
    let weeklyApiUrl    = apiList['groww']+code+'/'+duration+'?intervalInDays='+interval+'&minimal=true';;    
    let weeklyData      = await fetch(weeklyApiUrl).then(result=>result.json())
                            .then((apiData) => { 
                                let result = new Promise((resolve, reject) => {
                                                apiData['candles'].forEach((val, key)=>{
                                                    d   = new Date(val[0]*1000).getDate()+'/'+new Date(val[0]*1000).getMonth()+'/'+new Date(val[0]*1000).getFullYear();        
                                                    if(d != d1){
                                                        filterData = {};
                                                        arr1    = [];
                                                        apiData['candles'].forEach((x,y)=>{
                                                            d2 = new Date(x[0]*1000).getDate()+'/'+new Date(x[0]*1000).getMonth()+'/'+new Date(val[0]*1000).getFullYear();
                                                            if(d == d2){
                                                                arr1.push(x[1].toFixed(2));
                                                            }
                                                        });
                                                        arr2.push({dtd: val[0], date:d, min:Math.min(...arr1), max:Math.max(...arr1)});
                                                    }
                                                    d1 = d;
                                                });;
                                                resolve(arr2);
                                            });

                                //console.log('XYZ', data);
                                return result;
                            })
                            .catch(err=>{ console.log('Arr2 : Err', err);return []; });


    duration        = '1y';
    interval        = '7';
    let yearlyApiUrl    = apiList['groww']+code+'/'+duration+'?intervalInDays='+interval+'&minimal=true';;
    let oneYearData     = await fetch(yearlyApiUrl).then(result=>result.json())
                            .then(apiData => { 
                                if(!apiData['candles']){
                                    return [];
                                }
                                return apiData['candles']; 
                            })
                            .catch(err=>{ return []; });

    duration        = 'all';
    interval        = '365';
    historyApiUrl   = apiList['groww']+code+'/'+duration+'?intervalInDays='+interval+'&minimal=true';;
    let historyData = await fetch(historyApiUrl).then(result=>result.json())
                            .then(apiData => { 
                                if(!apiData['candles']){
                                    return [];
                                }
                                return apiData['candles']; 
                            })
                            .catch(err=>{ return []; });


    let data = { 
        rand: parseInt(100*Math.random()), 
        shareDetails:shareDetails, 
        transactionDetails:transactionDetails, 
        weeklyData:weeklyData, 
        oneYearData:oneYearData, 
        historyData:historyData,
        apiUrl:{
            'weekly':weeklyApiUrl,
            'yearly':yearlyApiUrl,
            'history':historyApiUrl
        }
    };
    return res.end(JSON.stringify(data));

}


exports.updateStockData = async (req, res, next) => {
    let cacheSidData        = myCache.get("cacheSidData");
    let cacheApiData        = myCache.get("cacheApiData");
    
    if(cacheSidData === undefined &&  cacheApiData === undefined){
        let resData = {"status":201, msg:"LTP cache data not found!"};
        return res.end(JSON.stringify(resData));
    }   
}


exports.tradeBook = async (req, res, next) => {
    const tradeBookData = req.file;
    const fileName      = tradeBookData.filename;//ProductData.destination+'/'+

    //const fileName  = 'tradeBook.csv';
    const result    = [];
    const sids      = await lib.sids();//.then(data=>data);
    let sid         = '';
    console.log('-: '+fileName+' :-')

    fs.createReadStream(path.join(tradebookDir, fileName))
            //.pipe(csvParser())
            .pipe(parse({ delimiter: ",", from_line: 2, to_line: 4000 }))
            .on("data", (data) => {
                result.push(data);
            })
            .on("end", () => {
                let tradeRows = undefined;
                let arr = undefined;
                
                result.forEach(async (row)=>{
                    sid = sids.find((element)=> element.stock == row[1])?.sid;
                    console.log('=: Sid : ', sid, ' : ', row[1], ' : ', row[0]);

                    arr = {
                            'sid':sid,
                            'date':row[0], 
                            'stock':row[1],  
                            'action':row[2], 
                            'qty':row[3], 
                            'price':row[4], 
                            'tradeValue':row[5], 
                            'orderRef':row[6], 
                            'settlement':row[7], 
                            'segment':row[8], 
                            'DpidClientId':row[9], 
                            'exchange':row[10], 
                            'stt':row[11], 
                            'transactionSebiTurnoverCharges':row[12], 
                            'stampDuty':row[13], 
                            'brokerageServiceTax':row[14], 
                            'brokerageTaxes':row[15]
                        };
                
                    const doc = await Tradebook.updateOne({ orderRef: row[6] }, arr, { upsert: true });
                    //console.log(doc);
                });
                
            })
            .on("error", function (error) {
                console.log(error.message);
            });;
    
    let resData = {"status":201, msg:"Trade data updated successfully!", tda:result};
    console.log('-: Completed :-');
    return res.end(JSON.stringify(resData));
}

exports.addStock = async (req, res, next) =>{
    
    let sid         = req.body.sid;
    let shareName   = req.body.shareName;
    let data        = {'sid':sid, 'share_name' : shareName};

    let shareDetails    = await Stock.findOne({sid:sid}).limit(300)
                                    .then(data=>{
                                        return data;
                                    })
                                    .catch(err=>console.log(err));

    
    //const doc       = await Stock.create(data);

    let resData = {"status":200, msg:"Share added successfully!", stockData: data, doc: shareDetails};
    console.log('-: Completed :-');
    return res.end(JSON.stringify(resData));

}

exports.updStockParam = async (req, res, next) =>{

    let paramName   = req.body.paramName;
    let paramValue  = req.body.paramValue;
    var updArr      = {};

    updArr[paramName]   = paramValue;
    const doc = await Stock.updateOne(
                        { 'sid': req.body.sid }, 
                        updArr
                    );
    
    const stockData = await Stock.findOne({sid: req.body.sid}).limit(300)
    .then(data=>{
        return data;
    })
    .catch(err=>console.log(err));

    if(!stockData){
        if(paramName == 'sidCode' && paramValue != 'NEW'){
            const docV = await Stock.create({'sid':paramValue});
            console.log(docV);
        }
    }


    let resData = {"status":201, msg:"Stock data updated successfully!", stockData:stockData};
    console.log('-: Completed :-');
    return res.end(JSON.stringify(resData));
}
