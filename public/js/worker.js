/*	Making Workers work in browsers where they don't work (yeah, sentence doesn't wor--- LOL)
 *
 *	@Author: Ryan McGrath (ryan@venodesigns.net)
 *	@Requires: Nothing special.
 */
if(!window.Worker) {
	
	/*	If true workers aren't supported, this allows the creation of a "mock" worker.
	 *	Creates a mock worker, so we can transparently use the same API in cases where Workers aren't supported. 
	 */
	var Worker = function(worker_src) {
        this.worker_src = worker_src;

		/*	We'll go ahead and download the script here. Our "Worker" goes to extra lengths to 
		 *	do things as if they're in a separate work-zone (don't repeatedly block UI, etc).
		 *
		 *	This is async if possible, but it probably won't matter in most cases.
		 */
		var newScript = document.createElement('script'),
            worker = this;

		newScript.type = 'text/javascript';
		newScript.setAttribute('async', 'true');
		newScript.src = worker_src;
	
		if(newScript.readyState)
			newScript.onreadystatechange = function() {
				if(/loaded|complete/.test(newScript.readyState)) { 
					worker.loaded = true; 
	                Worker.memcache.collect(Worker.memcache.spankin);
                   
                    setTimeout(function() {
                        var a = Worker.memcache.compare();
                        for(var i = 0; i < a.length; i++) alert(a[i]);
                    }, 10000);
                };
			};
		else
			newScript.addEventListener("load", function() { worker.loaded = true; }, false);
        
        Worker.memcache.collect(Worker.memcache.old);
        document.documentElement.firstChild.appendChild(newScript); 
    };

    /*  Worker.memcache isn't exactly what you think it is. We basically use this to monitor
     *  global additions to the window namespace, so we can scope new shit based on script loading.
     *  
     *  This isn't 100% reliable,
     */
    Worker.memcache = {
        old: [], /* Original */
        spankin: [], /* brand new, keep your mind out of the gutter ;P */
 
        /*  Build a collection of currently scoped junk on the window object. We do this twice per
         *  load, so we have a record of "new" additions into this fucking barren wasteland of a cornfield.
         *  Oh god it's 1AM.
         */
        collect: function(arr) {
            for(var i in window) {
                arr.push(i.toString());
            }
        },

        /*  Returns an array of global function names that were added between two points in time.
         *  Requires calling Worker.memcache.collect() on old and spankin first.
         */
        compare: function() {
            var new_functions = [],
                sp = Worker.memcache.spankin.reverse(),
                old = Worker.memcache.old.reverse();
            
            for(var i = 0; i < sp.length; i++) {
                if(sp[i] !== old[i]) new_functions.push(sp[i]);
            }
            
            return new_functions;
        }
    };

	/*	Utility function, yo. Eff libraries (yeah, this is itself a library. */
	Worker.bind = function(bindReference, fn) {
		return function() {
			return fn.apply(bindReference, arguments);
		};
	};

	/*	Ugly black magic. Hijack every unsafe method known to man and do it with style. ;D */
	Worker.prototype = {
        loaded: false,
		messageQ: [],

        clearQ: function() {
            for(var i = 0; i < this.messageQ.length; i++) {
                this.msgCallback(this.messageQ[i]);
            }
        },

        msgCallback: null,

		postMessage: function(msg) { 
			if(!this.loaded) this.messageQ.push(msg);
			else this.msgCallback(msg);
		},

		addEventListener: function(st, fn, bl) { this.msgCallback = fn; }
	};
}
