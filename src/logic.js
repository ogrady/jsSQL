"use strict";

function Predicate(p) {
    this.holds = function(t) {
        return p(t);
    };
}

function Not(p) {
    U.assertType(p, Predicate);
    this.holds = function(t) {
        return !p.holds(t);
    };
}

// abstract
function Conjunction(ps, cont) {
    U.assertType(ps, Array);
    U.assert(ps.length > 0);
    
    this.holds = function() {
        throw "Not defined";
    };
}

function And(ps) {
    Conjunction.call(this, ps);
    
    this.holds = function(t) {
        var i = 0;
        var match = true;
        while(i < ps.length && match) {
            match &= ps[i].holds(t);
            i++;
        }
        return match;
    };
}

function Or(ps) {
    Conjunction.call(this, ps);
    
    this.holds = function(t) {
        var i = 0;
        var match = false;
        while(i < ps.length && !match) {
            match |= ps[i].holds(t);
            i++;
        }
        return match;
    };
}
