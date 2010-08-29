/*	anansi.js
 *	
 *	This almost always runs in an extreme sandbox environment. Huzzah!
 *	@Author: Ryan McGrath (ryan@venodesigns.net)
 */

var DEBUG = false;

/*  Think of this as the core library... (jonas: yeah that's why have a file called core.js, too.)*/
var runner = {
    /*  API/whatever key */
    key: null,
    current_job: null,
    algorithm: null, // can be either a map or reduce function
    runtime_data: null,
    cu_per_s: 0, // computing units per second
    interval_break: 100, //ms
    
    /**
     * here is an arbitrary definition:
     * the time it takes to 
     */
    speedTest: function() {
 
        var sqrt = function(x) {
            var j = x / 2;
            var min = 0;
            var max = x;
            for (var i=0; i<100; i++) {
                if (j * j > x) {
                    max = j;
                } else {
                    min = j;
                }
                // print(max - min);
                j = max - ((max - min)/2);
            }
            return j;
        };
                
        var threshold = 300, // ms
            num = 2, 
			repeat = 1000000;
            
        // TODO find a better benchmark, this is ridiculous
        var end_time,
            start_time = new Date().getTime();

        /**
         * let the execution of the following task be a computing unit
         */
        for (var i=0; i<repeat; i++) {
            sqrt(num);
            
            if((i%10 === 0) && (new Date().getTime() - start_time) > threshold) {
                // bad luck, we're out of time
                // estimate how long the task would have taken
                end_time = Math.floor(new Date().getTime() + (repeat - i) * ((new Date().getTime() - start_time) / i));
                if(DEBUG) self.postMessage("Estimating performance!");
                break;
            }

            if (i === repeat-1) {
                end_time = new Date().getTime();
            }
        }

        var delta = end_time - start_time;
        runner.cu_per_s = 1000/delta;
        if(DEBUG) self.postMessage("Established Computing Units /s: "+runner.cu_per_s.toString().substr(0,5));
    },

    /**
     * Gets a job
     * - GET /workers/job
     * - checkout ou
     */
    getJob: function() {
        
        if (runner.current_job) {
            if(DEBUG) self.postMessage("Stop calling getJob when a job is still running. That's stoopid");
            return;
        }
        if(DEBUG) self.postMessage("Pulling new job now ... ");
        
        var job = JSON.parse(runner.req("/workers/job", "GET"));
        if (!job) {
            // see you soon?
            if(DEBUG) self.postMessage("Failed to get a job");
            //setTimeout(runner.getJob, 2000);
            return;
        }
        
        runner.current_job = job;
        if(DEBUG) self.postMessage("Received job:");
        //self.postMessage(job);
        // download the algorithm
        if(DEBUG) self.postMessage("Received "+ job.type + " algo: "+job.algorithm);
        runner.algorithm = eval("("+job.algorithm+")"); // gives u goosebumps
        runner.runtime_data = {
            done: false,
            iteration: 0,
            results: [] // key -> value
        };
        
        runner.runJob();
        
    },

    /**
     * Runs the job by applying the current algorithm repetitively on a runtime_data object
     * until the done property of that object is true.
     *
     * TODO: give the algorithms access to more elborate functions such as log, etc
     */
    runJob: function() {
        // TODO sanity checks; is all the booze we need in memory?
        var interval = setInterval(function(){
            if (runner.runtime_data.done) {
                clearInterval(interval);
                runner.finishJob();
            } else {
                if(DEBUG) postMessage("Running iteration "+runner.runtime_data.iteration+" ...(crazy)");
                runner.algorithm.call(runner.runtime_data, runner.current_job.input.key, runner.current_job.input.value);
                runner.runtime_data.iteration++;
            }
        }, runner.interval_break);
    },
    
    finishJob: function() {
        if(DEBUG) self.postMessage("Finished job id=" + runner.current_job.id + " after " + runner.runtime_data.iteration + " with result");
        //self.postMessage(runner.runtime_data.results);
        runner.req("/workers/job/"+runner.current_job.id, "POST", runner.runtime_data.results);
    },
    

    /*  This doesn't have to actually be async for right now, since Workers
     *  are already async/independent of the rest of the browser.
     *
     *  type = 'GET' or 'POST'
     *  querystring = &-delimited string of junk
     */
    req: function(url, method, data) {
        var xhr = new XMLHttpRequest();
        // TODO construction of the query strink like this stanks
        xhr.open(method, url + "?key="+runner.key, false);
        xhr.setRequestHeader("Content-Type", "application/json");

        var data_str = typeof data === 'object' ? JSON.stringify(data) : data;
        // TODO potentially set headers
        xhr.send(data_str);


        if (xhr.status !== 200) {
            if(DEBUG) self.postMessage("Received status " + xhr.status + " when " + method + "ing " + url);
            return false;
        }

        /*  This could become something else later, dunno */
        var results = xhr.responseText;
        
        //self.postMessage(xhr.responseText);
        
        /* Depending on what's passed back, this needs to go to one of the below functions. */
        
        return results;
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

/* This is our "catch events" piece - every time our Worker
 * is spoken to, this gets run. 
 */
self.addEventListener('message', function(message) {
    //if(typeof message !== 'object' || message.command === undefined) {
    //    self.postMessage("Mum, stop sending me useless commands.");
    //}
    
    switch(message.data) {
        case "init":
            if(DEBUG) self.postMessage("Initialized runner with key " + runner.key);
            //runner.key = .key;
            break;
        
        case "start":
            if(DEBUG) self.postMessage("Starting runner now ...");
            // magic. begins. here.
            runner.speedTest();
            
            // speedTest will take a while, let's not get the long-running script warning
            setTimeout(runner.getJob, 100);
            break; 
    }
}, false);
