#!/usr/bin/env node
var rp = require('ripple-lib-promise');
var usecase = require('ripple-usecase');
var pluginLoader = require('./lib/plugin_loader');
var agentLoader = require('./lib/agent_loader');
var sensor = require('./lib/sensor');

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

var agent_init = function(){
    var plugins = pluginLoader.scan(__dirname + '/plugins');
    var list = [];
    agentLoader.scan(__dirname + '/agents').forEach(function(a){
        plugins.filter(function(v){
            return a.data.load === true
                && v.name === a.data.agent
        }).forEach(function(p){
            list.push(function(remote){
                console.log('agent install:', a.name)
                return p.createInstance(remote, a.data);
            })
        });
    })
    return list;
}

var initialize = function(remote, agents){

    agents.forEach(function(agent){
        var pair = agent.getPair().split('_');
        sensor('EXCHANGE', {
                BASE:pair[0].split('.'),
                COUNTER:pair[1].split('.'),
            },
            function(v){ agent.setLastPrice(v) },
            function(v){ agent.setOrderBook(v) }
        );
    })
    ledger_loop(remote, function(info){
        agents.forEach(function(agent){
            agent.setLedger(info);
            agent.update();
        })
    });
}

var main = module.exports = function(){
    var agentlist = agent_init();

    var connection_timeout = 60;
    log('lemmings-ripple startup');
    rp.createConnect(connection_timeout).then(function(remote){
        log('lemmings-ripple rippled websocket connected');
        var agents = agentlist.map(function(v){
            return v(remote);
        })
        initialize(remote, agents);
    })
}

main();
