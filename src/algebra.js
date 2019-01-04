"use strict";

/**
* Operations are the most basic type for every Algebraic Operation.
* They have an execute() function, which take on one or more Relations
* (depending on the type of operation) and produces a result, which
* in most cases is another Relation (for an exception see GroupBy).
* When the whole input is processed, all onExecuted callbacks are called
* with the result.
* 
* To produce the result, operations have a Generator, to iterate
* over the input Relation(s) and produce one or more tuples to inspect
* for the operation. Each such tuple is then passed to the apply()
* function, which takes one or more parameters depending on the type
* of operation.
* When one input element is processed, the onApply callbacks are called.
* The form of such a callback is described for each Operator separately.
*
* @param {Generator} gen Generator to generate the elements from.
*/
// abstract
function Operation(gen) {
    this.generator = gen;
    this.onExecuted = [];
    this.onApplied = [];
    /**
    * Initialises the result object in which all
    * the intermediate results of the operation
    * are collected. This is usually some sort of 
    * collection that is specific for the operation.
    *
    * @param {Relation} inp.. All input relations.
    * @return {array|object|other} Container to collect results into.
    */
    this.initResult = function() {
       return [];
    };
    
    /**
     * Gives the implementing class the opportunity
     * to finalize the built result, eg wrapping it
     * in some structure etc.
     * 
     * @param {array|object|other} r The result that was built in this.execute
     * @return {array|object|other} The finalized result. At the very least, it is just the parameter r.
     */
    this.finalizeResult = function(r) {
        return r;
    };
    
    /**
     * Derives the schema for the resulting relation.
     * 
     * @param {object} x.. Relation from which the result is being built.
     *                     Arity of this function is set by the implementing Operator.
     * @param {Relation} inp.. All input relations, as they have to be known in some cases
     *                         to derive the schema of the final result.
     *                          
     */
    this.deriveSchema = function() {
        throw "Not implemented";
    };

    /**
    * Executes the operation on the relation or relations.
    */
    this.execute = function() {
        throw "Not implemented";
    };
    
    /**
     * Hook before execute() is called.
     * 
     * @param {Relation} inp.. Relation(s) on which the Operation is being executed.
     */
    this.beforeExecute = function() {
        
    };

    /**
    * Applies the operation on one element or a tuple of elements.
    */
    this.apply = function() {
        throw "Not implemented";
    };
    
    /**
     * Generates a new name for the resulting relation.
     * 
     * @param {Relation} inp.. Relation(s)
     */
    this.generateResultName = function() {
        return "UNNAMED RELATION";
    };
}

/**
* Unary Operations are Operation that receive exactly one operand.
*/
// abstract
function UnaryOperation() {
    Operation.call(this, new LinearGenerator());

    /**
    * Executes the Unary Operation on the one operand.
    * 
    * @param {relation} r An array of tuples (= relation), where each tuple is a dictionary
    * @return {relation} A new relation that is the result of executing the operator.
                      May have a different structure than the input!
    */
    this.execute = function(rs) {
        this.beforeExecute(rs);
        this.generator.set(rs.tuples);
        var res = this.initResult(rs);
        while(this.generator.hasNext()) {
            this.apply(this.generator.next(), res, rs);
        }
        var fres = this.finalizeResult(res, rs);
        this.onExecuted.map(x => x(fres));
        return fres;
    };
}

/**
 * Binary Operations are Operations that receive two operands.
 */
// abstract
function BinaryOperation() {
    Operation.call(this, new NestedLoopGenerator());

    /**
    * Executes the Binary Operation over the two operands R and S.
    * 
    * @param {array} r An array of tuples (= relation), where each tuple is a dictionary
    * @param {array} s An array of tuples (= relation), where each tuple is a dictionary
    * @return {array} A new relation that is the result of executing the operator.
                      May have a different structure than the input!
    */
    this.execute = function(rs, ss) {
        this.beforeExecute(rs, ss);
        this.generator.set(rs.tuples, ss.tuples);
        var result = this.initResult(rs, ss);
        while(this.generator.hasNext()) {
            var next = this.generator.next();
            this.apply(next[0], next[1], result, rs, ss);
        }
        var fres = this.finalizeResult(result, rs, ss);
        this.onExecuted.map(x => x(fres));
        return fres;
    };
}

