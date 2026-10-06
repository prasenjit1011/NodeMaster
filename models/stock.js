const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;

const stockSchema = new Schema({
  sid:{
    type: String,
    required: true
  },
  stock:{ // iciciCode
    type: String,
    required: false
  },
  iciciCode:{
    type: String,
    required: false
  },
  share_name: {
    type: String,
    required: false
  },
  marketcap: {
    type: Number,
    required: false
  },
  tickertape_prediction: {
    type: Number,
    required: false
  },
  rank:{
    type: Number,
    require: false
  },
  ltp: {
    type: Number,
    required: false
  },
  cost: {
    type: Number,
    required: false
  },
  qty: {
    type: Number,
    required: false
  },
  sold_qty: {
    type: Number,
    required: false
  },
  growCode:{
    type: String,
    required: false
  },
  sid_grow:{
    type: String,
    required: false
  },
  nseCode:{
    type: String,
    required: false
  },
  sharecode:{
    type: String,
    required: false
  }
});

module.exports = mongoose.model('demat', stockSchema);

/*



{
    "_id": {
        "$oid": "65ca6545529221312b3acabb"
    },
    "id": "1",
    "buy_type": "0",
    "marketcap": null,
    "ipo_type": "Mainboard",
    "groupname": "Others",
    "sectorname": "Automobile",
    "buynow": "Track",
    //"share_name": "ASHLEY",
    "sharecode": "ASHOKLEY",
    //"sid": "ASOK",
    //"sid_grow": "ASHOKLEY",
    "sid_grow_status": "1",
    //"stock": "ASHLEY",
    "algo_status": null,
    "algo_buy_price": "0",
    "buy_price": {
        "$numberInt": "115"
    },
    "buy_price_strong": "0.00",
    "buy_price_verystrong": "0.00",
    "buy_price_veryverystrong": "0.00",
    "buy_price_strongest": "0.00",
    "target_price": "0.00",
    "ltp_prev": "176.00",
    //"ltp": "173.45",
    "high": "189.40",
    "low": "116.50",
    //"qty": "6",
    //"cost": "122.16",
    "total": "732.94",
    //"sold_qty": "6",
    "sold_price": "128.06",
    "sold_total": "768.37",
    "dividend": "0.00",
    "current_investment": "0.00",
    "cmp_total": "0",
    "total_profit": "35.00",
    "profit_percent": "4.78",
    "pltype": "1",
    "order_by": "999",
    "trackby": "99",
    "ltp_updated_at": "2024-02-09 23:28:43",
    "updated_at": "2024-02-09 23:28:43",
    "high_updated_at": "2023-08-29 10:46:07",
    "low_updated_at": "2022-05-09 08:11:03",
    "deleted_at": null,
    "qty_bk": "6",
    "cost_bk": "121.08",
    "sold_price_bk": "129.28",
    "sold_qty_bk": "6",
    "sold_date": "2022-05-21",
    "note": null,
    "url": "https://www.moneycontrol.com/india/stockpricequote/auto-lcvshcvs/ashokleyland/AL(?sc_did=AL(&classic=true",
    "url_moneycontrol": null,
    "moneyworks4me": null
}
























{
    "_id": {
        "$oid": "65ca6545529221312b3acabb"
    },
    "id": "1",
    "buy_type": "0",
    "marketcap": null,
    "ipo_type": "Mainboard",
    "groupname": "Others",
    "sectorname": "Automobile",
    "buynow": "Track",
    //"share_name": "ASHLEY",
    "sharecode": "ASHOKLEY",
    //"sid": "ASOK",
    //"sid_grow": "ASHOKLEY",
    "sid_grow_status": "1",
    //"stock": "ASHLEY",
    "algo_status": null,
    "algo_buy_price": "0",
    "buy_price": {
        "$numberInt": "115"
    },
    "buy_price_strong": "0.00",
    "buy_price_verystrong": "0.00",
    "buy_price_veryverystrong": "0.00",
    "buy_price_strongest": "0.00",
    "target_price": "0.00",
    "ltp_prev": "176.00",
    //"ltp": "173.45",
    "high": "189.40",
    "low": "116.50",
    //"qty": "6",
    //"cost": "122.16",
    "total": "732.94",
    //"sold_qty": "6",
    "sold_price": "128.06",
    "sold_total": "768.37",
    "dividend": "0.00",
    "current_investment": "0.00",
    "cmp_total": "0",
    "total_profit": "35.00",
    "profit_percent": "4.78",
    "pltype": "1",
    "order_by": "999",
    "trackby": "99",
    "ltp_updated_at": "2024-02-09 23:28:43",
    "updated_at": "2024-02-09 23:28:43",
    "high_updated_at": "2023-08-29 10:46:07",
    "low_updated_at": "2022-05-09 08:11:03",
    "deleted_at": null,
    "qty_bk": "6",
    "cost_bk": "121.08",
    "sold_price_bk": "129.28",
    "sold_qty_bk": "6",
    "sold_date": "2022-05-21",
    "note": null,
    "url": "https://www.moneycontrol.com/india/stockpricequote/auto-lcvshcvs/ashokleyland/AL(?sc_did=AL(&classic=true",
    "url_moneycontrol": null,
    "moneyworks4me": null
}

*/


