"use strict";
const { U } = require("./util.js");

// CONSTANTS

// Note: all binary operators must have the same name as the corresponding
// AST-node. We use the input to lookup the operator name, which we
// use to lookup the constructor name. This saves us a huge switch-case,
// but requires a proper naming schema.
// We are using T._Inverted and RA._LowerCase for that. 
var T = {
    OPARAN : "(",
    CPARAN : ")",
    OCURLY: "{",
    CCURLY: "}",
    QUOTE : "'",
    SELECT : "σ",
    PROJECT : "π",
    UNION : "∪",
    INTERSECTION : "∩",
    WITHOUT : "−",
    CROSSPRODUCT : "✕",
    RENAME : "ρ",
    // DIVISION : "÷",
    JOIN : "⋈",
    LOJOIN : "⟕",
    ROJOIN : "⟖",
    FOJOIN : "⟗",
    LSJOIN : "⋉",
    RSJOIN : "⋊",
    AND : "∧",
    OR : "∨",
    NOT : "¬",
    GT: ">",
    GTE : "≥",
    LT: "<",
    LTE : "≤",
    NEQ : "≠",
    EQ : "≡",
    EXISTS : "∃",
    ALL : "∀",
    DIGITS : [1,2,3,4,5,6,7,8,9,0],
    DIGITS_S : "1234567890",
    MINUS : "-",
    PLUS : "+",
    TIMES : "*",
    DIVIDED_BY : "/",
    PERIOD : ".",
    UNDERSCORE : "_",
};

T.PREFIX_OPERATORS = [T.SELECT, T.PROJECT, T.RENAME, T.MINUS, T.EXISTS, T.ALL],
T.INFIX_OPERATORS = [T.UNION, T.INTERSECTION, T.WITHOUT, T.CROSSPRODUCT, T.JOIN, T.LOJOIN, T.ROJOIN, T.FOJOIN, T.LSJOIN, T.RSJOIN, T.AND, T.OR, T.GT, T.GTE, T.LT, T.LTE, T.NEQ, T.EQ, T.PLUS, T.MINUS, T.TIMES, T.DIVIDED_BY, T.PERIOD]
T._Inverted = Object.keys(T).reduce((acc, el) => {acc[T[el]] = el; return acc; }, {});


// TOKEN CLASSES
//abstract
function Token(value, lineNumber, colNumber) {
    this.value = value;
    this.line = lineNumber;
    this.column = colNumber;
    
    this.equals = function(other) {
        return U.getType(this)[0] === U.getType(other)[0] && U.equal(this.value, other.value);
    }
}

function TIdent(value, lineNumber, colNumber) {
    Token.call(this, value, lineNumber, colNumber);
}

function TString(value, lineNumber, colNumber) {
    Token.call(this, value, lineNumber, colNumber);
}

function TNumber(value, lineNumber, colNumber) {
    Token.call(this, value, lineNumber, colNumber);
}

function TBool(value, lineNumber, colNumber) {
    Token.call(this, value, lineNumber, colNumber);
}

function TSpecial(value, lineNumber, colNumber) {
    Token.call(this, value, lineNumber, colNumber);
}

// AST NODES
// abstract
function ASTNode() {
}