// SPECIAL
/**
* Groups tuples by a certain criterion.
* Note that this is a special case, as it doesn't return
* a Relation object, but a map of keys to lists of group-elements!
* 
* onApplied: (key, t) => key being the group to which the tuple was assigned, t being the tuple
*/
function GroupBy(get) {
    /**
    * Groups a relation by whatever attribute is received by the passed function.
    * 
    * @param {function} get A function that takes one tuple from the input relation and determines what group it falls into.
                        This can be as simple as retrieving the value of a specific field, or more complicated like
                        calculating a hash over the whole tuple.
    * @param {object} result The dictionary into which all intermediate results are collected.
                          This will be manipulate by reference, hence no return value.
    */
    UnaryOperation.call(this);

    this.apply = function(t, result) {
        var key = get(t);
        if(!(key in result)) {
            result[key] = [];
        }
        result[key].push(t);
        this.onApplied.map(x => x(key, t));
    };

    this.initResult = function() {
        return {};
    };
}

// UNARY SET OPERATIONS
/**
* Selects several fields from a relation.
* 
* onApplied: (t, pt) => t being the original tuple, pt being the projected tuple
*/
function Projection(fields) {
    UnaryOperation.call(this);

    this.apply = function(t, result) {
        var projected = {}; // FIXME: shave off all fields that don't match
        for(var i = 0; i < fields.length; i++) {
            projected[fields[i]] = t.get(fields[i]);
        }
        var pt = new Tuple(projected);
        result.push(pt);
        this.onApplied.map(x => x(t, pt));
    };
    
    this.finalizeResult = function(r, inp) {
        var fr = new Relation(this.generateResultName(inp), fields);
        fr.addTuples(r);
        return fr;
    };
    
    this.generateResultName = function(inp) {
        return inp.name+"π";
    };
}

/**
 * Renames the fields of a Relation based on the passed mapping,
 * creating a new Relation.
 * 
 * @param {dictionary} mapping Dictionary where the keys are the original field names and each value is a renaming.
 *                             Field names not present in this mapping will just remain the same.
 */
function Rename(mapping) {
    UnaryOperation.call(this);
    
    this.apply = function(t, result) {
        var d = {};
        t.keys().forEach(function(k) {
            if(k in mapping) {
                d[mapping[k]] = t.get(k);
            } else {
                d[k] = t.get(k);
            }
        });
        var rt = new Tuple(d);
        result.push(rt);
        this.onApplied.map(x => x(t, rt));
    };
    
    this.finalizeResult = function(r, inp) {
        var fr = new Relation(this.generateResultName(inp), r[0].keys());
        fr.addTuples(r);
        return fr;
    };
    
    this.generateResultName = function(inp) {
        return inp.name+"ρ";
    };
}

/**
 * Restricts a relation to only tuples that match a predicate.
 * 
 * onApplied: (t, b) => t being the tuple, b being a boolean indicating whether t passed the restriction
 */ 
function Restriction(predicate) {
    UnaryOperation.call(this);

    this.apply = function(t, result) {
        if(predicate.holds(t)) {
            result.push(t);
            this.onApplied.map(x => x(t, true));
        } else {
            this.onApplied.map(x => x(t, false));
        }
    };
    
    this.finalizeResult = function(r, inp) {
        var fr = new Relation(this.generateResultName(inp), inp.schema);
        fr.addTuples(r);
        return fr;
    };
    
    this.generateResultName = function(inp) {
        return inp.name+"σ";
    };
}

/**
 * Creates a distinct Relation.
 * 
 * onApplied: (t,s) => t being the tuple, s being a boolean indicating whether t was added to the result
 */
