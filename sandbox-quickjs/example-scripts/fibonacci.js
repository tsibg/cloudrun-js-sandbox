var fib = [0, 1];
var limit = (find||10);
for(var i=fib.length; i<=(limit); i++) {
    fib[i] = fib[i-2] + fib[i-1];
}

`Fibonacci[${limit}]: ${fib[limit]} after ${fib.length} calcs.`;