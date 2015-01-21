var SampleAgent = require('./sample_agent');

var createInstance = module.exports = function(remote, data){
    var w = new SampleAgent(remote, data);
    return {
        getPair : function(){ return w.pair },
        update : function(){ return w.update() },
        setLastPrice : function(v){ return w.setLastPrice(v) },
        setOrderBook : function(v){ return w.setOrderBook(v) },
    }
}

