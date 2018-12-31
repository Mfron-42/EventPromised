
# EventPromised

Combine event and promise

Example :


    import  EventPromised  from  "event-promised";
    
    new  EventPromised((resolve, error, emit ) => {
	    emit("A","Print for event A");
	    emit("B", "Print for event B");
	    emit("B", "Not printed because subscibed from once");
	    resolve("Promise solved");
    })
    .on("A", (res) => {
	    console.log(res);
    })
    .once("B", (res) => {
	    console.log(res);
    })
    .then((res) => {
	    console.log(res);
    })
    .then(() => new EventPromised((resolve) =>  resolve("Result from new EventPromised promise")))
    .then((res) => {
	    console.log(res);
    })
