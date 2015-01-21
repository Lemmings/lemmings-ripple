var usecase = require('ripple-usecase');
var Promise = require('bluebird');
var agent = require('./basic_agent');
var log = console.log;

var SampleAgent = module.exports = function(remote, wallet){
    this.lastprice = 0;
    this.book = {asks:[], bids:[]};

    this.pair = wallet.pair;
    this.wallets = {
        bid : new usecase.TradeWallet(remote, wallet.bid.address, wallet.bid.secret),
        ask : new usecase.TradeWallet(remote, wallet.ask.address, wallet.ask.secret),
    }

    // must be last initialize
    this.agents = {
        bid : agent(this, 1, 'bid'),
        ask : agent(this, 2, 'ask'),
    }
}
SampleAgent.prototype.setLastPrice = function(lastprice){
    this.lastprice = lastprice;
}
SampleAgent.prototype.setOrderBook = function(book){
    this.book = book;
}
SampleAgent.prototype.update = function(){
    this.agents.bid.heartbeat();
    this.agents.ask.heartbeat();
}
SampleAgent.prototype.checkMarket = function(type){
    console.log('I am a Sample Agent[%s]. watching %s', type, this.pair);
    return false;
}
SampleAgent.prototype.getSleepTime = function(){
    return 11 * 1000;
}

