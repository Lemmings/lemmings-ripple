var OrderbookAgent = require('./orderbook_agent');

var createInstance = module.exports = function(remote, data, appEvent){
    var w = new OrderbookAgent(remote, data, appEvent);
    return {
        update : function(){ return w.update() },
    }
}

