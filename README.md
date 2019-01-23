# jsSQL
## Purpose
This package evaluates basic operators from relational algebra and SQL.
It serves as a backend for visualisations and other frontend tools.
The generation of single tuples as well as of whole relations can be observed via the classic visitor pattern.

## NPM
jsSQL is built in vanilla javascript on purpose, to have a small set of dependencies and high compatibility with many browsers and versions. It can therefore be used from within a browser as is shown in the `index.html` where all required files are just included as scripts.

But this repository features an NPM package that wraps around the vanilla functionality.

## Known Issues
- The most basic form of logic is an instance of `Predicate`, which in turn holds a lambda `Tuple -> bool`. While this makes sense functionally, it isn't very clean when it comes to parsing queries from an input string, as it would require the usage of `eval` sooner or later. Maybe expressions should be built dynamically as ASTs instead?
