var Promise = require('bluebird');
var readFile = Promise.promisify(require("fs").readFile);

var header =   "'use strict';\n"
             + "var require;\n"
             + "var exports = {\n"
             + " _initialize : function(_require){\n"
             + "  require = _require;\n"
             + "  if(exports.initialize)exports.initialize();\n"
             + " },\n"
             + " _finalize : function(){\n"
             + "  if(exports.finalize)exports.finalize();\n"
             + " },\n"
             + "};\n"
             ;
var footer = "return exports;\n";

var Plugin = module.exports = function(filename){
    this.filename = filename;
    this.isReady = false;
    this.instance = null;
    this.work = {};
}

Plugin.prototype.initialize = function(){
    var self = this;
    this.isReady = false;
    return readFile(this.filename, 'utf8').then(function(data){
        var func = new Function(header + data + footer);
        self.instance = func();
        self.instance._initialize(require);
        self.isReady = true;
        return self;
    }).catch(function(err){
        console.log(err)
        return self;
    })
}

Plugin.prototype.finalize = function(){
    if(this.isReady) this.instance._finalize();
}

Plugin.prototype.run = function(param){
    if(this.isReady) this.instance.run(this.work, param);
}

