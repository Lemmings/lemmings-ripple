#!/usr/bin/env node
var rp = require('ripple-lib-promise');
var usecase = require('ripple-usecase');

var log = console.log;

var ledger_loop = function(remote, update_func){
    var prevtime = process.uptime();
    remote.on('ledger_closed', function(v){
        var currenttime = process.uptime();
        var deltatime = currenttime - prevtime;
        var ledger_time = usecase.util.time.rippleTimeToMoment(v.ledger_time);
        var info = {
            uptime:currenttime,
            deltatime:deltatime,
            time:ledger_time.format(),
            unixtime:ledger_time.unix(),
            index:v.ledger_index,
            txn_count:v.txn_count,
        };
        update_func(info);
        prevtime = currenttime
    })
}

var AgentManager = require('./lib/agent_manager');
var agentManager = new AgentManager();
var initialize = function(remote){

    ledger_loop(remote, function(info){
        agentManager.run(info);
    });

}

var main = module.exports = function(){

    var connection_timeout = 60;
    log('lemmings-ripple startup');
    agentManager.initialize(['./sample_ai']).then(function(){
        return rp.createConnect(connection_timeout).then(function(remote){
            log('lemmings-ripple rippled websocket connected');
            initialize(remote);
        })
    })
}

main();
