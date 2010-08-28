/*	anansi.js
 *	
 *	This almost always runs in an extreme sandbox environment. Huzzah!
 *	@Author: Ryan McGrath (ryan@venodesigns.net)
 */

/*  Think of this as the core library... */
var runner = {
    /*  API/whatever key */
    key: null,

    /*  This doesn't have to actually be async for right now, since Workers
     *  are already async/independent of the rest of the browser.
     *
     *  type = 'GET' or 'POST'
     *  querystring = &-delimited string of junk
     */
    send: function(type, querystring) {
        var xhr = new XMLHttpRequest();
        xhr.open(type, "http://projects.venodesigns.net/b/js/example.json?key=" + runner.key + querystring, false);
        xhr.send();
        
        /*  This could become something else later, dunno */
        var results = JSON.parse(xhr.responseText);
        //self.postMessage(xhr.responseText);
        /* Depending on what's passed back, this needs to go to one of the below functions. */
    },

	map: function(problemID, key, value, fn) {
		// fetchResource, moves to init afterwards
	},
	
	emit: function(runType, key, value) {
		// Post back, pull down something new
	},

    /*  The beauty of Workers is that we never really run into advanced scoping issues;
     *  this is a holdover from when I built a stupid crazy chained debugger to figure out
     *  why certain properties weren't available here. Keep it around for the time being...
     */
    truebind: function(bindReference, fn) {
	    return function() {
		    return fn.apply(bindReference, arguments);
	    };
    }
};

/*	This is our "catch events" piece - every time our Worker
 *	is spoken to, this gets run. 
 */
self.addEventListener('message', function(key) {
    runner.key = key.data;
    runner.send('GET', '');
}, false);
