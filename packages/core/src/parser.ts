import * as antlr from "antlr4ng";
import { SqlBaseLexer } from "./generated/official/SqlBaseLexer.js";
import { SqlBaseParser, SingleStatementContext } from "./generated/official/SqlBaseParser.js";

export interface ParseTreeNodeAntlr {
  type: "rule" | "terminal";
  rule?: string;
  text?: string;
  children?: ParseTreeNodeAntlr[];
}
export class AntlrParseError extends Error {
  offendingSymbol: antlr.Token | null;
  line: number;
  column: number;
  msg: string;
  constructor(
    message: string,
    public cause: unknown,
    data: { offendingSymbol: antlr.Token | null; line: number; column: number; msg: string }
  ) {
    super(message);
    this.name = "AntlrParseError";
    this.offendingSymbol = data.offendingSymbol;
    this.line = data.line;
    this.column = data.column;
    this.msg = data.msg;
  }
}

class BailErrorListener extends antlr.BaseErrorListener {
  syntaxError<S extends antlr.Token, T extends antlr.ATNSimulator>(
    recognizer: antlr.Recognizer<T>,
    offendingSymbol: S | null,
    line: number,
    column: number,
    msg: string,
    e: antlr.RecognitionException | null
  ): void {
    throw new AntlrParseError(`Syntax error at ${line}:${column} | ${offendingSymbol?.text ?? "unknown"} - ${msg}`, e, {
      offendingSymbol,
      line,
      column,
      msg,
    });
  }
}

/**
 * Parses an SQL string using the generated Trino/SqlBase ANTLR4 grammar and
 * returns the raw parse tree rooted at the `singleStatement` rule.
 *
 * @param sql - The SQL string to parse.
 * @returns The root {@link SingleStatementContext} parse tree node.
 */
export function parseSqlAntlr(sql: string): SingleStatementContext {
  const inputStream = antlr.CharStream.fromString(sql);
  const lexer = new SqlBaseLexer(inputStream);
  const tokenStream = new antlr.CommonTokenStream(lexer);
  const parser = new SqlBaseParser(tokenStream);
  parser.removeErrorListeners(); // disable default console error logging
  // parser.errorHandler = new antlr.BailErrorStrategy();
  parser.addErrorListener(new BailErrorListener());

  return parser.singleStatement();
}

/**
 * Recursively converts an ANTLR4 parse tree produced by the official Trino
 * grammar into a plain JSON-serializable object.
 *
 * @param node - The root of the ANTLR4 parse tree.
 * @returns A plain {@link ParseTreeNodeAntlr} object.
 */
export function serializeParseTreeAntlr(node: antlr.ParseTree): ParseTreeNodeAntlr {
  if (node instanceof antlr.TerminalNode) {
    return { type: "terminal", text: node.getText() };
  }
  const ctx = node as antlr.ParserRuleContext;
  const ruleName = SqlBaseParser.ruleNames[ctx.ruleIndex] ?? `rule_${ctx.ruleIndex}`;

  return {
    type: "rule",
    rule: ruleName,
    children: ctx.children ? ctx.children.map(serializeParseTreeAntlr) : [],
  };
}
