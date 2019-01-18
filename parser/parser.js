"use strict";
const { U } = require("./util.js");
const Algebra = require("./algebra.js");


const o = require("parser-generator").Operators;
const t = require("./Translator");

// CONSTANTS

// Note: all binary operators must have the same name as the corresponding
// AST-node. We use the input to lookup the operator name, which we
// use to lookup the constructor name. This saves us a huge switch-case,
// but requires a proper naming schema.
// We are using T._Inverted and RA._LowerCase for that. 

var g = {
    OPARAN :       o.token("("),
    CPARAN :       o.token(")"),
    OCURLY:        o.token("{"),
    CCURLY:        o.token("}"),
    OBRACKET:      o.token("["),
    CBRACKET:      o.token("]"),
    QUOTE :        o.token("'"),
    SELECT :       o.token("σ"),
    PROJECT :      o.token("π"),
    UNION :        o.token("∪"),
    INTERSECTION : o.token("∩"),
    WITHOUT :      o.token("\\"),
    CROSSPRODUCT : o.token("×"),
    RENAME :       o.token("ρ"),
    // DIVISION : "÷",
    JOIN :         o.token("⋈"),
    LOJOIN :       o.token("⟕"),
    ROJOIN :       o.token("⟖"),
    FOJOIN :       o.token("⟗"),
    LSJOIN :       o.token("⋉"),
    RSJOIN :       o.token("⋊"),
    AND :          o.token("∧"),
    OR :           o.token("∨"),
    NOT :          o.token("¬"),
    GT:            o.token(">"),
    GTE :          o.token("≥"),
    LT:            o.token("<"),
    LTE :          o.token("≤"),
    NEQ :          o.token("≠"),
    EQ :           o.token("≡"),
    EXISTS :       o.token("∃"),
    ALL :          o.token("∀"),
    MINUS :        o.token("-"),
    PLUS :         o.token("+"),
    TIMES :        o.token("*"),
    DIVIDED_BY :   o.token("/"),
    PERIOD :       o.token("."),
    COMMA:         o.token(","),
    UNDERSCORE :   o.token("_"),
    DIGITS : [1,2,3,4,5,6,7,8,9,0]
};

g.attrName = o.token(/[\w\-\d]+/);
g.attrValue = o.token(/[\w\-\d]+/);
g.attr = o.each(g.attrName, g.PERIOD, g.attrValue);

g.list = o.process(o.between(g.OBRACE, g.attr, g.CBRACE));

T.PREFIX_OPERATORS = [T.SELECT, T.PROJECT, T.RENAME, T.MINUS, T.EXISTS, T.ALL];
T.INFIX_OPERATORS = [T.UNION, T.INTERSECTION, T.WITHOUT, T.CROSSPRODUCT, T.JOIN, T.LOJOIN, T.ROJOIN, T.FOJOIN, T.LSJOIN, T.RSJOIN, T.AND, T.OR, T.GT, T.GTE, T.LT, T.LTE, T.NEQ, T.EQ, T.PLUS, T.MINUS, T.TIMES, T.DIVIDED_BY, T.PERIOD];
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

    Join: function(left, right, on) {
        RA.BinaryOperation.call(this, left, T.JOIN, right, on);   
        this.on = on;
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

    LOJoin: function(left, right, on) {
        RA.Join.call(this, left, T.LOJOIN, right, on);   
    },

    ROJoin: function(left, right, on) {
        RA.Join.call(this, left, T.ROJOIN, right, on);   
    },

    LSJoin: function(left, right, on) {
        RA.Join.call(this, left, T.LSJOIN, right, on);   
    },

    RSJoin: function(left, right) {
        RA.Join.call(this, left, T.RSJOIN, right, on);   
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
        this._expect(T.QUOTE.symbol);
        var t = this._eatWhile((c => c !== T.QUOTE.symbol));
        this._expect(T.QUOTE.symbol);
        return t;
    };
    
    this._lexNumber = function() {
        var integer = parseInt(this._eatWhile(c => c in T.DIGITS));
        var decimal = 0;
        if(this._peek(T.PERIOD.symbol)) {
            this._expect(T.PERIOD.symbol);
            decimal = parseInt(this._eatWhile(c => c in T.DIGITS));
        }
        return parseFloat("" + integer + "." + decimal);
    };
    
    this._lexIdent = function() {
        // this may look wrong, as it allows identifiers to start with a digit,
        // but lex() should only jump here if the very first character is an underscore
        // or a character!
        U.assert(!U.isDigit(this.input[0]));
        return this._eatWhile(c => U.isAlpha(c) || U.isDigit(c) || c === T.UNDERSCORE.symbol);
    };
}

