We're Awesome
=============
README driven development! Here we go!

Anansi (why is it called like that?) is a distributed MapReduce implementation for JavaScript that runs on the worlds largest computational network. Consumer PCs.


Trade-offs
-------------

Technically there is no reason not to run MapReduce jobs on idling web clients. But of course this was a competition and we had to spend some time to implement cool realtime scrolling graphs, so some things were left out.

* There is no input reader step. Data has to be uploaded in chunks.
* There's always exactly one map phase and one reduce phase. No partitions and you can't supply a partitioning function.
* The grouping step after the map step is lame and slow.
* Results aren't validated by more than one client.
* We're using a relational database *goes and hides in the basement*

Thanks To
-------------
* This blog post: http://www.igvita.com/2009/03/03/collaborative-map-reduce-in-the-browser/
* http://jsdc.appspot.com/
* My mother! My father! My sister and my brother!
