var redis = require('redis');

var sub = redis.createClient();
var cli = redis.createClient();

var getRoundPrice = function(type, price){
    var digit = 6;
    var n = Math.pow(10, digit);
    switch(type){
    case 'bid':
        return Math.floor(price * n) / n;
    case 'ask':
        return Math.ceil(price * n) / n;
    }
    return 0;
}
var getLastPrice = function(trades){
    if(trades.length === 0) return [];
    var sortDesc = function(){
        return function(a,b){
            if(a.price < b.price) return 1;
            else if(a.price > b.price) return -1;
            else return 0;
        }
    }
    var sortAsc = function(){
        return function(a,b){
            if(a.price < b.price) return -1;
            else if(a.price > b.price) return 1;
            else return 0;
        }
    }
    var reducer = function(){
        return function(r, v){
            return r + v.amount.base;
        }
    }
    var bids = trades.filter(function(v){return v.type === 'bid'}).sort(sortDesc())
    var asks = trades.filter(function(v){return v.type === 'ask'}).sort(sortAsc())
    var bidamount = bids.reduce(reducer(), 0)
    var askamount = asks.reduce(reducer(), 0)
    return [
        bidamount > askamount ?
            { price : bids[0].price, type : bids[0].type } :
            { price : asks[0].price, type : asks[0].type }
    ];
}

var initialize = module.exports = function(key, data, callback_lastprice, callback_orderbook){
    var pair = [data.BASE[0], data.COUNTER[0]].join('_');
    var pairfull = [data.BASE.join('.'), data.COUNTER.join('.')].join('_');

    var trades_key = [key, 'TRADES', pair].join('|')
    var books_key = [key, 'BOOKS', pair].join('|')


    sub.hget(trades_key, pairfull, function(err, data){
        if(!err && data){
            var w = JSON.parse(data);  
            callback_lastprice(getRoundPrice(w.type, w.price));
        }
        sub.subscribe(trades_key);
    });
    sub.hget(books_key, pairfull, function(err, data){
        if(!err && data){
            var w = JSON.parse(data);  
            callback_orderbook(w);
        }
        sub.subscribe(books_key);
    });
    var trades = [];
    sub.on('message', function(key, message){
        var data = JSON.parse(message);
        if(key === trades_key && data.pairfull === pairfull){
            if(trades.length === 0){
                setTimeout(function(){
                    getLastPrice(trades).forEach(function(data){
                        callback_lastprice(getRoundPrice(data.type, data.price));
                    })
                    trades.length = 0;
                }, 0)
            }
            trades.push(data);
        }
        else if(key === books_key && data.pair === pairfull){
            callback_orderbook(data);
        }
    })

}


