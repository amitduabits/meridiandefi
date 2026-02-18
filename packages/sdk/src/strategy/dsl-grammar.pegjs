// ---------------------------------------------------------------------------
// Meridian Strategy DSL — PEG grammar (peggy)
//
// Example:
//   strategy "Rebalance Portfolio" v1.0
//   param target_eth = 0.4
//   param drift_threshold = 0.05
//   when portfolio.drift("ETH") > drift_threshold
//     do rebalance("ETH", target_eth)
//   constraints {
//     max_slippage: 0.5%
//     max_gas: 50
//     chains: [arbitrum, ethereum]
//   }
// ---------------------------------------------------------------------------

{{
  // Module-level helpers (available at parse time).
  function buildBinaryExpr(left, op, right) {
    return { type: "binary", operator: op, left, right };
  }

  function buildCallExpr(callee, args) {
    return { type: "call", callee, args };
  }

  function buildMemberExpr(object, property) {
    return { type: "member", object, property };
  }
}}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

Strategy
  = _ header:StrategyHeader _ params:ParamDecl* _ rules:Rule* _ constraints:ConstraintsBlock? _
  {
    return {
      type:        "strategy",
      name:        header.name,
      version:     header.version,
      params:      params,
      rules:       rules,
      constraints: constraints ?? null,
    };
  }

// ---------------------------------------------------------------------------
// Strategy header
// ---------------------------------------------------------------------------

StrategyHeader
  = "strategy" _ name:StringLiteral _ version:Version _
  {
    return { name, version };
  }

Version
  = "v" major:Integer "." minor:Integer ("." patch:Integer)?
  {
    return major + "." + minor;
  }
  / "v" major:Integer
  {
    return major + ".0";
  }

// ---------------------------------------------------------------------------
// Parameter declarations
// ---------------------------------------------------------------------------

ParamDecl
  = "param" _ name:Identifier _ "=" _ value:ParamValue _ EOL? _
  {
    return { type: "param", name, value };
  }

ParamValue
  = v:Number  { return { kind: "number", value: v }; }
  / v:StringLiteral { return { kind: "string", value: v }; }
  / v:BooleanLiteral { return { kind: "boolean", value: v }; }

// ---------------------------------------------------------------------------
// When-Do rules
// ---------------------------------------------------------------------------

Rule
  = "when" _ condition:Expression _ EOL? _
    "do" _ action:ActionExpr _ EOL? _
  {
    return {
      type:      "rule",
      condition,
      action,
      tokens:    collectTokens(condition),
    };
  }

// Collect token identifiers referenced in an expression (best-effort).
{
  function collectTokens(node) {
    if (!node || typeof node !== "object") return [];
    if (node.type === "identifier") return [node.name];
    const results = [];
    for (const key of Object.keys(node)) {
      if (key === "type") continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) results.push(...collectTokens(c));
      } else if (child && typeof child === "object") {
        results.push(...collectTokens(child));
      }
    }
    return [...new Set(results)];
  }
}

// ---------------------------------------------------------------------------
// Action expression  —  rebalance("ETH", 0.4)
// ---------------------------------------------------------------------------

ActionExpr
  = callee:Identifier _ "(" _ args:ArgumentList _ ")"
  {
    return buildCallExpr(callee, args);
  }
  / callee:Identifier
  {
    return buildCallExpr(callee, []);
  }

// ---------------------------------------------------------------------------
// Constraints block
// ---------------------------------------------------------------------------

ConstraintsBlock
  = "constraints" _ "{" _ entries:ConstraintEntry* _ "}"
  {
    const result = {};
    for (const e of entries) {
      result[e.key] = e.value;
    }
    return result;
  }

ConstraintEntry
  = key:ConstraintKey _ ":" _ value:ConstraintValue _ EOL? _
  {
    return { key, value };
  }

ConstraintKey
  = "max_slippage"
  / "max_gas"
  / "chains"
  / "allowed_protocols"
  / "stop_loss"
  / "take_profit"
  / "max_daily_trades"
  / Identifier

ConstraintValue
  = pct:PercentLiteral    { return { kind: "percent", value: pct }; }
  / n:Number              { return { kind: "number",  value: n }; }
  / lst:ListLiteral       { return { kind: "list",    value: lst }; }
  / s:StringLiteral       { return { kind: "string",  value: s }; }

PercentLiteral
  = n:Number "%" { return n / 100; }

ListLiteral
  = "[" _ head:ListItem tail:(_ "," _ item:ListItem { return item; })* _ "]"
  {
    return [head, ...tail];
  }
  / "[" _ "]"
  {
    return [];
  }

ListItem
  = StringLiteral
  / Identifier
  / Number

// ---------------------------------------------------------------------------
// Expressions (with operator precedence via layers)
// ---------------------------------------------------------------------------

Expression
  = Comparison

Comparison
  = left:Additive _ op:ComparisonOp _ right:Additive
  {
    return buildBinaryExpr(left, op, right);
  }
  / Additive

ComparisonOp
  = ">=" { return ">="; }
  / "<=" { return "<="; }
  / "!=" { return "!="; }
  / "==" { return "=="; }
  / ">"  { return ">"; }
  / "<"  { return "<"; }

Additive
  = left:Multiplicative _ op:AdditiveOp _ right:Multiplicative
  {
    return buildBinaryExpr(left, op, right);
  }
  / Multiplicative

AdditiveOp
  = "+" { return "+"; }
  / "-" { return "-"; }

Multiplicative
  = left:Primary _ op:MultiplicativeOp _ right:Primary
  {
    return buildBinaryExpr(left, op, right);
  }
  / Primary

MultiplicativeOp
  = "*" { return "*"; }
  / "/" { return "/"; }

Primary
  = CallOrMember
  / "(" _ expr:Expression _ ")" { return expr; }
  / n:Number   { return { type: "literal", kind: "number",  value: n }; }
  / s:StringLiteral { return { type: "literal", kind: "string",  value: s }; }
  / b:BooleanLiteral { return { type: "literal", kind: "boolean", value: b }; }

// ---------------------------------------------------------------------------
// Call / member access chains  —  portfolio.drift("ETH")
// ---------------------------------------------------------------------------

CallOrMember
  = head:Identifier tail:CallOrMemberTail*
  {
    let node = { type: "identifier", name: head };
    for (const part of tail) {
      if (part.kind === "member") {
        node = buildMemberExpr(node, part.property);
      } else if (part.kind === "call") {
        node = buildCallExpr(node, part.args);
      }
    }
    return node;
  }

CallOrMemberTail
  = "." prop:Identifier { return { kind: "member", property: prop }; }
  / "(" _ args:ArgumentList _ ")" { return { kind: "call", args }; }

ArgumentList
  = head:Expression tail:(_ "," _ expr:Expression { return expr; })*
  {
    return [head, ...tail];
  }
  / { return []; }

// ---------------------------------------------------------------------------
// Terminals
// ---------------------------------------------------------------------------

Identifier
  = $([a-zA-Z_][a-zA-Z0-9_]*)

StringLiteral
  = '"' chars:[^"]* '"'  { return chars.join(""); }
  / "'" chars:[^']* "'"  { return chars.join(""); }

Number
  = n:$([0-9]+ ("." [0-9]+)?)  { return parseFloat(n); }

Integer
  = n:$[0-9]+ { return parseInt(n, 10); }

BooleanLiteral
  = "true"  { return true; }
  / "false" { return false; }

EOL
  = [\r\n]+

_
  = ([ \t\r\n] / Comment)*

Comment
  = "//" [^\r\n]*
  / "/*" (!"*/" .)* "*/"