const RA = {
    Node: function() {
        ASTNode.call(this);
    },

    Expression: function() {
        RA.Node.call(this);
    },

    Terminal: function(value) {
        this.value = value;   
    },

    Ident: function(identifier) {
        RA.Terminal.call(this, identifier);
    },

    Number: function(value) {
        RA.Terminal.call(this, value);
    },

    Integer: function(value) {
        RA.Number.call(this, value);
    },

    Float: function(value) {
        RA.Number.call(this, value);
    },

    String: function(value) {
        RA.Terminal.call(this, value);
    },

    Attribute: function(parent, child) {
        RA.Expression.call(this);
        this.parent = parent;
        this.child = child;
    },

    Alias: function(oldName, newName) {
        RA.Expression.call(this);
        this.oldName = oldName; 
        this.newName = newName;
    },

    BinaryOperation: function(left, op, right) {
        RA.Expression.call(this);
        this.left = left;
        this.op = op;
        this.right = right;
    },

    Projection: function(expression, relation) {
        RA.BinaryOperation.call(this, expression, T.PROJECT, relation);
    },

    Selection: function(expression, relation) {
        RA.BinaryOperation.call(this, expression, T.SELECT, relation);
    },

    Rename: function(expression, relation) {
        RA.BinaryOperation.call(this, expression, T.RENAME, relation);
    },

    Union: function(left, right) {
        RA.BinaryOperation.call(this, left, T.UNION, right);   
    },

    Intersection: function(left, right) {
        RA.BinaryOperation.call(this, left, T.INTERSECTION, right);   
    },

    Without: function(left, right) {
        RA.BinaryOperation.call(this, left, T.WITHOUT, right);   
    },

    CrossProduct: function(left, right) {
        RA.BinaryOperation.call(this, left, T.CROSSPRODUCT, right);   
    },

    Join: function(left, right) {
        RA.BinaryOperation.call(this, left, T.JOIN, right);   
    },

    LOJoin: function(left, right) {
        RA.BinaryOperation.call(this, left, T.LOJOIN, right);   
    },

    ROJoin: function(left, right) {
        RA.BinaryOperation.call(this, left, T.ROJOIN, right);   
    },

    LSJoin: function(left, right) {
        RA.BinaryOperation.call(this, left, T.LSJOIN, right);   
    },

    RSJoin: function(left, right) {
        RA.BinaryOperation.call(this, left, T.RSJOIN, right);   
    },

    And: function(left, right) {
        RA.BinaryOperation.call(this, left, T.AND, right);   
    },

    And: function(left, right) {
        RA.BinaryOperation.call(this, left, T.OR, right);   
    },

    NEQ: function(left, right) {
        RA.BinaryOperation.call(this, left, T.NEQ, right);   
    },

    EQ: function(left, right) {
        RA.BinaryOperation.call(this, left, T.EQ, right);   
    },

    Plus: function(left, right) {
        RA.BinaryOperation.call(this, left, T.PLUS, right);   
    },

    Minus: function(left, right) {
        RA.BinaryOperation.call(this, left, T.MINUS, right);   
    },

    Times: function(left, right) {
        RA.BinaryOperation.call(this, left, T.TIMES, right);   
    },

    DividedBy: function(left, right) {
        RA.BinaryOperation.call(this, left, T.DIVIDED_BY, right);   
    },

    Period: function(left, right) {
        RA.BinaryOperation.call(this, left, T.PERIOD, right);   
    }
};
RA._LowerCase = Object.keys(RA).reduce((acc, el) => { acc[el.toLowerCase()] = RA[el]; return acc; }, {});

// abstract
function Lexer() {
    this.lineNumber = 1;
    this.colNumber = 1;

    this.trimLeft = function() {
        let i = 0;
        while(i < this.input.length && this.input[i] === " ") {
            i++;
        }
        this.input = this.input.substring(i);
    };

    this.lex = function(input) {
        this.input = input.trim();
        var tokens = [];
        while(this.input.length > 0) {
            let t = this._lex();
            t.line = this.lineNumber;
            t.column = this.colNumber;
            tokens.push(t);
            this.colNumber += (""+t.value).length;
            if(/^\s*\n/.test(this.input)) {
                this.lineNumber++;
                this.colNumber = 1;
                this.input = this.input.trim();
            }
            let l1 = this.input.length;
            this.trimLeft();
            let l2 = this.input.length;
            this.colNumber += l1-l2; // advance column by trimmed whitespace
        };
        return tokens;
    };
    
    this._lex = function() {
        throw "Not implemented";
    };
    
    this._eatWhile = function(condition) {
        var res = undefined;
        var i = 0;
        while(condition(this.input[i])) {
            i++;
        }
        if(i === 0) {
            res = "";
        } else {
            res = this.input.substring(0,i);
            this.input = this.input.substring(i, this.input.length);
        }
        return res;
    };
    
    this._peek = function(expected) {
        return this.input.length > 0 && this.input[0] === expected;
    };
    
    this._expect = function(expected) {
        var char = this.input[0];
        if(char !== expected) {
            throw "Expected '" + expected + "', but found '" + char + "'";
        }
        this.input = this.input.substring(1);
        return char;
    };
    
    this._lexString = function() {
        this._expect(T.QUOTE);
        var t = this._eatWhile((c => c !== T.QUOTE));
        this._expect(T.QUOTE);
        return t;
    };
    
    this._lexNumber = function() {
        var integer = parseInt(this._eatWhile(c => T.DIGITS_S.indexOf(c) > -1));
        var decimal = 0;
        if(this._peek(T.PERIOD)) {
            this._expect(T.PERIOD);
            decimal = parseInt(this._eatWhile(c => T.DIGITS_S.indexOf(c) > -1));
        }
        return parseFloat("" + integer + "." + decimal);
    };
    
    this._lexIdent = function() {
        // this may look wrong, as it allows identifiers to start with a digit,
        // but lex() should only jump here if the very first character is an underscore
        // or a character!
        U.assert(!U.isDigit(this.input[0]));
        return this._eatWhile(c => U.isAlpha(c) || U.isDigit(c) || c === T.UNDERSCORE);
    };
}

