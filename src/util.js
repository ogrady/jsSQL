"use strict";

var U = {
    indexOf: function(needle, haystack) {
        var i = 0;
        while(i < haystack.length && !U.equal(needle,haystack[i])) {
            i++;
        }
        return i >= haystack.length ? -1 : i;
    },

    instanceOf: function(val, type) {
        return val.constructor.name === type.name;
    },

    /**
     * Checks the type of a value.
     * 
     * @param {any} val The value to check the type of.
     * @return {array} An array where the first field holds the type and the second field holds a boolean that indicates whether the type is non-scalar.
     */
    getType: function(val) {
        if(val === null) {
            return [null, false];
        }
        var t = typeof val;
        return t === "object" ? [val.constructor.name, true] : [t, false];
    },

    assert: function(condition, message = "") {
        if(!condition) {
           throw "Assertion Error: " + message;
        }
    },

    assertType: function(val, expectedType) {
        U.assert(U.instanceOf(val, expectedType), "Expected type '" + expectedType.name + "', but found '" + val.constructor.name + "'");
    },
    
    expect: function(actual, expected, error, comparator) {
        if(comparator === undefined) {
            comparator = (x,y) => U.equal(x,y);
        }
        var eq = comparator(actual, expected);
        if(!eq) {
            console.log("ACTUAL", actual);
            console.log("EXPECTED", expected);
        }
        U.assert(eq, error);
    },

    equal: function(x, y) {
        var ty = U.getType(x);
        var tx = U.getType(y);
        var eq = tx[0] === ty[0];
        if(eq) {
            if(tx[1]) { 
                if(x.hasOwnProperty("equals")) {
                    eq = x.equals(y)
                } else if(U.instanceOf(x, Array)) {
                    eq = U.arrayEquality(x, y);
                } else if(U.instanceOf(x, Object)) {
                    eq = U.dictEquality(x, y);
                } else {
                    eq = x === y;
                }
            } else {
                eq = x === y;
            }
        }
        return eq;
    },

    arrayEquality: function(a1, a2) {
        U.assert(U.instanceOf(a1, Array));
        U.assert(U.instanceOf(a2, Array));
        var eq = a1.length === a2.length;
        var i = 0;
        while(i < a1.length && eq) {
            eq = U.equal(a1[i], a2[i]);
            i++;
        }
        return eq;
    },

    dictEquality: function(m1, m2) {
        U.assert(U.instanceOf(m1, Object));
        U.assert(U.instanceOf(m2, Object));
        var ks = Object.keys(m1);
        var eq = ks.length === Object.keys(m2).length;
        var i = 0;
        while(i < ks.length && eq) {
            eq = U.equal(m1[ks[i]], m2[ks[i]]);
            i++;
        }
        // we don't need to check all elements in m2, since we assured
        // both keysets have the same length, so one direction is enough.
        return eq;
    },
    
    // taken from: https://stackoverflow.com/a/40120933
    isAlpha: function(ch) {
        return typeof ch === "string" && ch.length === 1
               && (ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z");
    },
    
    isDigit: function(ch) {
        return "0123456789".indexOf(ch) > -1;
    }
};

/**
 * Stable sorting to properly reflect the SQL implementation,
 * graciously provided by https://medium.com/@fsufitch/is-javascript-array-sort-stable-46b90822543f
 */
Array.prototype.stableSort = function(cmp) {
    cmp = !!cmp ? cmp : (a, b) => {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    };
    let stabilizedThis = this.map((el, index) => [el, index]);
    let stableCmp = (a, b) => {
        let order = cmp(a[0], b[0]);
        if (order != 0) return order;
        return a[1] - b[1];
    }
    stabilizedThis.sort(stableCmp);
    for (let i=0; i<this.length; i++) {
        this[i] = stabilizedThis[i][0];
    }
    return this;
};
