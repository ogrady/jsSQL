"use strict";

/**
* Generators emulate the functionality
* of Mozilla's `function*`.
*/
function Generator() {
    /**
    * Initialises the generator with
    * the relation(s) to iterate over.
    * 
    * @param {arrays} The relations with which to initialise the generator.
    */ 
    this.set = function() {
        throw "Not implemented";
    };

    /**
    * Generates the next element from the relation(s) this generator generates from.
    *
    * @return {varying?} The next element from this generator (can either be scalar or compound).
                         Not being able to produce another element should yield `undefined`.
    */
    this.next = function() {
        throw "Not implemented";
    };

    /**
    * Checks whether the generator has another tuple to produce.
    *
    * @return {bool} True, if the generator can produce another element.
    */
    this.hasNext = function() {
        throw "Not implemented";
    };
}

/**
* Linear generators yield tuples from a list one by one.
* 
* Used by: default for unary operations
*/
function LinearGenerator() {
    Generator.call(this);

    this.set = function(xs) {
        this.xs = xs;
        this.i = 0;
    };
    
    this.next = function() {
        return this.hasNext() ? this.xs[this.i++] : undefined;
    };

    this.hasNext = function() {
        return this.i < this.xs.length;
    };
}

/**
* Funnel generators concat two relations and then return 
* elements linearly.
* 
* Used by: -
*/
function FunnelGenerator() {
    LinearGenerator.call(this);

    this.set = function(xs, ys) {
        this.xs = xs.concat(ys);
        this.i = 0;
    };
}

/**
* BiFunnel generators concat two relations and then return 
* elements linearly, but with an undefined second argument
* to match the signature of BinaryOperations.
* 
* Used by: Union
*/
function BiFunnelGenerator() {
    LinearGenerator.call(this);

    this.set = function(xs, ys) {
        this.xs = xs.concat(ys);
        this.i = 0;
    };
    
    this._next = this.next;
    this.next = function() {
        return [this._next(),undefined];
    };
}

/**
* NestedLoop Generators generate tuples with a nested loop join,
* where each element from the outer relation is produced as a
* tuple with each element from the inner relation.
* 
* Used by: default for binary operations
*/
function NestedLoopGenerator() {
    Generator.call(this);

    this.set = function(xs, ys) {
        this.xs = xs;
        this.ys = ys;
        this.i = 0;
        this.j = 0;
    };

    this.next = function() {
        let res = [this.xs[this.i], this.ys[this.j]];
        this.j = (this.j + 1) % this.ys.length;
        if(this.j == 0) {
            this.i++;
        }
        return res;
    };

    this.hasNext = function() {
        return this.i < this.xs.length && this.j < this.ys.length;
    };
}

module.exports = {
    Generator: Generator, 
    LinearGenerator: LinearGenerator,
    // FunnelGenerator: FunnelGenerator,
    BiFunnelGenerator: BiFunnelGenerator,
    NestedLoopGenerator: NestedLoopGenerator
};