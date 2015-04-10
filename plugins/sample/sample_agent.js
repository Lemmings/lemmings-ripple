var usecase = require('ripple-usecase');
var Promise = require('bluebird');
var agent = require('./basic_agent');
var log = console.log;

var SampleAgent = module.exports = function(remote, wallet, appEvent){
    this.lastprice = 0;
    this.book = {asks:[], bids:[]};
    this.info = {}

    this.pair = wallet.pair;
    this.event = appEvent;

    var self = this;
    var listeners = {};
    listeners['lastprice'] = function(pair, lastprice){
        if(self.pair === pair)self.setLastPrice(lastprice);
    }
    listeners['orderbook'] = function(pair, book){
        if(self.pair === pair)self.setOrderBook(book);
    }
    listeners['ledger'] = function(info){
        self.setLedger(info);
    }
    this.listeners = listeners;

    // must be last initialize
    this.initialize();
}
SampleAgent.prototype.initialize = function(){
    var self = this;
    Object.keys(this.listeners).forEach(function(key){
        self.event.on(key, self.listeners[key]);
    })
    this.agent = agent(this, 1, 'watch');
}
SampleAgent.prototype.finalize = function(){
    var self = this;
    Object.keys(this.listeners).forEach(function(key){
        self.event.removeListener(key, self.listeners[key]);
    })
}
SampleAgent.prototype.setLastPrice = function(lastprice){
    this.lastprice = lastprice;
}
SampleAgent.prototype.setOrderBook = function(book){
    this.book = book;
}
SampleAgent.prototype.setLedger = function(info){
    this.info = info;
}
SampleAgent.prototype.update = function(){
    this.agent.heartbeat();
}
SampleAgent.prototype.checkMarket = function(type){
    var self = this;
    var msglist = [];
    msglist.push(function(){
        console.log('ripple is %s. transaction count is %d', self.info.txn_count > 15 ? 'busy' : 'free', self.info.txn_count)
    })
    msglist.push(function(){
        console.log('ripple ledger close time. %s.', self.info.time)
    })
    msglist.push(function(){
        console.log('I\'m working %d seconds.', self.info.uptime)
    })
    msglist.push(function(){
        console.log('ripple current ledger index.', self.info.index)
    })
    msglist.push(function(){
        console.log('I am a Sample Agent[%s]. watching %s', type, self.pair);
    })
    msglist.push(function(){
        console.log('hello world.');
    })
    var rnd = Math.random() * msglist.length;
    msglist[Math.floor(rnd)]();
    return false;
}
SampleAgent.prototype.getSleepTime = function(){
    return 11 * 1000;
}

