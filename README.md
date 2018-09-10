# Visualiser
## Purpose
This tool evaluates basic operators from relational algebra and SQL.
The generation of single tuples as well as of whole relations can be observed via the classic visitor pattern.


## Known Issues
- The most basic form of logic is an instance of `Predicate`, which in turn holds a lambda `Tuple -> bool`. While this makes sense functionally, it isn't very clean when it comes to parsing queries from an input string, as it would require the usage of `eval` sooner or later. Maybe expressions should be built dynamically as ASTs instead?
