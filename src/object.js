"use strict";

var NEXT_RID = 0;
var NEXT_TID = 0;

var Factory = {
    createRelationFromTuples: function(name, ts) {
        if(ts.length === 0) {
            throw "createRelationFromTuples not implemented for empty lists of tuples";
        }
        var rel = new Relation(name, ts[0].keys());
        ts.forEach(function(t) { rel.addTuple(t) });
        return rel;
    }
};

function Relation(name = "", schema = []) {
    U.assertType(schema, Array);
    this.id = NEXT_RID++;
    this.name = name;
    this.tuples = [];
    this.schema = schema;
    
    this.matchesSchema = function(t) {
        U.assertType(t, Tuple);
        var ks = t.keys();
        var matches = ks.length == this.schema.length;
        var i = 0;
        while(i < this.schema.length && matches) {
            matches &= U.indexOf(this.schema[i], ks) !== -1;
            i++;
        }
        return matches;
    };

    this.pushTuple = function(t) {
        t.index = this.tuples.length;
        t.addHeritage(this);
        this.tuples.push(t);
    };
    
    this.addTuples = function(ts) {
        ts.forEach(function(t) { this.addTuple(t) }, this);
    };
    
    this.addTuple = function(t) {
        // slow, don't use if possible
        if(!this.matchesSchema(t)) {
            throw "Tuple doesn't match schema. Tuple: " + Object.keys(t.data) + " Schema: " + this.schema ;
        }
        this.pushTuple(t);
    }

    this.createFromRows = function(data) {
        console.log("WARNING", "object.Relation.createFromRows is a deprecated function and should only be used for testing");
        for(var i = 0; i < data.length; i++) {
            this.pushTuple(new Tuple(data[i]));
        }
    };
    
    this._forceTuples = function(ts) {
        console.log("WARNING", "object.Relation._forceTuples is an evil function that bypasses schema checking and should only be used for testing");
        ts.forEach(function(t) { this.pushTuple(t); }, this);
    };
    
    this.createFromColumns = function(data) {
        this.schema = Object.keys(data);
        if(this.schema.length == 0) {
            return;
        }
        var tc = data[this.schema[0]].length;
        // assert all columns of equal length
        for(var i = 0; i < tc; i++) {
            var d = {};
            this.schema.forEach(function(k) { 
                d[k] = data[k][i];
            }, this);
            this.pushTuple(new Tuple(d));
        }
    };
    
    this.schemaDisjunct = function(other) {
        var ts = this.schema;
        var os = other.schema;
        var dj = function(xs, ys) {
            var disjunct = true;
            var i = 0;
            while(i < xs.length && disjunct) {
                disjunct = ys.indexOf(xs[i++]) === -1;
            }
            return disjunct;
        }
        
        return dj(ts,os) && dj(os,ts);
    };
    
    /**
     * Two Relations are equal if their Tuples are the same.
     * That requires the Tuples to be in the same order in both relations!
     * 
     * @param {Relation} other The other Relation to compare this Relation to.
     * @return {booelan} true, if other is equal to this.
     */
    this.equals = function(other) {
        return U.equal(this.tuples, other.tuples);
    };
}

function Tuple(data, heritage = []) {
    U.assertType(data, Object)
    U.assertType(heritage   , Array);
    this.id = NEXT_TID++;
    this.data = data;
    this.index = -1;
    this.hash = undefined;
    this.heritage = heritage;

    this.get = function(key) {
        if(!(key in this.data)) {
            throw "Undefined attribute '" + key + "'";
        }
        return this.data[key];
    };
    
    this.keys = function() {
        return Object.keys(this.data);
    };

    this.addHeritage = function(rel) {
        this.heritage.push(rel);
    }

    /**
     * Two Tuples are equal if their hash is equal and all their data
     * is equal. Keep in mind the restrictions for getHash() (see there).
     * 
     * @param {Tuple} other The Tuple to compare this Tuple to.
     * @return {boolean} true, if other equals to this.
     */
    this.equals = function(other) {
        return this.getHash() === other.getHash() && U.equal(this.data, other.data);
    };

    /**
     * Generates and caches a hash for this tuples.
     * Note that the order of the data is relevant for the hash.
     * So Tuple({x:1, y:2}).getHash() !== Tuple({y:2, x1}) !!
     * 
     * @return {int} The hash for this Tuple.
     */
    this.getHash = function() {
        if(this.hash === undefined) {
            var str = JSON.stringify(this.data);
            var i, chr, len;
            var hash = 0;
            for (i = 0, len = str.length; i < len; i++) {
                chr   = str.charCodeAt(i);
                hash  = ((hash << 5) - hash) + chr;
                hash |= 0; // Convert to 32bit integer
            }
            this.hash = hash;
        }
        return this.hash;
    };
}
