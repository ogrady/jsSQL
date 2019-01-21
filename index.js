const algebra = require("./evaluator/algebra.js");
const generator = require("./evaluator/generator.js");
const logic = require("./evaluator/logic.js");
const object = require("./evaluator/object.js");
const util = require("./evaluator/util.js");

module.exports = {
    algebra: algebra,
    generator: generator,
    logic: logic,
    object: object,
    util: util
};