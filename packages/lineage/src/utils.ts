import { ParserRuleContext } from "antlr4ng";
import {
    IdentifierContext,
    QuotedIdentifierContext,
    BackQuotedIdentifierContext,
    QualifiedNameContext,
    PrimaryExpressionContext,
    ColumnReferenceContext,
    DereferenceContext,
} from "./generated/official/SqlBaseParser.js";

export type NormalizedIdBrand = string & { __brand: "NormalizedId", };

// ════════════════════════════════════════════════════════════════
// Identifier helpers
// ════════════════════════════════════════════════════════════════

/**
 * Extracts the text of an identifier, stripping surrounding quotes
 * and unescaping doubled quote characters.
 */
export function getIdentifierText(ctx: IdentifierContext): string {
    if (ctx instanceof QuotedIdentifierContext) {
        const raw = ctx.getText();
        return raw.slice(1, -1).replace(/""/g, '"');
    }
    if (ctx instanceof BackQuotedIdentifierContext) {
        const raw = ctx.getText();
        return raw.slice(1, -1).replace(/``/g, "`");
    }
    // UnquotedIdentifier / DigitIdentifier
    return ctx.getText();
}

/** Case-insensitive normalisation for identifier comparison. */
export function normalizeId(id: string): NormalizedIdBrand {
    return id.toLowerCase() as NormalizedIdBrand;
}

// ════════════════════════════════════════════════════════════════
// Qualified name / dereference helpers
// ════════════════════════════════════════════════════════════════

/** Extracts dot-separated identifier parts from a QualifiedNameContext. */
export function getQualifiedNameParts(ctx: QualifiedNameContext): string[] {
    return ctx.identifier().map(getIdentifierText);
}

/**
 * Flattens a (possibly nested) DereferenceContext chain into an ordered
 * list of identifier parts.
 *
 * E.g. the tree for `schema.table.column` becomes `["schema", "table", "column"]`.
 */
export function flattenDereference(ctx: DereferenceContext): string[] {
    const parts: string[] = [];

    const fieldName = ctx.identifier();
    if (fieldName) {
        parts.unshift(getIdentifierText(fieldName));
    }

    let base: PrimaryExpressionContext | null = ctx.primaryExpression();
    while (base instanceof DereferenceContext) {
        const baseName = base.identifier();
        if (baseName) {
            parts.unshift(getIdentifierText(baseName));
        }
        base = base.primaryExpression();
    }

    if (base instanceof ColumnReferenceContext) {
        parts.unshift(getIdentifierText(base.identifier()));
    }

    return parts;
}

// ════════════════════════════════════════════════════════════════
// Expression helpers
// ════════════════════════════════════════════════════════════════

/**
 * Attempts to extract a simple column name from an expression tree.
 * Works for bare column refs and the last part of dereference chains.
 * Returns `null` when no simple name can be determined.
 */
export function extractColumnName(ctx: ParserRuleContext): string | null {
    if (ctx instanceof ColumnReferenceContext) {
        return getIdentifierText(ctx.identifier());
    }
    if (ctx instanceof DereferenceContext) {
        const f = ctx.identifier();
        return f ? getIdentifierText(f) : null;
    }
    if (ctx.children) {
        for (const child of ctx.children) {
            if (child instanceof ParserRuleContext) {
                const result = extractColumnName(child);
                if (result) return result;
            }
        }
    }
    return null;
}
