var LastPrice = require('./lastprice');

var createInstance = module.exports = function(remote, data, appEvent){
    var w = new LastPrice(remote, data, appEvent);
    return {
        update : function(){ return w.update() },
    }
}