// abstract
function Parser() {
    this._peekType = function(expectedType) {
        return this.input.length > 0 && U.instanceOf(this.input[0], expectedType);
    };

    this._peekValue = function(expectedValue) {
        return this.input.length > 0 && this.input[0].value === expectedValue;
    }

    this._expectType = function(expectedType) {
        if(!this._peekType(expectedType)) {
            throw "Expected value of type '" + expectedType + "', but found '" + typeof t + "'";
        }
        return this.input.shift();
    };

    this._expectValue = function(expectedValue) {
        if(!this._peekValue(expectedValue)) {
            throw "Expected value '" + expectedValue + "', but found '" + t.value + "'";
        }
        return this.input.shift();
    };

    this.parse = function(input) {
        this.input = input;
        return this._parse();
    };

    this._parse = function() {
        throw "Not implemented";
    };
}

function RelationalAlgebraLexer() {
    Lexer.call(this);
    
    this._lex = function() {
        var c = this.input[0];
        var token = undefined;
        if(c === T.UNDERSCORE || U.isAlpha(c)) {
            token = new TIdent(this._lexIdent());
        } else if(c === T.QUOTE) {
            token = new TString(this._lexString());
        } else if(T.DIGITS_S.indexOf(c) > -1) {
            token = new TNumber(this._lexNumber());
        } else {
            var t = this.input[0];
            this._expect(t);
            token = new TSpecial(t);
        }
        return token;
    }
}

function RelationalAlgebraParser() {
    Parser.call(this);

    this._isPrefixOperator = function() {
        return this.input.length > 0 && U.indefOf(this.input[0].value, T.PREFIX_OPERATORS) > -1;
    };

    this._isInfixOperator = function() {
        return this.input.length > 0 && U.indexOf(this.input[0].value, T.INFIX_OPERATORS) > -1;
    };

    this._parse = function() {
        return this._parseExpression();
    };

    this._parseExpression = function() {
        let res = this._parseTerminal();
        if(this._isInfixOperator()) {
            let op = this.input.shift().value;
            let rhs = this._parseExpression();
            let constructor = RA._LowerCase[T._Inverted[op].toLowerCase()];
            if(constructor === undefined) {
                throw "Unknown operator " + op;
            }
            res = new constructor(res, rhs);
        }
        return res;
    };

    this._parsePredicate = function() {
        let ident = new RA.Ident(this._parseIdent());
    };

    this._parseTerminal = function() {
        var res = undefined;
        if(this._peekType(TNumber)) {
            res = this._parseNumber();
        } else if(this._peekValue(T.QUOTE)) {
            res = this._parseString();
        } else if(this._peekType(TIdent)) {
            res = this._parseIdent();    
        } else {
            throw "Expected terminal. But read: " + this.input[0].constructor.name + " with value " + this.input[0].value;
        }
        return res;
    };

    this._parseNumber = function() {
        let nr = this._expectType(TNumber);
        if(this._peekValue(T.PERIOD)) {
            this._expectValue(T.PERIOD);
            let decimal = this._expectType(TNumber);
            res = new RA.Float(nr); // FIXME: append decimal
        } else {
            res = new RA.Integer(nr);
        }
    };

    this._parseString = function() {
        this._expectValue(T.QUOTE);
        res = new RAString(this._expectType(TString));
        this._expectValue(T.QUOTE);
    };

    this._parseIdent = function() {
        let res = new RA.Ident(this._expectType(TIdent).value);
        if(this._peekValue(T.PERIOD)) {
            this._expectValue(T.PERIOD);
            let attr = new RA.Ident(this._expectType(TIdent).value);
            res = new RA.Attribute(res, attr);
        }
        return res;
    };

    this._parseProjection = function() {
        this._expectValue(T.PROJECT);
        this._expectValue(T.OCURLY);
        let exp = this._parsePredicate();
        this._expectValue(T.CCURLY);
        this._expectValue(T.OPARAN);
        let ident = this._parseIdent();
        this._expectValue(T.CPARAN);
        return new RAProjection(exp, ident);
    };
}

module.exports = {
    RelationalAlgebraLexer: RelationalAlgebraLexer,
    RelationalAlgebraParser: RelationalAlgebraParser
};