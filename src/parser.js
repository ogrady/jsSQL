"use strict";

// CONSTANTS
var T = {
    OPARAN : "(",
    CPARAN : ")",
    QUOTE : "'",
    SELECT : "σ",
    PROJECT : "π",
    UNION : "∪",
    INTERSECT : "∩",
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
    GTE : "≥",
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
    UNDERSCORE : "_"
};

// TOKEN CLASSES
//abstract
function Token(value) {
    this.value = value;
    
    this.equals = function(other) {
        return U.getType(this)[0] === U.getType(other)[0] && U.equal(this.value, other.value);
    }
}

function TIdent(value) {
    Token.call(this, value);
}

function TString(value) {
    Token.call(this, value);
}

function TNumber(value) {
    Token.call(this, value);
}

function TBool(value) {
    Token.call(this, value);
}

function TSpecial(value) {
    Token.call(this, value);
}

// abstract
function Lexer() {
    this.lex = function(input) {
        this.input = input.trim();
        var tokens = [];
        while(this.input.length > 0) {
            tokens.push(this._lex());
            this.input = this.input.trim();
        };
        return tokens;
    };
    
    this._lex = function(input) {
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
    this.parse = function(input) {
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
