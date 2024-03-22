let last = 0;
let attempts = 50_000_000;
console.log(`infinite.js: starting infinite loop up to ${attempts} iterations...`);

for (let i=0; i<attempts; i++) {
    if(i % 1_000_000 === 0) {
        console.log(`infinite.js: ${i}`);
    }
    last = i;
}
last;