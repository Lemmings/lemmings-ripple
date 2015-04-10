var usecase = require('ripple-usecase');
var Promise = require('bluebird');
var agent = require('./basic_agent');
var log = console.log;

var OrderbookAgent = module.exports = function(remote, wallet, appEvent){
    this.info = {}

    this.pair = wallet.pair;
    this.event = appEvent;

    var self = this;
    var listeners = {};
    listeners['ledger'] = function(info){
        self.setLedger(info);
    }
    this.listeners = listeners;

    this.wallet = new usecase.TradeWallet(remote, '', '');

    // must be last initialize
    this.initialize();
}
OrderbookAgent.prototype.initialize = function(){
    var self = this;
    Object.keys(this.listeners).forEach(function(key){
        self.event.on(key, self.listeners[key]);
    })
    this.agent = agent(this, 1, 'watch');
}
OrderbookAgent.prototype.finalize = function(){
    var self = this;
    Object.keys(this.listeners).forEach(function(key){
        self.event.removeListener(key, self.listeners[key]);
    })
}
OrderbookAgent.prototype.setLedger = function(info){
    this.info = info;
}
OrderbookAgent.prototype.update = function(){
    this.agent.heartbeat();
}
OrderbookAgent.prototype.checkMarket = function(type){
    return true;
}
OrderbookAgent.prototype.actionMarket = function(type){
    var self = this;
    return this.wallet.orderbook(this.pair, 4).then(function(book){
        self.event.emit('orderbook', book.pair, book);
        return book;
    })
}
OrderbookAgent.prototype.getSleepTime = function(){
    return 0;
}

