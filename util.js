module.exports = (function(){
    var that = {};
    
    that.stringifyFunction = function(fn) {
        return "("+fn.toString()+")";
    };
    return that;
})();