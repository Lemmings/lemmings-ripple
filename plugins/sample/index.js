var SampleAgent = require('./sample_agent');

var createInstance = module.exports = function(remote, data, appEvent){
    var w = new SampleAgent(remote, data, appEvent);
    return {
        update : function(){ return w.update() },
    }
}

