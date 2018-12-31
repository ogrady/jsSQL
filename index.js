const algebra = require("./src/algebra.js");
const generator = require("./src/generator.js");
const logic = require("./src/logic.js");
const object = require("./src/object.js");

exports.printMsg = function() {
  console.log("This is a message from the demo package");
}

console.log(algebra);
console.log(generator);
console.log(logic);
console.log(object);