function Distinct() {
    UnaryOperation.call(this);
    
    this.apply = function(t, result) {
        if(U.indexOf(t, result) == -1) {
            result.push(t);
            this.onApplied.map(x => x(t, true));
        } else {
            this.onApplied.map(x => x(t, false));
        }
    };

    this.finalizeResult = function(r, inp) {
        var fr = new Relation(this.generateResultName(inp), inp.schema);
        fr.addTuples(r);
        return fr;
    };
    
    this.generateResultName = function(inp) {
        return inp.name+"ᵈ";
    };
}

/**
 * Orders a Relation based on a certain attribute.
 * Sort is stable.
 */
function OrderBy(attr) {
    UnaryOperation.call(this);
    
    this.execute = function(rs) {
        var res = this.initResult(rs.tuples);
        var fres = this.finalizeResult(res.stableSort(function(x,y) { 
            var a = x.get(attr);
            var b = y.get(attr);
            if (a < b) return -1;
            if (a > b) return 1;
            return 0; 
        }), rs);
        this.onExecuted.map(x => x(fres));
        return fres;
    }
    
    this.initResult = function(input) {
        var res = [];
        for(var i = 0; i < input.length; i++) {
            res.push(input[i]);
        }
        return res;
    };
    
    this.finalizeResult = function(r, inp) {
        var fr = new Relation(this.generateResultName(inp), inp.schema);
        fr.addTuples(r);
        return fr;
    };
    
    this.generateResultName = function(inp) {
        return inp.name+"↓";
    };
}

// BINARY SET OPERATIONS

/**
* Unifies two relations.
* 
* onApplied: (t,s) => t being the tuple, s being a boolean indicating whether t was added to the result (false, if t is a duplicate)
*/
function Union() {
    BinaryOperation.call(this);

    this.generator = new BiFunnelGenerator();

    this.apply = function(t, _, result) {
        if(!result.has(t)) {
            result.add(t);
            this.onApplied.map(x => x(t, true));
        } else {
            this.onApplied.map(x => x(t, false));
        }
    };

    this.initResult = function() {
        return new Set();
    };
    
    this.finalizeResult = function(r, inp1, inp2) {
        // FIXME: this works if both input relations have a schema that is named the same.
        // But it SHOULD also work for schemas with the same types, eg (x: int, s: string) and (y: int, s: string) should work!
        // This currently isn't the case.
        var fr = new Relation(this.generateResultName(inp1, inp2), inp1.schema);
        fr.addTuples(Array.from(r));
        return fr;
    };
    
    this.generateResultName = function(inp1, inp2) {
        return inp1.name+"∪"+inp2.name;
    };
}

/**
* Intersects two relations.
* 
* onApplied: (t,s) => t being the tuple, s being a boolean indicating whether t was put into the result
*/
function Intersection() {
    // Intersections use regular lists as result type.
    // JavaScript sets make no use of our U.equal() and therefore
    // allows tuples. As the equality check for tuples involves
    // cached hashes, we should be acceptably fast anyway, even with lists.
    BinaryOperation.call(this);

    this.apply = function(a, b, result, as, bs) {
        if(U.indexOf(b, result) == -1 && U.indexOf(b, as.tuples) !== -1) {
            result.push(b);
            this.onApplied.map(x => x(b, true));
        } else {
            this.onApplied.map(x => x(b, false));
        }
        if(U.indexOf(a, result) == -1 && U.indexOf(a, bs.tuples) !== -1) {
            result.push(a);
            this.onApplied.map(x => x(a, true));
        } else {
            this.onApplied.map(x => x(a, false));
        }
    };
    
    this.finalizeResult = function(r, inp1, inp2) {
        var fr = new Relation(this.generateResultName(inp1, inp2), inp1.schema);
        fr.addTuples(r);
        return fr;
    };
    
    this.generateResultName = function(inp1, inp2) {
        return inp1.name+"∪"+inp2.name;
    };
}

/**
 * Produces all tuples from the first relation that don't appear in the second relation.
 * 
 * onApplied: (a,i) => a being each tuple from the left relation, i indicating whether the tuple was included in the result.
 */
