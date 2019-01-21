"use strict";
const { Factory, Tuple, Relation } = require("./object.js");
const { U } = require("./util.js");
const {
    Operation,
    UnaryOperation,
    BinaryOperation,
    GroupBy,
    Projection,
    Selection,
    Rename,
    Distinct,
    OrderBy,
    Union,
    Intersection,
    Without,
    CrossProduct,
    EquiJoin,
    NaturalJoin,
    LeftJoin,
    RightJoin,
    FullOuterJoin,
    LeftSemiJoin,
    RightSemiJoin
} = require("./algebra.js");
const {
    Predicate: Predicate,
    Not: Not,
    And: And,
    Or: Or
} = require("./logic.js");

// DATA
var UTData = {
    persons:  new Relation("Persons", ["pid", "name", "age"]),
    persons2: new Relation("Persons2", ["pid", "name", "age"]),
    persons3: new Relation("Persons3", ["pid", "name", "height"]),
    orders:   new Relation("Orders", ["oid", "ordered_by", "total_value"]),
    orders2:  new Relation("Orders2", ["oid", "ordered_by", "total_value"]),
    points:   new Relation("Points", ["x", "y"]),
    temperatures: new Relation("Temperatures", ["c"]),
    chars:    new Relation("Chars", ["char", "x"]),
    obj1:     new Tuple({x: 1, y: 1, desc: "Start"}),
    obj2:     new Tuple({x: 1, y: 2, desc: "Destination"})
}
UTData.persons.createFromColumns({
    "pid": [1,2],
    "name": ["Bob", "Alice"],
    "age": [14,32]
});
UTData.persons2.createFromColumns({
    "pid": [3,2],
    "name": ["Dave", "Alice"],
    "age": [40,32]
});
UTData.persons3.createFromColumns({
    "pid": [3,1,4],
    "name": ["Dave", "Alice", "Eve"],
    "height": [1.8, 1.62, 1.66]
});
UTData.orders.createFromColumns({
    "oid": [1,2,3],
    "ordered_by": [1,1,2],
    "total_value": [1000,100,10]
});
UTData.orders2.createFromColumns({
    "oid": [1,2,3,4],
    "ordered_by": [1,1,2,42],
    "total_value": [1000,100,10,1]
});
UTData.points.createFromColumns({
    "x": [1,42,1,66],
    "y": [1,4,1,77]
});
UTData.temperatures.createFromColumns({
    "c": [40,-4]
});
UTData.chars.createFromColumns({
    "char": ["a","b","a","c","d","e","b","a"],
    "x": [2,1,1,1,1,1,2,3]
});