function RelationalAlgebraLexer() {
    Lexer.call(this);
    
    this._lex = function() {
        let c = this.input[0];
        let token = undefined;
        if(c === T.UNDERSCORE.symbol || U.isAlpha(c)) {
            token = new TIdent(this._lexIdent());
        } else if(c === T.QUOTE.symbol) {
            token = new TString(this._lexString());
        } else if(c in T.DIGITS) {
            token = new TNumber(this._lexNumber());
        } else {
            let t = this.input[0];
            this._expect(t);
            token = new TSpecial(t);
        }
        return token;
    }
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
            throw "Expected value of type '" + expectedType + "', but found '" + typeof this.input[0] + "'";
        }
        return this.input.shift();
    };

    this._expectValue = function(expectedValue) {
        if(!this._peekValue(expectedValue)) {
            throw "Expected value '" + expectedValue + "', but found '" + this.input[0].value + "'";
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

function RelationalAlgebraParser() {
    Parser.call(this);

    this._isPrefixOperator = function() {
        return this.input.length > 0 && this.input[0].value in T.PREFIX_OPERATORS;
    };

    this._isInfixOperator = function() {
        return this.input.length > 0 && this.input[0].value in T.INFIX_OPERATORS;
    };

    this._parse = function() {
        return this._parseExpression();
    };

    this._parseExpression = function() {
        let res = this._parseTerminal();
        if(this._isInfixOperator()) {
            let op = this.input.shift().value;
            let subscript = this._peekValue(T.OCURLY.symbol) ? this._parseSubscript() : undefined;
            if(this.input.length === 0) {
                throw "Expected right hand side of infix operator " + op + ", but input ended.";
            }
            let rhs = this._parseExpression();
            let constructor = RA._LowerCase[T._Inverted[op].toLowerCase()];
            if(constructor === undefined) {
                throw "Unknown operator " + op;
            }
            res = new constructor(res, rhs, subscript);
        }
        return res;
    };

    this._parsePredicate = function() {
        let ident = new RA.Ident(this._parseIdent());
    };

    this._parseSubscript = function() {
        this._expectValue(T.OCURLY.symbol);
        let sub = this._parseExpression();
        this._expectValue(T.CCURLY.symbol);
        return sub;
    };

    this._parseTerminal = function() {
        var res = undefined;
        if(this._peekType(TNumber)) {
            res = this._parseNumber();
        } else if(this._peekType(TString)) {
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
        if(this._peekValue(T.PERIOD.symbol)) {
            this._expectValue(T.PERIOD.symbol);
            let decimal = this._expectType(TNumber);
            res = new RA.Float(parseFloat(nr + "." + decimal));
        } else {
            res = new RA.Integer(nr);
        }
    };

    this._parseString = function() {
        this._expectValue(T.QUOTE.symbol);
        res = new RAString(this._expectType(TString));
        this._expectValue(T.QUOTE.symbol);
    };

    this._parseIdent = function() {
        let res = new RA.Ident(this._expectType(TIdent).value);
        if(this._peekValue(T.PERIOD.symbol)) {
            this._expectValue(T.PERIOD.symbol);
            let attr = new RA.Ident(this._expectType(TIdent).value);
            res = new RA.Attribute(res, attr);
        }
        return res;
    };

    this._parseList = function() {
        let els = []
        this._expectValue(T.OBRACKET.symbol)
        while(!this._peekValue(T.CCURLY.symbol)) {
            els.push(new RA.Ident(this._expectType(TIdent)).value)
            if(this._peekValue(T.COMMA.symbol)) {
                this._expectValue(T.COMMA.symbol);
            }
        }
        this._expectValue(T.CBRACKET.symbol);
    }

    // π{name,age}(...)
    // new Projection(["name", "age"])
    this._parseProjection = function() {
        this._expectValue(T.PROJECT.symbol);
        let fields = this._parseList();
        let ident = this._parseIdent();
        this._expectValue(T.CPARAN.symbol);
        return new RAProjection(list, ident);
    };
}

function Visitor() {
    this.visit = function(node) {
        let fname = "visit_" + node.constructor.name;
        (fname in this ? this[fname].bind(this) : this.visit_default)(node);
    };

    this.visit_default = function(node) {
        throw "Visitor not suited for node of type " + node.constructor.name;
    };
}

function RelationalAlgebraEvaluator() {
    Visitor.call(this);

    this.visit_LSJoin = function(join) {
        let lhs = this.visit(join.left);
        let rhs = this.visit(join.right);
        new Algebra.LeftJoin()
    };

    this.visit_Attribute = function(attr) {
        return 1;
    };

    this.visit_Ident = function(attr) {
        return 1;
    };
}

module.exports = {
    RA: {
        Lexer: RelationalAlgebraLexer,
        Parser: RelationalAlgebraParser,
        Evaluator: RelationalAlgebraEvaluator
    }  
};