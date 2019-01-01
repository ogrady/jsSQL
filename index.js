const algebra = require("./src/algebra.js");
const generator = require("./src/generator.js");
const logic = require("./src/logic.js");
const object = require("./src/object.js");

const parser = require("./src/parser.js");

exports.printMsg = function() {
  console.log("This is a message from the demo package");
}

/*
console.log(algebra);
console.log(generator);
console.log(logic);
console.log(object);
console.log(parser);
*/

var l = new parser.RelationalAlgebraLexer();
var p = new parser.RelationalAlgebraParser();
let input = "A.x ≠ B";
input = "A.x ⋉ B";
console.log(input);
let lexd = l.lex(input);
let parsed = p.parse(lexd);
console.log(parsed);

module.exports = {
    algebra: algebra,
    generator: generator,
    logic: logic,
    object: object
};