function Without() {
    BinaryOperation.call(this);
    
    // LinearGenerator will work miraculously as the second relation will just be ignore in the unary set-function of the Generator.
    // So the Generator will only iterate over the first releation. 
    this.generator = new LinearGenerator();
    this.generator._next = this.generator.next;
    this.generator.next = function() { return [this._next(), undefined] };
    
    this.apply = function(a, b, result, rs, ss) {
        U.assert(b === undefined);
        if(U.indexOf(a, ss.tuples) === -1) {
            result.push(a);
            this.onApplied.map(x => x(a, true));
        } else {
            this.onApplied.map(x => x(a, false));
        }
    };
    
    this.finalizeResult = function(r, inp1, inp2) {
        var fr = new Relation(this.generateResultName(inp1, inp2), inp1.schema);
        fr.addTuples(r);
        return fr;
    };
    
    this.generateResultName = function(inp1, inp2) {
        return inp1.name+"−"+inp2.name;
    };
}

/**
 * Cross Join between two Relations.
 * 
 * onApplied: (a,b,t) => a original first tuple, b original second tuple, t joined tuple
 */
function CrossProduct() {
    BinaryOperation.call(this);
    
    this.apply = function(a, b, result) {
        var t = new Tuple(Object.assign({}, a.data, b.data));
        result.push(t);
        this.onApplied.map(x => x(a,b,t));
    };

    this.finalizeResult = function(r, inp1, inp2) {
        var fr = new Relation(this.generateResultName(inp1, inp2), inp1.schema.concat(inp2.schema));
        fr.addTuples(r);
        return fr;
    };
    
    this.generateResultName = function(inp1, inp2) {
        return inp1.name+"✕"+inp2.name;
    };
}

// JOINS
/**
* Joins two relations into one relation based on equality of attributes in the two passed relations.
* 
* onApplied: (a,b,t) => a original first tuple, b original second tuple, t the joined tuple, false implying a failed join
*/ 
function EquiJoin(getA, getB) {
    /**
    * Joins two relations on a join predicate.
    * 
    * @param {function} getA The getter for the relevant attribute from the first relation.
    * @param {function} getB The getter for the relevant attribute from the second relation.
    * @param {object} result The list into which all intermediate results are collected.
                     This will be manipulate by reference, hence no return value.
    */
    BinaryOperation.call(this);
    
    this.beforeExecute = function(rs, ss) {
        if(!rs.schemaDisjunct(ss)) {
            throw "Can not perform Join on relations with conjunct schemas";
        }
    };

    this.apply = function(a, b, result) {
        if(U.equal(getA(a), getB(b))) {
            var t = new Tuple(Object.assign({}, a.data, b.data));
            result.push(t);
            this.onApplied.map(x => x(a, b, t));
        } else {
            this.onApplied.map(x => x(a, b, false));
        }
    };
    
    this.finalizeResult = function(r, inp1, inp2) {
        var fr = new Relation(this.generateResultName(inp1, inp2), inp1.schema.concat(inp2.schema));
        fr.addTuples(r);
        return fr;
    };
    
    this.generateResultName = function(inp1, inp2) {
        return inp1.name+"⋈"+inp2.name;
    };
}

/**
 * Natural Joins two relations rs and ss on all columns that are
 * named the same in both rr and ss.
 * 
 * onApplied: (a,b,t) => a original first tuple, b original second tuple, t the joined tuple, false implying a failed join
 */
