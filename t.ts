function* foo() {
  if (Math.random() < 0.9) yield 100;
  return "Finished!"
}

let iter = foo();
let cur;
while (cur = iter.next(),!cur.done){
  console.log(cur.value);
}
