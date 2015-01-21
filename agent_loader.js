var fs = require('fs');
var scan = exports.scan = function(dir){
    var files = fs.readdirSync(dir);
    return files.filter(function(v){return v.match(/.json/) && !fs.statSync([dir, v].join('/')).isDirectory()}).
        map(function(v){
            return {
                name : v,
                data : JSON.parse(fs.readFileSync([dir, v].join('/'), 'utf8')),
            }
        })
}
