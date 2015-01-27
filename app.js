#!/usr/bin/env node
var events = require('events');
var rp = require('ripple-lib-promise');
var usecase = require('ripple-usecase');
var pluginLoader = require('./lib/plugin_loader');
var agentLoader = require('./lib/agent_loader');

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

var sensor_init = function(){
    var plugins = pluginLoader.scan(__dirname + '/plugins');
    var list = [];
    agentLoader.scan(__dirname + '/sensors').forEach(function(a){
        plugins.filter(function(v){
            return a.data.load === true
                && v.name === a.data.sensor
        }).forEach(function(p){
            list.push(function(remote, appEvent){
                console.log('sensor install:', a.name)
                return p.createInstance(remote, a.data, appEvent);
            })
        });
    })
    return list;
}

var agent_init = function(){
    var plugins = pluginLoader.scan(__dirname + '/plugins');
    var list = [];
    agentLoader.scan(__dirname + '/agents').forEach(function(a){
        plugins.filter(function(v){
            return a.data.load === true
                && v.name === a.data.agent
        }).forEach(function(p){
            list.push(function(remote, appEvent){
                console.log('agent install:', a.name)
                return p.createInstance(remote, a.data, appEvent);
            })
        });
    })
    return list;
}

var initialize = function(remote, sensors, agents, appEvent){

    ledger_loop(remote, function(info){
        appEvent.emit('ledger', info);
        sensors.forEach(function(sensor){
            sensor.update();
        })
        agents.forEach(function(agent){
            agent.update();
        })
    });
}

var main = module.exports = function(){
    var appEvent = new events.EventEmitter();
    appEvent.setMaxListeners(512);

    var sensorlist = sensor_init(appEvent);
    var agentlist = agent_init(appEvent);

    var connection_timeout = 60;
    log('lemmings-ripple startup');
    rp.createConnect(connection_timeout).then(function(remote){
        log('lemmings-ripple rippled websocket connected');
        var sensors = sensorlist.map(function(v){
            return v(remote, appEvent);
        })
        var agents = agentlist.map(function(v){
            return v(remote, appEvent);
        })
        initialize(remote, sensors, agents, appEvent);
    })
}

main();
