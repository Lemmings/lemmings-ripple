var Promise = require('bluebird');
var readdir = Promise.promisify(require("fs").readdir);
var Plugin = require('./plugin');

var scanDirs = function(dirs){
    return Promise.all(dirs.map(function(dir){
        return readdir(dir).map(function(file){ return [dir,file].join('/') })
    }));
}

var AgentManager = module.exports = function(){
    this.plugins = [];
}

AgentManager.prototype.initialize = function(dirs){
    if(!(dirs instanceof Array)) dirs = [dirs];

    var self = this;
    this.plugins = [];
    return scanDirs(dirs).then(function(res){
        return Promise.all(res.map(function(files){
            return files.map(function(file){ return new Plugin(file) })
        })).then(function(res){
            res.forEach(function(plugins){
                self.plugins = self.plugins.concat(plugins);
            })
            return Promise.all(self.plugins.map(function(plugin){ return plugin.initialize() }))
        })
    })
}

AgentManager.prototype.finalize = function(){
    this.plugins.forEach(function(plugin){
        plugin.finalize();
    })
}

AgentManager.prototype.reload = function(){
    return Promise.all(this.plugins.map(function(plugin){
        return plugin.initialize();
    }))
}

AgentManager.prototype.run = function(param){
    this.plugins.forEach(function(plugin){
        plugin.run(param);
    })
}