function TestSuite() {
    this.executeOp = function(operation, inp1, inp2) {
        var applies = 0;
        var executed = 0;
        operation.onApplied.push(function(t) { applies++; } );
        operation.onExecuted.push(function(t) { executed++; } );
        var res = operation.execute(inp1, inp2);
        
        U.expect(applies, res.tuples.length, "Too few applies", (x,y) => x >= y);
        U.expect(executed, 1, "Not executed exactly once");
        return res;
    };
    
    this.ut_types = function() {
        U.assertType(UTData.persons, Relation);
        U.assertType({}, Object);
        U.assertType([], Array);
    };

    this.ut_equality = function() {
        U.assert( U.equal({x:1, y:2}, {x:1, y:2}, "Map Equality"));
        U.assert(!U.equal({x:2, y:2}, {x:1, y:2}, "Map Inequality (attribute)"));
        U.assert(!U.equal({x:2, y:2}, {x:1, z:2}, "Map Inequality (key)"));
        U.assert(!U.equal({x:2, y:2}, {x:1, y:2, z:3}, "Map Inequality (length)"));
        U.assert( U.equal([1,2,3], [1,2,3], "Array Equality"));
        U.assert(!U.equal([1,2,3], [1,2], "Array Inequality (length)"));
        U.assert(!U.equal([1,2,3], [1,2,4], "Array Inequality (element)"));
        U.assert( U.equal(1,1), "Int Equality");
        U.assert(!U.equal(1,2), "Int Inequality");
        U.assert( U.equal({xs: [new Tuple({x:1}), new Tuple({x:2})]}, {xs: [new Tuple({x:1}), new Tuple({x:2})]}), "Complex Equality");
        U.assert(!U.equal({xs: [new Tuple({x:1}), new Tuple({x:2})]}, {xs: [new Tuple({x:1}), new Tuple({x:3})]}), "Complex Inequality");
    };
    
    this.ut_hash = function() {
        var t1 = new Tuple({"pid": null, "name": null, "height": null, "oid": 3, "ordered_by": 2, "total_value": 10});
        var t2 = new Tuple({"pid": null, "name": null, "height": null, "oid": 3, "ordered_by": 2, "total_value": 10});
        U.expect(t1.getHash(), 73231131, "Tuple Hash");
        U.expect(t1.getHash(), t2.getHash(), "Tuple Hash");
    };
    
    this.ut_equalTuples = function() {
        var t1 = new Tuple({x: 1, y: 1});
        var t2 = new Tuple({x: 1, y: 1});
        var t3 = new Tuple({x: 1, y: 2});
        U.assert(U.equal(t1,t2), "Tuple Equality by calling U.equal(x,y)");
        U.assert(t1.equals(t2),  "Tuple Equality by calling x.equals(y)");
        U.assert(!t1.equals(t3), "Tuple Inquality by calling x.equals(y)");
    };
    
    this.ut_createRelationFromCols = function() {
        var data = {"x": [1,2,3,4], "y": [4,3,2,1]};
        var r = new Relation("");
        r.createFromColumns(data);
    };
    
    this.ut_equalRelations = function() {
        var r1 = new Relation("A", ["x", "y"]);
        r1.createFromColumns({x: [1], y: [1]});
        var r2 = new Relation("B", ["x", "y"]);
        r2.createFromColumns({x: [1], y: [1]});
        var r3 = new Relation("C", ["x", "y"]);
        r3.createFromColumns({x: [1], y: [2]});
        var r4 = new Relation("D", ["x", "y"]);
        r4.createFromColumns({});
        var r5 = new Relation("E", ["x", "y"]);
        r5.createFromColumns({x: [1], y: [null]});
        
        U.assert(U.equal(r1,r2), "Relation Equality by calling U.equal(x,y)");
        U.assert(r1.equals(r2),  "Relation Equality by calling x.equals(y)");
        U.assert(!r1.equals(r3), "Relation Inquality by calling x.equals(y)");
        U.assert(!r1.equals(r4), "Relation Inquality by calling x.equals(y) (without tuples)");
        U.assert(r5.equals(r5),  "Relation Equality by calling x.equals(y) containing nulls");
        U.assert(!r5.equals(r4), "Relation Inequality by calling x.equals(y) containing nulls");
    };
    
    this.ut_schemaDisjunct = function() {
        var r1 = new Relation("A", ["x", "y"]);
        var r2 = new Relation("B", ["x", "z"]);
        var r3 = new Relation("C", ["a", "b"]);
        U.assert(r1.schemaDisjunct(r3), "Schema not disjunct although it should be");
        U.assert(!r1.schemaDisjunct(r2), "Schema disjunct althought it shouldn't be");
    };
    
    this.ut_groupOrdersById = function() {
        var op = new GroupBy(function(t) { 
            return t.get("ordered_by");
        });
        var expected = {
                    1: [new Tuple({"oid": 1, "ordered_by": 1, "total_value": 1000}), new Tuple({"oid": 2, "ordered_by": 1, "total_value": 100})],
                    2: [new Tuple({"oid": 3, "ordered_by": 2, "total_value": 10})]};
        var actual = op.execute(UTData.orders);
        U.expect(actual, expected, "Group By");
    };
    
    this.ut_joinPersonsOrders = function() {
        var op = new EquiJoin(
            function(t) { return t.get("pid"); },
            function(t) { return t.get("ordered_by")}
        );
        var expected = Factory.createRelationFromTuples("", [
            new Tuple({"pid": 1, "name": "Bob", "age": 14, "oid": 1, "ordered_by": 1, "total_value": 1000}),
            new Tuple({"pid": 1, "name": "Bob", "age": 14, "oid": 2, "ordered_by": 1, "total_value": 100}),
            new Tuple({"pid": 2, "name": "Alice", "age": 32, "oid": 3, "ordered_by": 2, "total_value": 10})
        ]);
        var actual = this.executeOp(op, UTData.persons, UTData.orders);
        U.expect(actual, expected, "Equi Join");
    };
    
    this.ut_unionPersons = function() {
        var op = new Union();
        var expected = Factory.createRelationFromTuples("", [
            new Tuple({"pid": 1, "name": "Bob", "age": 14}),
            new Tuple({"pid": 2, "name": "Alice", "age": 32}),
            new Tuple({"pid": 3, "name": "Dave", "age": 40}),
            new Tuple({"pid": 2, "name": "Alice", "age": 32})
        ]);
        var actual = this.executeOp(op, UTData.persons, UTData.persons2);
        U.expect(actual, expected, "Union");
    };
    
    this.ut_intersectPersons = function() {
        var op = new Intersection();
        var expected = Factory.createRelationFromTuples("", [new Tuple({"pid": 2, "name": "Alice", "age": 32})]);
        var actual = this.executeOp(op, UTData.persons, UTData.persons2); //intersection.execute(UTData.persons, UTData.persons2);
        U.assert(U.equal(actual, expected), "Intersection");
    };
    
    this.ut_distinct = function() {
        var op = new Distinct();
        var expected = Factory.createRelationFromTuples("", [new Tuple({"x": 1, "y": 1}), new Tuple({"x": 42, "y": 4}), new Tuple({"x": 66, "y": 77})]);
        var actual = this.executeOp(op, UTData.points);
        U.expect(actual, expected, "Distinct");
    };
    
    this.ut_crossProduct = function() {
        var op = new CrossProduct();
        var expected = Factory.createRelationFromTuples("", [
            new Tuple({"x": 1, "y": 1, "c": 40}), new Tuple({"x": 1, "y": 1, "c": -4}),
            new Tuple({"x": 42, "y": 4, "c": 40}), new Tuple({"x": 42, "y": 4, "c": -4}),
            new Tuple({"x": 1, "y": 1, "c": 40}), new Tuple({"x": 1, "y": 1, "c": -4}),
            new Tuple({"x": 66, "y": 77, "c": 40}), new Tuple({"x": 66, "y": 77, "c": -4})
        ]);
        var actual = this.executeOp(op, UTData.points, UTData.temperatures);
        U.expect(actual, expected, "Cross Product");
    };
    
    this.ut_sort = function() {
        var op = new OrderBy("char");
        var expected = Factory.createRelationFromTuples("", [
            new Tuple({"char": "a", "x": 2}),
            new Tuple({"char": "a", "x": 1}),
            new Tuple({"char": "a", "x": 3}),
            new Tuple({"char": "b", "x": 1}),
            new Tuple({"char": "b", "x": 2}),
            new Tuple({"char": "c", "x": 1}),
            new Tuple({"char": "d", "x": 1}),
            new Tuple({"char": "e", "x": 1})
        ]);
        var actual = op.execute(UTData.chars);
        U.expect(actual, expected, "Order By");
    };
    
    this.ut_projection = function() {
        var op = new Projection(["name", "age"]);
        var expected = Factory.createRelationFromTuples("", [
            new Tuple({"name": "Bob", "age": 14}),
            new Tuple({"name": "Alice", "age": 32})
        ]);
        var actual = this.executeOp(op, UTData.persons);
        U.expect(actual, expected, "Projection");
    };
    
    this.ut_selection = function() {
        var op = new Selection(
                new Predicate(function(t) { return t.get("x") > 2 } )
        );
        var expected = Factory.createRelationFromTuples("", [
            new Tuple({"char": "a", "x": 3}),
        ]);
        var actual = this.executeOp(op, UTData.chars);
        U.expect(actual, expected, "Selection");
    };
    
    this.ut_selectionOr = function() {
        var op = new Selection(
            new Or([
                new Predicate(function(t) { return t.get("char") === "c" } ),
                new Predicate(function(t) { return t.get("x") > 2 } )
            ])
        );
        var expected = Factory.createRelationFromTuples("", [
            new Tuple({"char": "c", "x": 1}),
            new Tuple({"char": "a", "x": 3}),
        ]);
        var actual = this.executeOp(op, UTData.chars);
        U.expect(actual, expected, "Selection Or");
    };
    
    this.ut_selectionAnd = function() {
        var op = new Selection(
            new And([
                new Predicate(function(t) { return t.get("char") === "a" } ),
                new Predicate(function(t) { return t.get("x") < 3 } )
            ])
        );
        var expected = Factory.createRelationFromTuples("", [
            new Tuple({"char": "a", "x": 2}),
            new Tuple({"char": "a", "x": 1}),
        ]);
        var actual = this.executeOp(op, UTData.chars);
        U.expect(actual, expected, "Selection And");
    };
    
    this.ut_selectionNot = function() {
        var op = new Selection(
            new Not(new Predicate(function(t) { return t.get("x") < 3 } ))
        );
        var expected = Factory.createRelationFromTuples("", [
            new Tuple({"char": "a", "x": 3})
        ]);
        var actual = this.executeOp(op, UTData.chars);
        U.expect(actual, expected, "Selection Not");
    };
    
    this.ut_naturalJoin = function() {
        var op = new NaturalJoin();
        var expected = Factory.createRelationFromTuples("", [
            new Tuple({"pid": 3, "name": "Dave", "age": 40, "height": 1.8 })
        ]);
        var actual = this.executeOp(op, UTData.persons2, UTData.persons3);
        U.expect(actual, expected, "Natural Join");
    };
    
    this.ut_leftJoin = function() {
        var op = new LeftJoin(
            function(t) { return t.get("pid"); },
            function(t) { return t.get("ordered_by")}
        );
        var expected = Factory.createRelationFromTuples("", [
            new Tuple({"pid": 1, "name": "Alice", "height": 1.62, "oid": 1, "ordered_by": 1, "total_value": 1000}),
            new Tuple({"pid": 1, "name": "Alice", "height": 1.62, "oid": 2, "ordered_by": 1, "total_value": 100}),
            new Tuple({"pid": 3, "name": "Dave", "height": 1.8, "oid": null, "ordered_by": null, "total_value": null}),
            new Tuple({"pid": 4, "name": "Eve", "height": 1.66, "oid": null, "ordered_by": null, "total_value": null})
        ]);
        var actual = this.executeOp(op, UTData.persons3, UTData.orders);
        U.expect(actual, expected, "Left Join");
    };
    
    this.ut_rightJoin = function() {
        var op = new RightJoin(
            function(t) { return t.get("ordered_by")},
            function(t) { return t.get("pid"); }
        );
        var expected = Factory.createRelationFromTuples("", [
            new Tuple({"pid": 1, "name": "Alice", "height": 1.62, "oid": 1, "ordered_by": 1, "total_value": 1000}),
            new Tuple({"pid": 1, "name": "Alice", "height": 1.62, "oid": 2, "ordered_by": 1, "total_value": 100}),
            new Tuple({"pid": 3, "name": "Dave", "height": 1.8, "oid": null, "ordered_by": null, "total_value": null}),
            new Tuple({"pid": 4, "name": "Eve", "height": 1.66, "oid": null, "ordered_by": null, "total_value": null})
        ]);
        var actual = this.executeOp(op, UTData.orders, UTData.persons3);
        U.expect(actual, expected, "Right Join");
    };
    
    this.ut_fullOuterJoin = function() {
        var op = new FullOuterJoin(
            function(t) { return t.get("pid"); },
            function(t) { return t.get("ordered_by")}
        );
        var expected = Factory.createRelationFromTuples("", [
            new Tuple({"pid": 1, "name": "Alice", "height": 1.62, "oid": 1, "ordered_by": 1, "total_value": 1000}),
            new Tuple({"pid": 1, "name": "Alice", "height": 1.62, "oid": 2, "ordered_by": 1, "total_value": 100}),
            new Tuple({"pid": 3, "name": "Dave", "height": 1.8, "oid": null, "ordered_by": null, "total_value": null}),
            new Tuple({"pid": 4, "name": "Eve", "height": 1.66, "oid": null, "ordered_by": null, "total_value": null}),
            new Tuple({"pid": null, "name": null, "height": null, "oid": 3, "ordered_by": 2, "total_value": 10}),
            new Tuple({"pid": null, "name": null, "height": null, "oid": 4, "ordered_by": 42, "total_value": 1})
        ]);
        var actual = this.executeOp(op, UTData.persons3, UTData.orders2);
        U.expect(actual, expected, "Full Outer Join");
    };
    
    this.ut_leftSemiJoin = function() {
        var op = new LeftSemiJoin(
            function(t) { return t.get("pid"); },
            function(t) { return t.get("ordered_by")}
        );
        var expected = Factory.createRelationFromTuples("", [
            new Tuple({"pid": 1, "name": "Alice", "height": 1.62}),
            new Tuple({"pid": 1, "name": "Alice", "height": 1.62})
        ]);
        var actual = this.executeOp(op, UTData.persons3, UTData.orders);
        U.expect(actual, expected, "Left Semi Join");
    };
    
    this.ut_rightSemiJoin = function() {
        var op = new RightSemiJoin(
            function(t) { return t.get("ordered_by")},
            function(t) { return t.get("pid"); }
        );
        var expected = Factory.createRelationFromTuples("", [
            new Tuple({"pid": 1, "name": "Alice", "height": 1.62}),
            new Tuple({"pid": 1, "name": "Alice", "height": 1.62})
        ]);
        var actual = this.executeOp(op, UTData.orders, UTData.persons3);
        U.expect(actual, expected, "Right Semi Join");
    };
    
    this.ut_rename = function() {
        var op = new Rename({"name": "firstname"});
        var expected = Factory.createRelationFromTuples("", [
            new Tuple({"pid": 1, "firstname": "Bob", "age": 14}),
            new Tuple({"pid": 2, "firstname": "Alice", "age": 32})
        ]);
        var actual = this.executeOp(op, UTData.persons);
        U.expect(actual, expected, "Renaming");
    };
    
    this.ut_without = function() {
        var op = new Without();
        var expected = Factory.createRelationFromTuples("", [
            new Tuple({"pid": 3, "name": "Dave", "age": 40})
        ]);
        var actual = this.executeOp(op, UTData.persons2, UTData.persons);
        U.expect(actual, expected, "Without");
    };
}

var tests = new TestSuite();
var ks = Object.keys(tests);
for(var i = 0; i < ks.length; i++) {
    var k = ks[i];
    if(k.startsWith("ut_")) {
        console.log(k, tests[k]());
    }
}