function NaturalJoin() {
    BinaryOperation.call(this);
    
    this.apply = function(a, b, result) {
        var ks = result[1];
        var i = 0;
        var equal = true;
        while(i < ks.length && U.equal(a.get(ks[i]), b.get(ks[i]))) {
            i++;
        }
        if(i >= ks.length) {
            var t = new Tuple(Object.assign({}, a.data, b.data));
            result[0].push(t);
            this.onApplied.map(x => x(a, b, t));
        } else {
            this.onApplied.map(x => x(a, b, false));
        }
    }
    
    /**
     * @return {array} First element being the initialised result array, second being the keys on which to join.
     */
    this.initResult = function(rs, ss) {
        var ks = new Set();
        rs.schema.forEach(function(k) {
            if(U.indexOf(k, ss.schema) > -1) {
                ks.add(k);
            }
        });
        ss.schema.forEach(function(k) {
            if(U.indexOf(k, rs.schema) > -1) {
                ks.add(k);
            }
        });
        return [[], Array.from(ks)];
    };
    
    this.finalizeResult = function(r, inp1, inp2) {
        // FIXME: may not be 100% proper, since duplicate columns are being removed
        var fr = new Relation(this.generateResultName(inp1, inp2), Array.from(new Set(inp1.schema.concat(inp2.schema))));
        fr.addTuples(r[0]);
        return fr;
    };
    
    this.generateResultName = function(inp1, inp2) {
        return inp1.name+"⋈ₙ"+inp2.name;
    };
}

/**
 * Left Join is basically an equi join but amends the final result
 * with all tuples from the left relation that don't have at least
 * one join partner.
 * 
 * onApplied: (a,b,t) => a original first tuple, b original second tuple or FALSE if no join partner was found for a in the second relation, t is the joined tuple
 */
function LeftJoin(getA, getB) {
    BinaryOperation.call(this);
    
    this.beforeExecute = function(rs, ss) {
        if(!rs.schemaDisjunct(ss)) {
            throw "Can not perform Join on relations with conjunct schemas";
        }
        // checklist for left tuples
        this.cl = {};
        rs.tuples.forEach(function(t) {
            this.cl[t.id] = t;
        }, this);
    };
    
    this.apply = function(a, b, result) {
        if(U.equal(getA(a), getB(b))) {
            var t = new Tuple(Object.assign({}, a.data, b.data));
            result.push(t);
            this.cl[a.id] = null;
            this.onApplied.map(x => x(a, b, t));
        } else {
            this.onApplied.map(x => x(a, b, false));
        }
    };
    
    this.finalizeResult = function(r, inp1, inp2) {
        // tuple to join left tuples with if no join partner was found
        var nt = {};
        inp2.schema.forEach(function(key) {
            nt[key] = null;
        }, this);
        
        Object.keys(this.cl).forEach(function(k) {
            var t = this.cl[k];
            if(t !== null) {
                var j = new Tuple(Object.assign({}, t.data, nt));
                r.push(j);
                this.onApplied.map(x => x(t, false, j));
            }
        }, this);
        var fr = new Relation(this.generateResultName(inp1, inp2), Array.from(new Set(inp1.schema.concat(inp2.schema))));
        fr.addTuples(r);
        return fr;
    };
    
    this.generateResultName = function(inp1, inp2) {
        return inp1.name+"⟕"+inp2.name;
    };
}

/**
 * Exactly like LeftJoin, but relations are switched.
 */
function RightJoin(getA, getB) {
    LeftJoin.call(this, getB, getA);
    
    this._execute = this.execute;
    this.execute = function(rs, ss) {
        return this._execute(ss, rs);
    };
    
    this.generateResultName = function(inp1, inp2) {
        return inp1.name+"⟖"+inp2.name;
    };
}

/**
 * Full Outer Join is an equi join on two relations where
 * tuples from both input relations that have not at least one
 * join partner are paired with a null-tuple.
 * 
 * onApplied: (a,b,t) => a original first tuple, b original second tuple, t is the joined tuple. either a or b can be FALSE to signal a "fill up" for the other tuple that has not found any join partner.
 */
