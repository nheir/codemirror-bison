// CodeMirror, copyright (c) by Henri Derycke
// Distributed under an MIT license

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";


// java mode with @/$ bison variables
var java = Object.assign({}, CodeMirror.resolveMode('text/x-java'));
java.hooks = Object.assign({}, java.hooks)
java.hooks['@'] = function(stream) {
  // Don't match the @interface keyword.
  if (stream.match('interface', false)) return false;

  stream.eatWhile(/[\w\$_]/);
  return "variable-2";
};
java.hooks["$"] = function(stream) {
  stream.eatWhile(/[\w\$_]/);
  return "variable-2";
};

var needClosingBrace = function (context) {
  if (context.type === 'top' || context.prev === undefined) return false;
  if (context.type == '}') return true;
  return needClosingBrace(context.prev);
}

var defineSimpleMode = function (name, states) {
  CodeMirror.defineMode(name, function (config) {
    var mode = CodeMirror.simpleMode(config, states);
    // patch simplemode to quit local mode only when brace are balanced
    var old_token = mode.token;
    mode.token = function (stream, state) {
      if (state.pending || !state.local)
        return old_token(stream, state);

      if (state.local.end && !needClosingBrace(state.localState.context) && stream.match(state.local.end)) {
        var tok = state.local.endToken || null;
        state.local = state.localState = null;
        return tok;
      } else {
        var tok = state.local.mode.token(stream, state.localState)
        return tok;
      }
    }

    return mode;
  });
};

defineSimpleMode("bison", {
  start: [
    {regex: "%{", token: "meta", mode: {spec: 'text/x-java', end: "%}"}, sol: true},
    {regex: "%%", token: "meta", next: "grammar_rules", sol: true },

    {regex: /%(?:[a-zA-Z\\-]+)/, token: "keyword", sol: true},
    {regex: /([a-z][\w]*)/, token: ["variable-2"]},
    {regex: /([A-Z][\w]*)/, token: ["variable-3"]},
    {regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i,
     token: "number"},
    {regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string"},
    {regex: /'(?:[^\\]|\\.)'$/, token: "atom"},
    {regex: "<", mode: {spec: 'text/x-java', end: ">"}},

    {regex: /\/\/.*/, token: "comment"},
    {regex: /\/\*/, token: "comment", push: "comment"},
  ],
  grammar_rules: [
    {regex: "%%", token: "meta", mode: {spec: 'text/x-java'}, next: "epilogue"},
    {regex: /%(?:[a-zA-Z\\-]+)/, token: "keyword"},
    {regex: /([a-z][\w]*)/, token: "variable-2"},
    {regex: /([A-Z][\w]*)/, token: "variable-3"},
    {regex: /\[([A-Z][\w]*)\]/, token: ["variable"]},
    {regex: "{", mode: {spec: java, end: "}"}},
    {regex: ":", indent: true},
    {regex: ";", dedent: true},
    {regex: /\/\/.*/, token: "comment"},
    {regex: /\/\*/, token: "comment", push: "comment"},
  ],
  epilogue: [],
  // The multi-line comment state.
  comment: [
    {regex: /.*?\*\//, token: "comment", pop: true},
    {regex: /.*/, token: "comment"}
  ],
  meta: {
    dontIndentStates: ["comment"],
    lineComment: "//"
  }
});

CodeMirror.defineMIME("text/x-bison", "bison");

defineSimpleMode("jflex", {
  start: [
    {regex: "", mode: {spec: 'text/x-java', end : '%%'}, next: "prologue", token: "meta"},
  ],
  prologue: [
    {regex: "%{", token: "meta", mode: {spec: 'text/x-java', end: "%}"}, sol: true},
    {regex: "%%", token: "meta", next: "lexer_rules", sol: true },

    {regex: /%(?:[a-zA-Z\\-]+)/, token: "keyword", sol: true},
    {regex: /([a-zA-Z][\w]*)\s*=(.*)/, token: ["variable-2"], sol: true},

    {regex: /\/\/.*/, token: "comment"},
    // A next property will cause the mode to move to a different state
    {regex: /\/\*/, token: "comment", push: "comment"},
  ],
  lexer_rules: [
    {regex: /\{([a-zA-Z][\w]*)\}/, token: ["variable-2"], next: "lexer_action"},
    {regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string", next: "lexer_action"},
    {regex: /<([a-zA-Z\\-]+)>/, token: ["variable-3"]},
    {regex: "{", indent: true},
    {regex: "}", dedent: true},
    {regex: /\/\/.*/, token: "comment"},
    {regex: /\/\*/, token: "comment", push: "comment"},
    {regex: /\\./, token: "atom", next: "lexer_action"},
    {regex: /[\[\]?+*|-]/, token: "operator", next: "lexer_action"},
    {regex: /\S/, token: "atom", next: "lexer_action"},
  ],
  lexer_action: [
    {regex: /\s+\{/, mode: {spec: 'text/x-java', end: "}"}, next: "lexer_rules"},
    {regex: "", next: 'lexer_rules'}
  ],
  // The multi-line comment state.
  comment: [
    {regex: /.*?\*\//, token: "comment", pop: true},
    {regex: /.*/, token: "comment"}
  ],
  meta: {
    dontIndentStates: ["comment"],
    lineComment: "//"
  }
});

CodeMirror.defineMIME("text/x-jflex", "jflex");

});
