const algebra = require("./evaluator/algebra.js");
const generator = require("./evaluator/generator.js");
const logic = require("./evaluator/logic.js");
const object = require("./evaluator/object.js");

const parser = require("./evaluator/parser.js");

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

var l = new parser.RA.Lexer();
var p = new parser.RA.Parser();
var v = new parser.RA.Evaluator();
let input = "A.x ≠ B";
input = "A.x ⋉ B";
input = "A ⋉{A.x = B.y} B";
console.log(input);
let lexd = l.lex(input);
let parsed = p.parse(lexd);
console.log(parsed);
console.log(v.visit(parsed));

module.exports = {
    algebra: algebra,
    generator: generator,
    logic: logic,
    object: object
};