function FullOuterJoin(getA, getB) {
    BinaryOperation.call(this);
    
    this.beforeExecute = function(rs, ss) {
        if(!rs.schemaDisjunct(ss)) {
            throw "Can not perform Join on relations with conjunct schemas";
        }
        // checklist for left tuples
        this.lcl = {};
        rs.tuples.forEach(function(t) {
            this.lcl[t.id] = t;
        }, this);
        // checklist for left tuples
        this.rcl = {};
        ss.tuples.forEach(function(t) {
            this.rcl[t.id] = t;
        }, this);
    };
    
    this.apply = function(a, b, result) {
        if(U.equal(getA(a), getB(b))) {
            var t = new Tuple(Object.assign({}, a.data, b.data));
            result.push(t);
            this.lcl[a.id] = null;
            this.rcl[b.id] = null;
            this.onApplied.map(x => x(a, b, t));
        } else {
            this.onApplied.map(x => x(a, b, false));
        }
    };
    
    this.finalizeResult = function(r, inp1, inp2) {
        // tuples to join tuples with if no join partner was found
        var rnt = {};
        inp2.schema.forEach(function(key) {
            rnt[key] = null;
        }, this);
        var lnt = {};
        inp1.schema.forEach(function(key) {
            lnt[key] = null;
        }, this);
        
        Object.keys(this.lcl).forEach(function(k) {
            var t = this.lcl[k];
            if(t !== null) {
                var j = new Tuple(Object.assign({}, t.data, rnt));
                r.push(j);
                this.onApplied.map(x => x(t, false, j));
            }
        }, this);
        Object.keys(this.rcl).forEach(function(k) {
            var t = this.rcl[k];
            if(t !== null) {
                var j = new Tuple(Object.assign({}, lnt, t.data));
                r.push(j);
                this.onApplied.map(x => x(false, t, j));
            }
        }, this);
        
        var fr = new Relation(this.generateResultName(inp1, inp2), Array.from(new Set(inp1.schema.concat(inp2.schema))));
        fr.addTuples(r);
        return fr;
    };
    
    this.generateResultName = function(inp1, inp2) {
        return inp1.name+"⟗"+inp2.name;
    };
}

/**
 * Left Semi Joins are Equi Joins that are projected onto
 * the schema of the left relation afterwards.
 */
function LeftSemiJoin(getA, getB) {
    BinaryOperation.call(this);
    this.join = new EquiJoin(getA, getB);
    
    this.beforeExecute = function(rs, ss) {
        if(!rs.schemaDisjunct(ss)) {
            throw "Can not perform Join on relations with conjunct schemas";
        }
    };
    
    this.execute = function(rs, ss) {
        var joined = this.join.execute(rs, ss);
        var proj = new Projection(rs.schema);
        // rewire hooks from final operation (projection)
        proj.onApplied.push( t => this.onApplied.map(f => f(t)) );
        proj.onExecuted.push( t => this.onExecuted.map(f => f(t)) );
        return proj.execute(joined);
    };
    
    this.finalizeResult = function(r, inp1, inp2) {
        r.name = inp1.name+this.generateResultName()+inp2.name;
        return r;
    };
    
    this.generateResultName = function(inp1, inp2) {
        return inp1.name+"⋉"+inp2.name;
    };
}

/**
 * Exactly like RightSemiJoin, but relations are switched.
 */
function RightSemiJoin(getA, getB) {
    LeftSemiJoin.call(this, getB, getA);
    
    this._execute = this.execute;
    this.execute = function(rs, ss) {
        return this._execute(ss, rs);
    };
    
    this.generateResultName = function(inp1, inp2) {
        return inp1.name+"⋊"+inp2.name;
    };
}

module.exports = {
    Operation: Operation,
    UnaryOperation: UnaryOperation,
    BinaryOperation: BinaryOperation,
    GroupBy: GroupBy,
    Projection: Projection,
    Restriction: Restriction,
    Distinct: Distinct,
    OrderBy: OrderBy,
    Union: Union,
    Intersection: Intersection,
    Without: Without,
    CrossProduct: CrossProduct,
    EquiJoin: EquiJoin,
    NaturalJoin: NaturalJoin,
    LeftJoin: LeftJoin,
    RightJoin: RightJoin,
    FullOuterJoin: FullOuterJoin,
    LeftSemiJoin: LeftSemiJoin,
    RightSemiJoin: RightSemiJoin
};