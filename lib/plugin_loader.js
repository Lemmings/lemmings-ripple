var fs = require('fs');
var scan = exports.scan = function(dir){
    var files = fs.readdirSync(dir);
    return files.filter(function(v){return fs.statSync([dir, v].join('/')).isDirectory()}).
        map(function(v){
            return {
                name : v,
                createInstance : require([dir, v].join('/')),
            }
        })
}
