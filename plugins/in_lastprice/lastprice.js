var usecase = require('ripple-usecase');
var Promise = require('bluebird');
var log = console.log;

var createBook = function(remote, pair, list){
    var w = pair.split('_');
    var base = w[0].split('.');
    if(base.length === 1) base.push(null);
    var counter = w[1].split('.');
    if(counter.length === 1) counter.push(null);

    var book = {
        bid : remote.book(base[0], base[1], counter[0], counter[1]),
        ask : remote.book(counter[0], counter[1], base[0], base[1]),
    }
    book.bid.on('trade', createTradeListener(pair, 'bids', list));
    book.ask.on('trade', createTradeListener(pair, 'asks', list));
    return book;
}
var createTradeListener = function(pair, action, list){
    return function(gets, pays, offerAccount, takerAccount){
        tradeConvert(pair, action, gets, pays, offerAccount, takerAccount).forEach(function(w){
            list.push(w);
        })
    }
}
var tradeConvert = function(pair, action, gets, pays, offerAccount, takerAccount){
    var ret = [];
    if (gets.is_valid() && pays.is_valid()){
        switch(action){
        case 'asks':
            ret.push({
                pair : pair,
                type : action,
                price : parseFloat(pays.ratio_human(gets).to_human().split(',').join('')),
                amount : parseFloat(gets.to_human().split(',').join('')),
            });
            break;
        case 'bids':
            ret.push({
                pair : pair,
                type : action,
                price : parseFloat(gets.ratio_human(pays).to_human().split(',').join('')),
                amount : parseFloat(pays.to_human().split(',').join('')),
            })
            break;
        }
    }
    return ret;
}
var calcLastPrice = function(list){
    if(list.length === 0) return [];
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
    var bids = list.filter(function(v){return v.type === 'bids'}).sort(sortDesc())
    var asks = list.filter(function(v){return v.type === 'asks'}).sort(sortAsc())
    var bidamount = bids.reduce(reducer(), 0)
    var askamount = asks.reduce(reducer(), 0)
    return [
        bidamount > askamount ?
            { price : bids[0].price, type : bids[0].type } :
            { price : asks[0].price, type : asks[0].type }
    ];
}


var LastPrice = module.exports = function(remote, wallet, appEvent){
    this.info = {}

    this.pair = wallet.pair;
    this.event = appEvent;

    var self = this;
    var listeners = {};
    listeners['ledger'] = function(info){
        self.setLedger(info);
    }
    this.listeners = listeners;

    this.work = [];
    this.book = createBook(remote, wallet.pair, this.work);

    // must be last initialize
    this.initialize();
}
LastPrice.prototype.initialize = function(){
    var self = this;
    Object.keys(this.listeners).forEach(function(key){
        self.event.on(key, self.listeners[key]);
    })
}
LastPrice.prototype.finalize = function(){
    var self = this;
    Object.keys(this.listeners).forEach(function(key){
        self.event.removeListener(key, self.listeners[key]);
    })
}
LastPrice.prototype.setLedger = function(info){
    this.info = info;
}
LastPrice.prototype.update = function(){
    var self = this;
    if(this.work.length > 0){
        calcLastPrice(this.work).forEach(function(w){
            self.event.emit('lastprice', self.pair, w.price);
        })
        this.work.length = 0;
    }
}

