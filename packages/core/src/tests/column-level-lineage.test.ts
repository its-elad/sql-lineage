/**
 * Comprehensive test suite for getColumnLevelLineage (OpenLineage-style output).
 *
 * Mirrors the same structure and edge-case coverage as column-lineage.test.ts,
 * but validates the column-level lineage output shape (per-column inputFields,
 * dataset-level dependencies, inputs/outputs datasets).
 *
 * Key semantic differences from the flat column-lineage output:
 *  - SELECT expressions → per-output-column `inputFields`
 *  - WHERE / JOIN ON / USING / HAVING / GROUP BY / ORDER BY / WINDOW → `dataset`
 *  - CTEs and derived tables are transparent — lineage flows through to base tables
 *  - Unknown tables still appear in `inputs` and `inputFields`
 */
import { describe, expect, test } from "vitest";
import {
  getColumnLevelLineage,
  type ColumnLevelLineageResult,
  type InputField,
  type TableMetadata,
} from "../index.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const NS = "trino://test";

function run(sql: string, meta: TableMetadata[] = [], ns = NS): ColumnLevelLineageResult {
  return getColumnLevelLineage(sql, meta, { defaultNamespace: ns });
}

function fields(r: ColumnLevelLineageResult): Record<string, InputField[]> {
  const f = r.outputs[0]!.facets!.columnLineage!.fields;
  const out: Record<string, InputField[]> = {};
  for (const [k, v] of Object.entries(f)) out[k] = v.inputFields;
  return out;
}

function dataset(r: ColumnLevelLineageResult): InputField[] {
  return r.outputs[0]!.facets!.columnLineage!.dataset;
}

function inputNames(r: ColumnLevelLineageResult): string[] {
  return r.inputs.map((i) => i.name).sort();
}

function fieldNames(r: ColumnLevelLineageResult): string[] {
  return Object.keys(r.outputs[0]!.facets!.columnLineage!.fields).sort();
}

function inp(table: string, field: string): InputField {
  return { namespace: NS, name: table, field };
}

// Shorthand metadata builders
const tbl = (tableName: string, columns: string[], tableSchema?: string): TableMetadata =>
  tableSchema ? { tableName, tableSchema, columns } : { tableName, columns };

/**
 * Asserts that `actual` contains exactly the items in `expected` (order-independent).
 * Stricter than `toContainEqual` (catches extra items), avoids order fragility of `toEqual`.
 */
function expectSetEqual(actual: InputField[], expected: InputField[]): void {
  expect(actual).toHaveLength(expected.length);
  expect(actual).toEqual(expect.arrayContaining(expected));
}

// ─── FIXTURES ────────────────────────────────────────────────────────────────

const USERS = tbl("users", ["id", "name", "email", "status", "department", "salary", "parent_id"]);
const ORDERS = tbl("orders", ["id", "user_id", "amount", "created_at", "status"]);
const PAYMENTS = tbl("payments", ["id", "order_id", "status", "paid_at"]);
const PRODUCTS = tbl("products", ["id", "name", "price", "category_id"]);
const CATEGORIES = tbl("categories", ["id", "name", "parent_id"]);
const ORDER_ITEMS = tbl("order_items", ["id", "order_id", "product_id", "quantity", "price", "discount"]);
const EMPLOYEES = tbl("employees", ["id", "name", "department", "salary", "manager_id", "hire_date"]);
const USER_TAGS = tbl("user_tags", ["user_id", "tag"]);

// ─────────────────────────────────────────────────────────────────────────────
// 1. BASIC SELECT
// ─────────────────────────────────────────────────────────────────────────────
describe("Basic SELECT", () => {
  test("named columns from one table", () => {
    const r = run(`SELECT id, name FROM users`, [USERS]);
    expect(fields(r)).toEqual({
      id: [inp("users", "id")],
      name: [inp("users", "name")],
    });
    expect(dataset(r)).toEqual([]);
    expect(inputNames(r)).toEqual(["users"]);
  });

  describe("Same column name from different tables in different scopes", () => {
    const ONE = tbl("one", ["id"]);
    const TWO = tbl("two", ["id"]);

    test("unqualified column in main and subquery", () => {
      const r = run(`SELECT id, (SELECT max(id) FROM two) as max_id FROM one`, [ONE, TWO]);
      expect(fields(r)["id"]).toEqual([inp("one", "id")]);
      expect(fields(r)["max_id"]).toEqual([inp("two", "id")]);
    });

    test("unqualified column in subquery only", () => {
      const r = run(`SELECT (SELECT max(id) FROM two) as max_id FROM one`, [ONE, TWO]);
      expect(fields(r)["max_id"]).toEqual([inp("two", "id")]);
      expect(inputNames(r)).toEqual(["one", "two"]);
    });

    test("unqualified column in main query only", () => {
      const r = run(`SELECT id FROM one WHERE id > (SELECT max(id) FROM two)`, [ONE, TWO]);
      expect(fields(r)).toEqual({ id: [inp("one", "id")] });
      // subquery in WHERE → dataset level; one.id from the comparison is also dataset-level
      expectSetEqual(dataset(r), [inp("one", "id"), inp("two", "id")]);
    });
  });

  test("all columns listed explicitly", () => {
    const r = run(`SELECT id, name, email, status FROM users`, [USERS]);
    expect(fields(r)).toEqual({
      id: [inp("users", "id")],
      name: [inp("users", "name")],
      email: [inp("users", "email")],
      status: [inp("users", "status")],
    });
    expect(dataset(r)).toEqual([]);
  });

  test("SELECT DISTINCT — same lineage as plain SELECT", () => {
    const r = run(`SELECT DISTINCT id, name FROM users`, [USERS]);
    expect(fields(r)).toEqual({
      id: [inp("users", "id")],
      name: [inp("users", "name")],
    });
  });

  test("column in WHERE clause goes to dataset, not per-column", () => {
    const r = run(`SELECT id FROM users WHERE status = 'active'`, [USERS]);
    expect(fields(r)).toEqual({ id: [inp("users", "id")] });
    expect(dataset(r)).toEqual([inp("users", "status")]);
  });

  test("arithmetic expression — both operands in one output column", () => {
    const r = run(`SELECT price * quantity AS total, discount FROM order_items`, [ORDER_ITEMS]);
    expect(fields(r)).toEqual({
      total: [inp("order_items", "price"), inp("order_items", "quantity")],
      discount: [inp("order_items", "discount")],
    });
    expect(dataset(r)).toEqual([]);
  });

  test("function call — argument columns tracked on output column", () => {
    const r = run(`SELECT UPPER(name) AS up, LENGTH(email) AS len, id FROM users`, [USERS]);
    expect(fields(r)["up"]).toEqual([inp("users", "name")]);
    expect(fields(r)["len"]).toEqual([inp("users", "email")]);
    expect(fields(r)["id"]).toEqual([inp("users", "id")]);
  });

  test("nested function call — argument columns tracked", () => {
    const r = run(`SELECT COALESCE(NULLIF(name, ''), email) AS display FROM users`, [USERS]);
    expect(fields(r)).toEqual({
      display: [inp("users", "name"), inp("users", "email")],
    });
    expect(dataset(r)).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. TABLE & COLUMN ALIASES
// ─────────────────────────────────────────────────────────────────────────────
describe("Aliases", () => {
  test("table alias — unqualified columns", () => {
    const r = run(`SELECT id, name FROM users u`, [USERS]);
    expect(fields(r)).toEqual({
      id: [inp("users", "id")],
      name: [inp("users", "name")],
    });
  });

  test("table alias — qualified columns resolve to source table", () => {
    const r = run(`SELECT u.id, u.name FROM users u WHERE u.status = 'active'`, [USERS]);
    expect(fields(r)).toEqual({
      id: [inp("users", "id")],
      name: [inp("users", "name")],
    });
    expect(dataset(r)).toEqual([inp("users", "status")]);
  });

  test("column alias does NOT create a new column reference", () => {
    const r = run(`SELECT id AS user_id, name AS display_name FROM users`, [USERS]);
    expect(fields(r)).toEqual({
      user_id: [inp("users", "id")],
      display_name: [inp("users", "name")],
    });
  });

  test("mix of qualified and unqualified refs to the same table", () => {
    const r = run(`SELECT u.id, name FROM users u`, [USERS]);
    expect(fields(r)).toEqual({
      id: [inp("users", "id")],
      name: [inp("users", "name")],
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. JOINs
// ─────────────────────────────────────────────────────────────────────────────
describe("JOINs", () => {
  test("INNER JOIN with ON — ON columns are dataset-level", () => {
    const r = run(
      `SELECT u.name, o.amount
       FROM users u
       INNER JOIN orders o ON u.id = o.user_id`,
      [USERS, ORDERS]
    );
    expect(fields(r)).toEqual({
      name: [inp("users", "name")],
      amount: [inp("orders", "amount")],
    });
    expect(dataset(r)).toEqual([inp("users", "id"), inp("orders", "user_id")]);
    expect(inputNames(r)).toEqual(["orders", "users"]);
  });

  test("LEFT JOIN with ON and WHERE", () => {
    const r = run(
      `SELECT u.name, o.amount
       FROM users u
       LEFT JOIN orders o ON u.id = o.user_id
       WHERE u.status = 'active'`,
      [USERS, ORDERS]
    );
    expect(fields(r)).toEqual({
      name: [inp("users", "name")],
      amount: [inp("orders", "amount")],
    });
    expectSetEqual(dataset(r), [
      inp("users", "id"),
      inp("orders", "user_id"),
      inp("users", "status"),
    ]);
  });

  test("RIGHT JOIN with ON", () => {
    const r = run(
      `SELECT u.name, o.amount
       FROM users u
       RIGHT JOIN orders o ON u.id = o.user_id`,
      [USERS, ORDERS]
    );
    expect(fields(r)).toEqual({
      name: [inp("users", "name")],
      amount: [inp("orders", "amount")],
    });
    expect(dataset(r)).toEqual([inp("users", "id"), inp("orders", "user_id")]);
  });

  test("FULL OUTER JOIN with ON", () => {
    const r = run(
      `SELECT u.name, o.amount
       FROM users u
       FULL OUTER JOIN orders o ON u.id = o.user_id`,
      [USERS, ORDERS]
    );
    expect(fields(r)).toEqual({
      name: [inp("users", "name")],
      amount: [inp("orders", "amount")],
    });
    expect(dataset(r)).toEqual([inp("users", "id"), inp("orders", "user_id")]);
  });

  test("CROSS JOIN — no ON condition", () => {
    const r = run(
      `SELECT u.name, p.name AS product_name
       FROM users u
       CROSS JOIN products p`,
      [USERS, PRODUCTS]
    );
    expect(fields(r)).toEqual({
      name: [inp("users", "name")],
      product_name: [inp("products", "name")],
    });
    expect(dataset(r)).toEqual([]);
    expect(inputNames(r)).toEqual(["products", "users"]);
  });

  test("three-way JOIN chain", () => {
    const r = run(
      `SELECT u.name, o.amount, p.status
       FROM users u
       JOIN orders o ON u.id = o.user_id
       JOIN payments p ON o.id = p.order_id`,
      [USERS, ORDERS, PAYMENTS]
    );
    expect(fields(r)).toEqual({
      name: [inp("users", "name")],
      amount: [inp("orders", "amount")],
      status: [inp("payments", "status")],
    });
    expectSetEqual(dataset(r), [
      inp("users", "id"),
      inp("orders", "user_id"),
      inp("orders", "id"),
      inp("payments", "order_id"),
    ]);
    expect(inputNames(r)).toEqual(["orders", "payments", "users"]);
  });

  test("self-join — same table under two aliases", () => {
    const r = run(
      `SELECT a.id, b.name AS manager_name
       FROM users a
       JOIN users b ON a.parent_id = b.id`,
      [USERS]
    );
    expect(fields(r)).toEqual({
      id: [inp("users", "id")],
      manager_name: [inp("users", "name")],
    });
    expectSetEqual(dataset(r), [inp("users", "parent_id"), inp("users", "id")]);
    expect(inputNames(r)).toEqual(["users"]);
  });

  test("JOIN with compound ON condition (AND)", () => {
    const r = run(
      `SELECT o.id, oi.quantity
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id AND o.status = 'paid'`,
      [ORDERS, ORDER_ITEMS]
    );
    expect(fields(r)).toEqual({
      id: [inp("orders", "id")],
      quantity: [inp("order_items", "quantity")],
    });
    expectSetEqual(dataset(r), [
      inp("orders", "id"),
      inp("order_items", "order_id"),
      inp("orders", "status"),
    ]);
  });

  test("four tables joined — columns from all tracked", () => {
    const r = run(
      `SELECT u.name, o.amount, oi.quantity, p.name AS product_name
       FROM users u
       JOIN orders o ON u.id = o.user_id
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id`,
      [USERS, ORDERS, ORDER_ITEMS, PRODUCTS]
    );
    expect(fields(r)).toEqual({
      name: [inp("users", "name")],
      amount: [inp("orders", "amount")],
      quantity: [inp("order_items", "quantity")],
      product_name: [inp("products", "name")],
    });
    expectSetEqual(dataset(r), [
      inp("users", "id"),
      inp("orders", "user_id"),
      inp("orders", "id"),
      inp("order_items", "order_id"),
      inp("order_items", "product_id"),
      inp("products", "id"),
    ]);
    expect(inputNames(r)).toEqual(["order_items", "orders", "products", "users"]);
  });

  test("JOIN USING — columns contribute to dataset-level from both tables", () => {
    const r = run(`SELECT u.name, o.amount FROM users u JOIN orders o USING (id)`, [USERS, ORDERS]);
    expect(fields(r)).toEqual({
      name: [inp("users", "name")],
      amount: [inp("orders", "amount")],
    });
    // USING(id) → dataset-level dependency on both tables' id
    expectSetEqual(dataset(r), [inp("users", "id"), inp("orders", "id")]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. FILTERING — WHERE / GROUP BY / HAVING / ORDER BY
// ─────────────────────────────────────────────────────────────────────────────
describe("Filtering & aggregation", () => {
  test("WHERE with AND / OR", () => {
    const r = run(`SELECT id FROM users WHERE status = 'active' AND (department = 'eng' OR salary > 100000)`, [USERS]);
    expect(fields(r)).toEqual({ id: [inp("users", "id")] });
    expect(dataset(r)).toEqual([inp("users", "status"), inp("users", "department"), inp("users", "salary")]);
  });

  test("WHERE with BETWEEN", () => {
    const r = run(`SELECT id FROM orders WHERE created_at BETWEEN '2023-01-01' AND '2023-12-31'`, [ORDERS]);
    expect(fields(r)).toEqual({ id: [inp("orders", "id")] });
    expect(dataset(r)).toEqual([inp("orders", "created_at")]);
  });

  test("WHERE with LIKE", () => {
    const r = run(`SELECT id FROM users WHERE name LIKE 'A%'`, [USERS]);
    expect(fields(r)).toEqual({ id: [inp("users", "id")] });
    expect(dataset(r)).toEqual([inp("users", "name")]);
  });

  test("WHERE with IN (literal list)", () => {
    const r = run(`SELECT name FROM users WHERE status IN ('active', 'pending')`, [USERS]);
    expect(fields(r)).toEqual({ name: [inp("users", "name")] });
    expect(dataset(r)).toEqual([inp("users", "status")]);
  });

  test("WHERE IS NULL / IS NOT NULL", () => {
    const r = run(`SELECT id FROM users WHERE email IS NOT NULL AND salary IS NULL`, [USERS]);
    expect(fields(r)).toEqual({ id: [inp("users", "id")] });
    expect(dataset(r)).toEqual([inp("users", "email"), inp("users", "salary")]);
  });

  test("GROUP BY — grouped column is dataset-level", () => {
    const r = run(`SELECT user_id, COUNT(*) AS cnt FROM orders GROUP BY user_id`, [ORDERS]);
    expect(fields(r)).toEqual({
      user_id: [inp("orders", "user_id")],
      cnt: [],
    });
    expect(dataset(r)).toEqual([inp("orders", "user_id")]);
  });

  test("GROUP BY multiple columns", () => {
    const r = run(`SELECT user_id, status, SUM(amount) AS total FROM orders GROUP BY user_id, status`, [ORDERS]);
    expect(fields(r)).toEqual({
      user_id: [inp("orders", "user_id")],
      status: [inp("orders", "status")],
      total: [inp("orders", "amount")],
    });
    expect(dataset(r)).toEqual([inp("orders", "user_id"), inp("orders", "status")]);
  });

  test("GROUPING SETS — grouped columns tracked across sets", () => {
    const r = run(
      `SELECT SUM(amount) AS total
       FROM orders
       GROUP BY GROUPING SETS ((user_id), (status), ())`,
      [ORDERS]
    );
    expect(fields(r)).toEqual({ total: [inp("orders", "amount")] });
    expectSetEqual(dataset(r), [inp("orders", "user_id"), inp("orders", "status")]);
  });

  test("ROLLUP — rollup dimensions are dataset-level", () => {
    const r = run(`SELECT SUM(amount) AS total FROM orders GROUP BY ROLLUP (user_id, status)`, [ORDERS]);
    expect(fields(r)).toEqual({ total: [inp("orders", "amount")] });
    expectSetEqual(dataset(r), [inp("orders", "user_id"), inp("orders", "status")]);
  });

  test("CUBE — cube dimensions are dataset-level", () => {
    const r = run(`SELECT SUM(amount) AS total FROM orders GROUP BY CUBE (user_id, status)`, [ORDERS]);
    expect(fields(r)).toEqual({ total: [inp("orders", "amount")] });
    expectSetEqual(dataset(r), [inp("orders", "user_id"), inp("orders", "status")]);
  });

  test("GROUPING(...) operation arguments are per-column inputs", () => {
    const r = run(
      `SELECT GROUPING(o.user_id, o.status) AS g, SUM(o.amount) AS total
       FROM orders o
       GROUP BY CUBE (o.user_id, o.status)`,
      [ORDERS]
    );
    // GROUPING() is a SELECT expression — its args become per-column inputs
    expect(fields(r)).toEqual({
      g: [inp("orders", "user_id"), inp("orders", "status")],
      total: [inp("orders", "amount")],
    });
    expectSetEqual(dataset(r), [inp("orders", "user_id"), inp("orders", "status")]);
  });

  test("HAVING — column in HAVING is dataset-level", () => {
    const r = run(
      `SELECT user_id, SUM(amount) as total
       FROM orders
       GROUP BY user_id
       HAVING SUM(amount) > 500`,
      [ORDERS]
    );
    expect(fields(r)).toEqual({
      user_id: [inp("orders", "user_id")],
      total: [inp("orders", "amount")],
    });
    // GROUP BY contributes user_id, HAVING contributes amount
    expectSetEqual(dataset(r), [inp("orders", "user_id"), inp("orders", "amount")]);
  });

  test("ORDER BY — column in ORDER BY is dataset-level", () => {
    const r = run(`SELECT id, name FROM users ORDER BY name DESC`, [USERS]);
    expect(fields(r)).toEqual({
      id: [inp("users", "id")],
      name: [inp("users", "name")],
    });
    expect(dataset(r)).toEqual([inp("users", "name")]);
  });

  test("ORDER BY column not in SELECT", () => {
    const USERS_CA = tbl("users", ["id", "name", "created_at"]);
    const r = run(`SELECT id FROM users ORDER BY created_at DESC`, [USERS_CA]);
    expect(fields(r)).toEqual({ id: [inp("users", "id")] });
    expect(dataset(r)).toEqual([inp("users", "created_at")]);
  });

  test("ORDER BY ordinal — no extra column tracked", () => {
    const r = run(`SELECT id, name FROM users ORDER BY 1`, [USERS]);
    expect(fields(r)).toEqual({
      id: [inp("users", "id")],
      name: [inp("users", "name")],
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. CASE EXPRESSIONS
// ─────────────────────────────────────────────────────────────────────────────
describe("CASE expressions", () => {
  test("simple CASE WHEN THEN ELSE — all branch columns in one output column", () => {
    const r = run(
      `SELECT CASE WHEN status = 'active' THEN name ELSE email END AS display FROM users`,
      [USERS]
    );
    expect(fields(r)).toEqual({
      display: [inp("users", "status"), inp("users", "name"), inp("users", "email")],
    });
    expect(dataset(r)).toEqual([]);
  });

  test("searched CASE with multiple WHEN branches", () => {
    const r = run(
      `SELECT id,
              CASE
                WHEN salary > 100000 THEN 'senior'
                WHEN salary > 50000 THEN 'mid'
                ELSE 'junior'
              END AS level
       FROM employees`,
      [EMPLOYEES]
    );
    expect(fields(r)["id"]).toEqual([inp("employees", "id")]);
    expect(fields(r)["level"]).toEqual([inp("employees", "salary")]);
  });

  test("CASE in WHERE clause — goes to dataset-level", () => {
    const r = run(`SELECT id FROM users WHERE CASE WHEN department = 'eng' THEN salary ELSE 0 END > 80000`, [USERS]);
    expect(fields(r)).toEqual({ id: [inp("users", "id")] });
    expectSetEqual(dataset(r), [inp("users", "department"), inp("users", "salary")]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. SELECT * EXPANSION
// ─────────────────────────────────────────────────────────────────────────────
describe("Star expansion", () => {
  test("bare * from single table expands to all metadata columns", () => {
    const r = run(`SELECT * FROM users`, [USERS]);
    expect(fieldNames(r)).toEqual(["department", "email", "id", "name", "parent_id", "salary", "status"]);
    expect(fields(r)["id"]).toEqual([inp("users", "id")]);
    expect(fields(r)["salary"]).toEqual([inp("users", "salary")]);
  });

  test("bare * from JOIN expands all columns from all tables", () => {
    const r = run(`SELECT * FROM users u JOIN orders o ON u.id = o.user_id`, [USERS, ORDERS]);
    // All columns from both tables appear. When column names collide (id, status),
    // the second occurrence is disambiguated with a _1 suffix since the output
    // Record<string, ...> requires unique keys.
    for (const col of USERS.columns) {
      expect(fields(r)[col]).toEqual([inp("users", col)]);
    }
    // Orders columns: "id" and "status" collide with users → disambiguated
    const ordersExpected: Record<string, string> = {
      id: "id_1",
      user_id: "user_id",
      amount: "amount",
      created_at: "created_at",
      status: "status_1",
    };
    for (const col of ORDERS.columns) {
      const outputName = ordersExpected[col] ?? col;
      expect(fields(r)[outputName]).toEqual([inp("orders", col)]);
    }
  });

  test("table.* — only that table's columns expanded", () => {
    const r = run(`SELECT u.*, o.amount FROM users u JOIN orders o ON u.id = o.user_id`, [USERS, ORDERS]);
    for (const col of USERS.columns) {
      expect(fields(r)[col]).toEqual([inp("users", col)]);
    }
    expect(fields(r)["amount"]).toEqual([inp("orders", "amount")]);
  });

  test("* with no metadata — star placeholder for unknown table", () => {
    const r = run(`SELECT * FROM unknown_table`);
    expect(fields(r)["*"]).toEqual([inp("unknown_table", "*")]);
  });

  test("table.* where table alias has no metadata columns — star placeholder", () => {
    const r = run(`SELECT u.* FROM unknown_table u`);
    expect(fields(r)["*"]).toEqual([inp("unknown_table", "*")]);
  });

  test("table.* on truly unknown alias (never in FROM) — star placeholder with alias", () => {
    const r = run(`SELECT ghost.* FROM users u`, [USERS]);
    // Unknown prefix treated as unknown reference
    expect(fields(r)["*"]).toEqual([{ namespace: NS, name: "ghost", field: "*" }]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. SUBQUERIES
// ─────────────────────────────────────────────────────────────────────────────
describe("Subqueries", () => {
  test("derived table in FROM — lineage flows through to source table", () => {
    const r = run(
      `SELECT sub.id, sub.name
       FROM (SELECT id, name FROM users WHERE status = 'active') sub`,
      [USERS]
    );
    expect(fields(r)).toEqual({
      id: [inp("users", "id")],
      name: [inp("users", "name")],
    });
    // WHERE inside subquery propagates as dataset-level
    expect(dataset(r)).toEqual([inp("users", "status")]);
    expect(inputNames(r)).toEqual(["users"]);
  });

  test("unnamed derived subquery — unqualified output columns resolve through derived", () => {
    const POKEMON = tbl("pokemon", ["name", "type", "level"]);
    const r = run(
      `SELECT new_name, new_type, level
       FROM (SELECT name AS new_name, type AS new_type, level FROM pokemon)`,
      [POKEMON]
    );
    expect(fields(r)).toEqual({
      new_name: [inp("pokemon", "name")],
      new_type: [inp("pokemon", "type")],
      level: [inp("pokemon", "level")],
    });
    expect(dataset(r)).toEqual([]);
  });

  test("non-correlated subquery in WHERE (IN) — goes to dataset", () => {
    const r = run(
      `SELECT id, name
       FROM users
       WHERE id IN (SELECT user_id FROM orders WHERE amount > 100)`,
      [USERS, ORDERS]
    );
    expect(fields(r)).toEqual({
      id: [inp("users", "id")],
      name: [inp("users", "name")],
    });
    // WHERE clause: users.id IN (...) + inner subquery columns
    expectSetEqual(dataset(r), [
      inp("users", "id"),
      inp("orders", "user_id"),
      inp("orders", "amount"),
    ]);
  });

  test("correlated subquery in WHERE (EXISTS)", () => {
    const r = run(
      `SELECT u.id, u.name
       FROM users u
       WHERE EXISTS (
         SELECT 1 FROM orders o WHERE o.user_id = u.id
       )`,
      [USERS, ORDERS]
    );
    expect(fields(r)).toEqual({
      id: [inp("users", "id")],
      name: [inp("users", "name")],
    });
    expectSetEqual(dataset(r), [inp("orders", "user_id"), inp("users", "id")]);
  });

  test("scalar subquery in SELECT — input fields merge into output column", () => {
    const r = run(
      `SELECT u.id,
              u.name,
              (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count
       FROM users u`,
      [USERS, ORDERS]
    );
    expect(fields(r)).toEqual({
      id: [inp("users", "id")],
      name: [inp("users", "name")],
      order_count: [inp("orders", "user_id"), inp("users", "id")],
    });
    expect(dataset(r)).toEqual([]);
  });

  test("doubly nested subquery — all levels tracked", () => {
    const r = run(
      `SELECT outer_sub.name
       FROM (
         SELECT inner_sub.name
         FROM (
           SELECT name FROM users
         ) inner_sub
       ) outer_sub`,
      [USERS]
    );
    expect(fields(r)).toEqual({ name: [inp("users", "name")] });
    expect(dataset(r)).toEqual([]);
    expect(inputNames(r)).toEqual(["users"]);
  });

  test("derived table with column alias list", () => {
    const r = run(
      `SELECT sub.uid, sub.uname
       FROM (SELECT id, name FROM users) sub (uid, uname)`,
      [USERS]
    );
    expect(fields(r)["uid"]).toEqual([inp("users", "id")]);
    expect(fields(r)["uname"]).toEqual([inp("users", "name")]);
  });

  test("LATERAL subquery in FROM", () => {
    const r = run(
      `SELECT u.id, l.tag
       FROM users u,
       LATERAL (SELECT tag FROM user_tags WHERE user_id = u.id) l`,
      [USERS, USER_TAGS]
    );
    expect(fields(r)).toEqual({
      id: [inp("users", "id")],
      tag: [inp("user_tags", "tag")],
    });
    // LATERAL body's WHERE → dataset-level
    expectSetEqual(dataset(r), [inp("user_tags", "user_id"), inp("users", "id")]);
    expect(inputNames(r)).toEqual(["user_tags", "users"]);
  });

  test("unnamed LATERAL subquery — unqualified output columns resolve", () => {
    const r = run(
      `SELECT u.id, tag
       FROM users u,
            LATERAL (SELECT tag FROM user_tags WHERE user_id = u.id)`,
      [USERS, USER_TAGS]
    );
    expect(fields(r)["id"]).toEqual([inp("users", "id")]);
    expect(fields(r)["tag"]).toEqual([inp("user_tags", "tag")]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. CTEs (WITH)
// ─────────────────────────────────────────────────────────────────────────────
describe("CTEs (WITH)", () => {
  test("simple single CTE — lineage flows through to underlying table", () => {
    const r = run(
      `WITH active_users AS (
         SELECT id, name FROM users WHERE status = 'active'
       )
       SELECT id, name FROM active_users`,
      [USERS]
    );
    expect(fields(r)).toEqual({
      id: [inp("users", "id")],
      name: [inp("users", "name")],
    });
    expect(dataset(r)).toEqual([inp("users", "status")]);
    expect(inputNames(r)).toEqual(["users"]);
  });

  test("multiple independent CTEs", () => {
    const r = run(
      `WITH
        au AS (SELECT id, name FROM users WHERE status = 'active'),
        ro AS (SELECT id, user_id FROM orders WHERE amount > 0)
       SELECT au.name, ro.id
       FROM au
       JOIN ro ON au.id = ro.user_id`,
      [USERS, ORDERS]
    );
    expect(fields(r)).toEqual({
      name: [inp("users", "name")],
      id: [inp("orders", "id")],
    });
    // CTE body WHEREs propagate + JOIN ON au.id = ro.user_id
    expectSetEqual(dataset(r), [
      inp("users", "id"),
      inp("orders", "user_id"),
      inp("users", "status"),
      inp("orders", "amount"),
    ]);
    expect(inputNames(r)).toEqual(["orders", "users"]);
  });

  test("chained CTE — second CTE references first CTE", () => {
    const r = run(
      `WITH
        base AS (SELECT id, name FROM users),
        filtered AS (SELECT id, name FROM base WHERE id > 10)
       SELECT id FROM filtered`,
      [USERS]
    );
    expect(fields(r)["id"]).toEqual([inp("users", "id")]);
    expect(inputNames(r)).toEqual(["users"]);
  });

  test("CTE with explicit column alias list", () => {
    const r = run(
      `WITH summary(uid, total_amount) AS (
         SELECT user_id, SUM(amount) FROM orders GROUP BY user_id
       )
       SELECT uid, total_amount FROM summary`,
      [ORDERS]
    );
    expect(fields(r)["uid"]).toEqual([inp("orders", "user_id")]);
    expect(fields(r)["total_amount"]).toEqual([inp("orders", "amount")]);
  });

  test("CTE used multiple times in the same query", () => {
    const r = run(
      `WITH active AS (SELECT id, name FROM users WHERE status = 'active')
       SELECT a.name AS a_name, b.name AS b_name
       FROM active a
       JOIN active b ON a.id <> b.id`,
      [USERS]
    );
    expect(fields(r)["a_name"]).toEqual([inp("users", "name")]);
    expect(fields(r)["b_name"]).toEqual([inp("users", "name")]);
  });

  test("CTE with JOIN inside body", () => {
    const r = run(
      `WITH rich_users AS (
         SELECT u.id, u.name, SUM(o.amount) as total
         FROM users u
         JOIN orders o ON u.id = o.user_id
         GROUP BY u.id, u.name
       )
       SELECT id, name, total FROM rich_users WHERE total > 1000`,
      [USERS, ORDERS]
    );
    expect(fields(r)["id"]).toEqual([inp("users", "id")]);
    expect(fields(r)["name"]).toEqual([inp("users", "name")]);
    expect(fields(r)["total"]).toEqual([inp("orders", "amount")]);
    expect(inputNames(r)).toEqual(["orders", "users"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. SET OPERATIONS (UNION / INTERSECT / EXCEPT)
// ─────────────────────────────────────────────────────────────────────────────
describe("Set operations", () => {
  test("UNION — both sides merge positionally into output columns", () => {
    const r = run(
      `SELECT id, name FROM users
       UNION
       SELECT id, name FROM employees`,
      [USERS, EMPLOYEES]
    );
    expect(fields(r)).toEqual({
      id: [inp("users", "id"), inp("employees", "id")],
      name: [inp("users", "name"), inp("employees", "name")],
    });
    expect(dataset(r)).toEqual([]);
    expect(inputNames(r)).toEqual(["employees", "users"]);
  });

  test("UNION ALL — same as UNION for lineage purposes", () => {
    const r = run(
      `SELECT id, name FROM users
       UNION ALL
       SELECT id, name FROM employees`,
      [USERS, EMPLOYEES]
    );
    expect(fields(r)).toEqual({
      id: [inp("users", "id"), inp("employees", "id")],
      name: [inp("users", "name"), inp("employees", "name")],
    });
    expect(dataset(r)).toEqual([]);
  });

  test("INTERSECT", () => {
    const r = run(
      `SELECT id FROM users WHERE status = 'active'
       INTERSECT
       SELECT user_id FROM orders`,
      [USERS, ORDERS]
    );
    expect(fields(r)).toEqual({
      id: [inp("users", "id"), inp("orders", "user_id")],
    });
    // WHERE → dataset
    expect(dataset(r)).toEqual([inp("users", "status")]);
  });

  test("EXCEPT", () => {
    const r = run(
      `SELECT id FROM users
       EXCEPT
       SELECT user_id FROM orders`,
      [USERS, ORDERS]
    );
    expect(fields(r)).toEqual({
      id: [inp("users", "id"), inp("orders", "user_id")],
    });
    expect(dataset(r)).toEqual([]);
  });

  test("three-way UNION — all three sides tracked", () => {
    const r = run(
      `SELECT id, name FROM users
       UNION
       SELECT id, name FROM employees
       UNION
       SELECT id, name FROM categories`,
      [USERS, EMPLOYEES, CATEGORIES]
    );
    expectSetEqual(fields(r)["id"]!, [
      inp("users", "id"),
      inp("employees", "id"),
      inp("categories", "id"),
    ]);
    expectSetEqual(fields(r)["name"]!, [
      inp("users", "name"),
      inp("employees", "name"),
      inp("categories", "name"),
    ]);
    expect(dataset(r)).toEqual([]);
  });

  test("UNION with WHERE on one side", () => {
    const r = run(
      `SELECT id, name FROM users WHERE status = 'active'
       UNION ALL
       SELECT id, name FROM employees WHERE department = 'eng'`,
      [USERS, EMPLOYEES]
    );
    expect(fields(r)).toEqual({
      id: [inp("users", "id"), inp("employees", "id")],
      name: [inp("users", "name"), inp("employees", "name")],
    });
    expectSetEqual(dataset(r), [inp("users", "status"), inp("employees", "department")]);
  });

  test("CTE + UNION combination", () => {
    const r = run(
      `WITH base AS (SELECT id, name FROM users WHERE status = 'active')
       SELECT id, name FROM base
       UNION ALL
       SELECT id, name FROM employees`,
      [USERS, EMPLOYEES]
    );
    expect(fields(r)).toEqual({
      id: [inp("users", "id"), inp("employees", "id")],
      name: [inp("users", "name"), inp("employees", "name")],
    });
    expect(dataset(r)).toEqual([inp("users", "status")]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. WINDOW FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
describe("Window functions", () => {
  test("ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)", () => {
    const r = run(
      `SELECT id, name, ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary) AS rn
       FROM employees`,
      [EMPLOYEES]
    );
    expect(fields(r)).toEqual({
      id: [inp("employees", "id")],
      name: [inp("employees", "name")],
      rn: [inp("employees", "department"), inp("employees", "salary")],
    });
    expect(dataset(r)).toEqual([]);
  });

  test("aggregate window function SUM OVER", () => {
    const r = run(
      `SELECT id, amount, SUM(amount) OVER (PARTITION BY user_id ORDER BY created_at) AS running_total
       FROM orders`,
      [ORDERS]
    );
    expect(fields(r)).toEqual({
      id: [inp("orders", "id")],
      amount: [inp("orders", "amount")],
      running_total: [inp("orders", "amount"), inp("orders", "user_id"), inp("orders", "created_at")],
    });
    expect(dataset(r)).toEqual([]);
  });

  test("window frame RANGE BETWEEN — frame clause columns tracked", () => {
    const r = run(
      `SELECT id, amount,
              SUM(amount) OVER (
                ORDER BY amount
                RANGE BETWEEN 10 PRECEDING AND CURRENT ROW
              ) AS ranged_total
       FROM orders`,
      [ORDERS]
    );
    expect(fields(r)["ranged_total"]).toEqual([inp("orders", "amount")]);
  });

  test("window frame GROUPS BETWEEN — frame clause columns tracked", () => {
    const r = run(
      `SELECT id, amount,
              SUM(amount) OVER (
                ORDER BY created_at
                GROUPS BETWEEN 1 PRECEDING AND 1 FOLLOWING
              ) AS grouped_total
       FROM orders`,
      [ORDERS]
    );
    expect(fields(r)["grouped_total"]).toEqual([inp("orders", "amount"), inp("orders", "created_at")]);
  });

  test("window frame bound expression can reference a column", () => {
    const r = run(
      `SELECT id, quantity,
              SUM(price) OVER (
                ORDER BY id
                ROWS BETWEEN quantity PRECEDING AND CURRENT ROW
              ) AS moving_total
       FROM order_items`,
      [ORDER_ITEMS]
    );
    expect(fields(r)["moving_total"]).toEqual([
      inp("order_items", "price"),
      inp("order_items", "id"),
      inp("order_items", "quantity"),
    ]);
  });

  test("multiple window functions with different OVER clauses", () => {
    const r = run(
      `SELECT
         id,
         salary,
         ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn,
         RANK() OVER (ORDER BY hire_date) AS hire_rank
       FROM employees`,
      [EMPLOYEES]
    );
    expect(fields(r)).toEqual({
      id: [inp("employees", "id")],
      salary: [inp("employees", "salary")],
      rn: [inp("employees", "department"), inp("employees", "salary")],
      hire_rank: [inp("employees", "hire_date")],
    });
    expect(dataset(r)).toEqual([]);
  });

  test("LAG / LEAD — referenced columns tracked", () => {
    const r = run(
      `SELECT id, amount, LAG(amount, 1) OVER (PARTITION BY user_id ORDER BY created_at) AS prev_amount
       FROM orders`,
      [ORDERS]
    );
    expect(fields(r)).toEqual({
      id: [inp("orders", "id")],
      amount: [inp("orders", "amount")],
      prev_amount: [inp("orders", "amount"), inp("orders", "user_id"), inp("orders", "created_at")],
    });
    expect(dataset(r)).toEqual([]);
  });

  test("named WINDOW clause — refs go to dataset-level", () => {
    const r = run(
      `SELECT
         id,
         salary,
         SUM(salary) OVER w AS dept_total
       FROM employees
       WINDOW w AS (PARTITION BY department ORDER BY hire_date)`,
      [EMPLOYEES]
    );
    expect(fields(r)["id"]).toEqual([inp("employees", "id")]);
    expect(fields(r)["salary"]).toEqual([inp("employees", "salary")]);
    expect(fields(r)["dept_total"]).toEqual([inp("employees", "salary")]);
    // Named window definition → dataset-level
    expectSetEqual(dataset(r), [inp("employees", "department"), inp("employees", "hire_date")]);
  });

  test("window function inside CTE", () => {
    const r = run(
      `WITH ranked AS (
         SELECT id, name, salary,
                RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank
         FROM employees
       )
       SELECT id, name FROM ranked WHERE dept_rank = 1`,
      [EMPLOYEES]
    );
    expect(fields(r)["id"]).toEqual([inp("employees", "id")]);
    expect(fields(r)["name"]).toEqual([inp("employees", "name")]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. SCHEMA-QUALIFIED & IDENTIFIER HANDLING
// ─────────────────────────────────────────────────────────────────────────────
describe("Identifier handling", () => {
  test("schema-qualified table — display name includes schema", () => {
    const r = run(`SELECT id, name FROM myschema.users`, [tbl("users", ["id", "name", "email"], "myschema")]);
    expect(fields(r)["id"]).toEqual([inp("myschema.users", "id")]);
    expect(fields(r)["name"]).toEqual([inp("myschema.users", "name")]);
    expect(inputNames(r)).toEqual(["myschema.users"]);
  });

  test("schema-qualified table with alias", () => {
    const r = run(`SELECT u.id, u.email FROM myschema.users u`, [tbl("users", ["id", "name", "email"], "myschema")]);
    expect(fields(r)["id"]).toEqual([inp("myschema.users", "id")]);
    expect(fields(r)["email"]).toEqual([inp("myschema.users", "email")]);
  });

  test("case-insensitive: SQL in UPPER, metadata in lower", () => {
    const r = run(`SELECT ID, NAME FROM USERS`, [USERS]);
    expect(fields(r)["ID"]).toEqual([inp("users", "id")]);
    expect(fields(r)["NAME"]).toEqual([inp("users", "name")]);
  });

  test("case-insensitive: SQL in lower, metadata in UPPER (mixed casing in metadata)", () => {
    const r = run(`SELECT id, name FROM users`, [tbl("users", ["ID", "Name", "Email"])]);
    expect(fields(r)["id"]).toEqual([inp("users", "ID")]);
    expect(fields(r)["name"]).toEqual([inp("users", "Name")]);
  });

  test('double-quoted identifier — "First Name" with space', () => {
    const r = run(`SELECT "id", "First Name" FROM users`, [tbl("users", ["id", "First Name"])]);
    expect(fields(r)["id"]).toEqual([inp("users", "id")]);
    expect(fields(r)["First Name"]).toEqual([inp("users", "First Name")]);
  });

  test("double-quoted identifier containing escaped double quote", () => {
    const r = run(`SELECT "say ""hello""" FROM users`, [tbl("users", ['say "hello"'])]);
    expect(fields(r)['say "hello"']).toEqual([inp("users", 'say "hello"')]);
  });

  test("column reference using table name (not alias) still resolves", () => {
    const r = run(`SELECT users.id, users.name FROM users`, [USERS]);
    expect(fields(r)["id"]).toEqual([inp("users", "id")]);
    expect(fields(r)["name"]).toEqual([inp("users", "name")]);
  });

  test("quoted table name containing slash resolves", () => {
    const r = run(`SELECT id, name FROM "events/live"`, [tbl("events/live", ["id", "name", "ts"])]);
    expect(fields(r)["id"]).toEqual([inp("events/live", "id")]);
    expect(fields(r)["name"]).toEqual([inp("events/live", "name")]);
  });

  test("quoted table name containing slash with alias resolves", () => {
    const r = run(`SELECT e.id, e.ts FROM "events/live" e`, [tbl("events/live", ["id", "name", "ts"])]);
    expect(fields(r)["id"]).toEqual([inp("events/live", "id")]);
    expect(fields(r)["ts"]).toEqual([inp("events/live", "ts")]);
  });

  test("schema-qualified quoted table name containing slash resolves", () => {
    const r = run(`SELECT t.id FROM myschema."events/live" t`, [tbl("events/live", ["id", "payload"], "myschema")]);
    expect(fields(r)["id"]).toEqual([inp("myschema.events/live", "id")]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. UNRESOLVED COLUMNS / UNKNOWN TABLES
// ─────────────────────────────────────────────────────────────────────────────
describe("Unresolved columns", () => {
  test("no metadata at all — unknown table in inputs, bare columns pragmatically attributed", () => {
    const r = run(`SELECT id, name FROM users`);
    // Unknown table is registered as an input
    expect(inputNames(r)).toEqual(["users"]);
    // Per-column: when there's only one table in scope and no metadata to contradict,
    // bare columns are pragmatically attributed to that table (synthetic InputField).
    expect(fields(r)["id"]).toEqual([inp("users", "id")]);
    expect(fields(r)["name"]).toEqual([inp("users", "name")]);
  });

  test("column not in metadata — still attributed to known table", () => {
    const r = run(`SELECT id, unknown_col FROM users`, [tbl("users", ["id", "name"])]);
    expect(fields(r)["id"]).toEqual([inp("users", "id")]);
    // unknown_col resolves nowhere but unqualified — drops from column output
    // (no table to attribute it to confidently)
    expect(fields(r)["unknown_col"]!.length).toBe(0);
  });

  test("qualified ref to unknown table alias — no inputs produced", () => {
    const r = run(`SELECT x.foo FROM users u`, [USERS]);
    // x is not in scope — drops silently (no table to route to)
    expect(fields(r)["foo"]!.length).toBe(0);
  });

  test("qualified column with known table but unknown column — still attributed", () => {
    const r = run(`SELECT u.ghost_column FROM users u`, [USERS]);
    // Column not in metadata → synthesized entry pointing at the table
    expect(fields(r)["ghost_column"]).toEqual([inp("users", "ghost_column")]);
  });

  test("mixed: some columns resolve, some do not", () => {
    const r = run(`SELECT id, name, mystery FROM users`, [tbl("users", ["id", "name"])]);
    expect(fields(r)["id"]).toEqual([inp("users", "id")]);
    expect(fields(r)["name"]).toEqual([inp("users", "name")]);
    // mystery is unresolvable — empty inputs
    expect(fields(r)["mystery"]!.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. STRUCT FIELD ACCESS
// ─────────────────────────────────────────────────────────────────────────────
describe("Struct field access", () => {
  const USERS_STRUCT = tbl("users", ["id", "name", "profile"]);

  test("column.field — bare column with one struct field: records the column", () => {
    const r = run(`SELECT profile.age FROM users`, [USERS_STRUCT]);
    expect(fields(r)["age"]).toEqual([inp("users", "profile")]);
  });

  test("column.field.field — bare column with nested struct field: records the column", () => {
    const r = run(`SELECT profile.address.street FROM users`, [USERS_STRUCT]);
    expect(fields(r)["street"]).toEqual([inp("users", "profile")]);
  });

  test("table.column.field — alias-qualified struct field: records the column on the table", () => {
    const r = run(`SELECT u.profile.age FROM users u`, [USERS_STRUCT]);
    expect(fields(r)["age"]).toEqual([inp("users", "profile")]);
  });

  test("table.column.field.field — alias-qualified nested struct field: records the column", () => {
    const r = run(`SELECT u.profile.address.street FROM users u`, [USERS_STRUCT]);
    expect(fields(r)["street"]).toEqual([inp("users", "profile")]);
  });

  test("schema.table.column.field — fully-qualified struct field: records the column", () => {
    const SCHEMA_USERS = tbl("users", ["id", "name", "profile"], "myschema");
    const r = run(`SELECT myschema.users.profile.age FROM myschema.users`, [SCHEMA_USERS]);
    expect(fields(r)["age"]).toEqual([inp("myschema.users", "profile")]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. SAME-NAME COLUMNS FROM MULTIPLE TABLES
// ─────────────────────────────────────────────────────────────────────────────
describe("Same-name columns from multiple tables", () => {
  test("qualified same-name column from each table tracked independently", () => {
    const r = run(`SELECT u.id, o.id AS order_id FROM users u JOIN orders o ON u.id = o.user_id`, [USERS, ORDERS]);
    expect(fields(r)["id"]).toEqual([inp("users", "id")]);
    expect(fields(r)["order_id"]).toEqual([inp("orders", "id")]);
  });

  test("qualified same-name 'status' from both tables tracked independently", () => {
    const r = run(
      `SELECT u.status AS user_status, o.status AS order_status
       FROM users u
       JOIN orders o ON u.id = o.user_id`,
      [USERS, ORDERS]
    );
    expect(fields(r)["user_status"]).toEqual([inp("users", "status")]);
    expect(fields(r)["order_status"]).toEqual([inp("orders", "status")]);
  });

  test("qualified same-name column across three tables", () => {
    const r = run(
      `SELECT u.id AS uid, o.id AS oid, p.id AS pid
       FROM users u
       JOIN orders o ON u.id = o.user_id
       JOIN payments p ON o.id = p.order_id`,
      [USERS, ORDERS, PAYMENTS]
    );
    expect(fields(r)["uid"]).toEqual([inp("users", "id")]);
    expect(fields(r)["oid"]).toEqual([inp("orders", "id")]);
    expect(fields(r)["pid"]).toEqual([inp("payments", "id")]);
  });

  // Unqualified ambiguous references — Trino rejects these; we drop them.
  test("unqualified ambiguous 'id' — no inputs (Trino ambiguity)", () => {
    const r = run(`SELECT id FROM users u JOIN orders o ON u.id = o.user_id`, [USERS, ORDERS]);
    // ambiguous → empty inputs for the output column
    expect(fields(r)["id"]!.length).toBe(0);
    expect(r.unresolvedTableColumns).toContainEqual({ column: "id" });
  });

  test("unqualified ambiguous 'status' in SELECT — empty", () => {
    const r = run(`SELECT status FROM users u JOIN orders o ON u.id = o.user_id`, [USERS, ORDERS]);
    expect(fields(r)["status"]!.length).toBe(0);
    expect(r.unresolvedTableColumns).toContainEqual({ column: "status" });
  });

  test("unqualified ambiguous 'id' in WHERE — still tracked in dataset", () => {
    const r = run(`SELECT u.name, o.amount FROM users u JOIN orders o ON u.id = o.user_id WHERE id > 5`, [
      USERS,
      ORDERS,
    ]);
    // WHERE ambiguous ref → drops (no contribution to dataset for ambiguous)
    // But JOIN ON still contributes
    expectSetEqual(dataset(r), [inp("users", "id"), inp("orders", "user_id")]);
  });

  test("completely unknown bare column — recorded in unresolvedTableColumns", () => {
    const r = run(`SELECT nonexistent FROM users u`, [USERS]);
    expect(fields(r)["nonexistent"]!.length).toBe(0);
    expect(r.unresolvedTableColumns).toContainEqual({ column: "nonexistent" });
  });

  // Unqualified unambiguous references
  test("unqualified 'user_id' is unique to orders — resolves correctly", () => {
    const r = run(`SELECT user_id FROM users u JOIN orders o ON u.id = o.user_id`, [USERS, ORDERS]);
    expect(fields(r)["user_id"]).toEqual([inp("orders", "user_id")]);
  });

  test("unqualified column unique to second table — resolves correctly", () => {
    const r = run(`SELECT amount FROM users u JOIN orders o ON u.id = o.user_id`, [USERS, ORDERS]);
    expect(fields(r)["amount"]).toEqual([inp("orders", "amount")]);
  });

  test("mix of ambiguous and unambiguous unqualified columns", () => {
    const r = run(`SELECT name, amount FROM users u JOIN orders o ON u.id = o.user_id`, [USERS, ORDERS]);
    expect(fields(r)["name"]).toEqual([inp("users", "name")]);
    expect(fields(r)["amount"]).toEqual([inp("orders", "amount")]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. COMPLEX / REALISTIC QUERIES
// ─────────────────────────────────────────────────────────────────────────────
describe("Complex realistic queries", () => {
  test("dashboard summary: CTE + JOIN + window + GROUP BY", () => {
    const r = run(
      `WITH monthly_sales AS (
         SELECT
           o.user_id,
           DATE_TRUNC('month', o.created_at) AS month,
           SUM(oi.price * oi.quantity)       AS revenue
         FROM orders o
         JOIN order_items oi ON o.id = oi.order_id
         GROUP BY o.user_id, DATE_TRUNC('month', o.created_at)
       )
       SELECT
         ms.user_id,
         ms.month,
         ms.revenue,
         SUM(ms.revenue) OVER (PARTITION BY ms.user_id ORDER BY ms.month) AS cumulative
       FROM monthly_sales ms
       ORDER BY ms.user_id, ms.month`,
      [USERS, ORDERS, ORDER_ITEMS]
    );
    expect(fields(r)["user_id"]).toEqual([inp("orders", "user_id")]);
    expect(fields(r)["month"]).toEqual([inp("orders", "created_at")]);
    expect(fields(r)["revenue"]).toEqual(expect.arrayContaining([
      inp("order_items", "price"),
      inp("order_items", "quantity"),
    ]));
    expect(inputNames(r)).toEqual(["order_items", "orders"]);
  });

  test("user cohort analysis: multiple CTEs chained with set operation", () => {
    const r = run(
      `WITH
         new_users AS (
           SELECT id FROM users WHERE status = 'active' AND salary > 50000
         ),
         buyers AS (
           SELECT DISTINCT user_id AS id FROM orders WHERE amount > 0
         )
       SELECT id FROM new_users
       INTERSECT
       SELECT id FROM buyers`,
      [USERS, ORDERS]
    );
    expect(fields(r)).toEqual({
      id: [inp("users", "id"), inp("orders", "user_id")],
    });
    expectSetEqual(dataset(r), [
      inp("users", "status"),
      inp("users", "salary"),
      inp("orders", "amount"),
    ]);
  });

  test("hierarchical self-join with CTE", () => {
    const r = run(
      `WITH RECURSIVE cat_tree AS (
         SELECT id, name, parent_id FROM categories WHERE parent_id IS NULL
         UNION ALL
         SELECT c.id, c.name, c.parent_id
         FROM categories c
         JOIN cat_tree ct ON c.parent_id = ct.id
       )
       SELECT id, name FROM cat_tree`,
      [CATEGORIES]
    );
    expectSetEqual(fields(r)["id"]!, [inp("categories", "id")]);
    expectSetEqual(fields(r)["name"]!, [inp("categories", "name")]);
    expect(inputNames(r)).toEqual(["cat_tree", "categories"]);
  });

  test("deeply nested correlated subquery", () => {
    const r = run(
      `SELECT u.id, u.name
       FROM users u
       WHERE u.salary > (
         SELECT AVG(salary)
         FROM employees e
         WHERE e.department = u.department
       )`,
      [USERS, EMPLOYEES]
    );
    expect(fields(r)).toEqual({
      id: [inp("users", "id")],
      name: [inp("users", "name")],
    });
    expectSetEqual(dataset(r), [
      inp("users", "salary"),
      inp("employees", "salary"),
      inp("employees", "department"),
      inp("users", "department"),
    ]);
  });

  test("CASE with subquery in THEN branch", () => {
    const r = run(
      `SELECT u.id,
              CASE
                WHEN u.status = 'active'
                THEN (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id)
                ELSE 0
              END AS order_count
       FROM users u`,
      [USERS, ORDERS]
    );
    expect(fields(r)).toEqual({
      id: [inp("users", "id")],
      order_count: [inp("users", "status"), inp("orders", "user_id"), inp("users", "id")],
    });
    expect(dataset(r)).toEqual([]);
  });

  test("UPDATE-style SELECT (Trino): qualified multi-table subquery", () => {
    const r = run(
      `SELECT p.id, p.status
       FROM payments p
       WHERE p.order_id IN (
         SELECT o.id
         FROM orders o
         JOIN users u ON o.user_id = u.id
         WHERE u.status = 'active' AND o.amount > 100
       )`,
      [USERS, ORDERS, PAYMENTS]
    );
    expect(fields(r)).toEqual({
      id: [inp("payments", "id")],
      status: [inp("payments", "status")],
    });
    expectSetEqual(dataset(r), [
      inp("payments", "order_id"),
      inp("orders", "id"),
      inp("orders", "user_id"),
      inp("users", "id"),
      inp("users", "status"),
      inp("orders", "amount"),
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 16. UNNEST & TABLE() TABLE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
describe("UNNEST and TABLE() table functions", () => {
  test("UNNEST — array column reference tracked as dataset-level dep", () => {
    const r = run(
      `SELECT u.id, t.tag
       FROM users u
       CROSS JOIN UNNEST(u.tags) AS t(tag)`,
      [tbl("users", ["id", "tags"])]
    );
    expect(fields(r)["id"]).toEqual([inp("users", "id")]);
    // UNNEST(u.tags) contributes tags as dataset-level
    expect(dataset(r)).toEqual([inp("users", "tags")]);
  });

  test("UNNEST — t.tag from derived alias is transparent (not unresolved)", () => {
    const r = run(
      `SELECT t.tag
       FROM events e
       CROSS JOIN UNNEST(e.tag_array) AS t(tag)`,
      [tbl("events", ["id", "tag_array"])]
    );
    // t.tag → derived source with empty column origins
    expect(dataset(r)).toEqual([inp("events", "tag_array")]);
  });

  test("UNNEST WITH ORDINALITY — array col tracked as dataset", () => {
    const r = run(
      `SELECT e.id, t.tag, t.pos
       FROM events e
       CROSS JOIN UNNEST(e.tag_array) WITH ORDINALITY AS t(tag, pos)`,
      [tbl("events", ["id", "tag_array"])]
    );
    expect(fields(r)["id"]).toEqual([inp("events", "id")]);
    expect(dataset(r)).toEqual([inp("events", "tag_array")]);
  });

  test("UNNEST with multiple array columns", () => {
    const r = run(
      `SELECT t.a, t.b
       FROM src
       CROSS JOIN UNNEST(src.xs, src.ys) AS t(a, b)`,
      [tbl("src", ["xs", "ys"])]
    );
    expectSetEqual(dataset(r), [inp("src", "xs"), inp("src", "ys")]);
  });

  test("TABLE() invocation with no TABLE(tbl) arg — output columns empty", () => {
    const r = run(`SELECT id FROM TABLE(my_catalog.my_table())`);
    // No tables referenced → no inputs
    expect(r.inputs).toEqual([]);
  });

  test("TABLE() with TABLE(tbl) argument — PARTITION BY column tracked as dataset", () => {
    const r = run(
      `SELECT res.val
       FROM TABLE(my_func(TABLE(source_table) PARTITION BY id)) AS res(val)`,
      [tbl("source_table", ["id", "val"])]
    );
    expect(dataset(r)).toEqual([inp("source_table", "id")]);
    expect(inputNames(r)).toEqual(["source_table"]);
  });

  test("TABLE() with TABLE(tbl) argument — ORDER BY column tracked as dataset", () => {
    const r = run(
      `SELECT *
       FROM TABLE(my_func(TABLE(fact_table) ORDER BY created_at)) AS r(v)`,
      [tbl("fact_table", ["created_at", "amount"])]
    );
    expect(dataset(r)).toEqual([inp("fact_table", "created_at")]);
    expect(inputNames(r)).toEqual(["fact_table"]);
  });

  test("TABLE() with multiple TABLE() arguments — columns tracked on respective tables", () => {
    const r = run(
      `SELECT *
       FROM TABLE(my_join_func(
         TABLE(left_table)  PARTITION BY lid,
         TABLE(right_table) PARTITION BY rid
       )) AS r(v)`,
      [tbl("left_table", ["lid", "lval"]), tbl("right_table", ["rid", "rval"])]
    );
    expectSetEqual(dataset(r), [inp("left_table", "lid"), inp("right_table", "rid")]);
    expect(inputNames(r)).toEqual(["left_table", "right_table"]);
  });

  test("TABLE() with TABLE(query) argument — inner query columns tracked normally", () => {
    const r = run(
      `SELECT *
       FROM TABLE(my_func(TABLE(SELECT id, amount FROM orders WHERE status = 'pending'))) AS r(v)`,
      [tbl("orders", ["id", "amount", "status"])]
    );
    expectSetEqual(dataset(r), [
      inp("orders", "id"),
      inp("orders", "amount"),
      inp("orders", "status"),
    ]);
  });

  test("TABLE() combined with a regular JOIN — both sides contribute", () => {
    const r = run(
      `SELECT d.name, r.score
       FROM TABLE(rank_func(TABLE(facts) PARTITION BY category_id)) AS r(score)
       JOIN dims d ON r.score = d.score`,
      [tbl("facts", ["category_id", "value"]), tbl("dims", ["score", "name"])]
    );
    expect(fields(r)["name"]).toEqual([inp("dims", "name")]);
    expectSetEqual(dataset(r), [inp("facts", "category_id"), inp("dims", "score")]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 17. JSON_TABLE
// ─────────────────────────────────────────────────────────────────────────────
describe("JSON_TABLE", () => {
  const ORDERS_WITH_PAYLOAD = tbl("orders", ["id", "payload", "status"]);
  const ORDERS_WITH_JSON_COLUMNS = tbl("orders", ["id", "payload", "payload_text", "status"]);

  test("JSON_TABLE without alias — output columns from derived (no real table input)", () => {
    const r = run(
      `SELECT id
       FROM JSON_TABLE('[{"id":1}]', 'lax $[*]' COLUMNS (
         id BIGINT PATH 'lax $.id'
       ))`
    );
    expect(r.inputs).toEqual([]);
  });

  test("JSON_TABLE source expression from a real table is tracked", () => {
    const r = run(
      `SELECT jt.id
       FROM orders o
       CROSS JOIN JSON_TABLE(
         o.payload,
         '$'
         COLUMNS (
           id VARCHAR PATH '$.id'
         )
       ) jt`,
      [ORDERS_WITH_PAYLOAD]
    );
    // jt.id is derived → empty column origins
    // o.payload source → dataset-level
    expect(dataset(r)).toEqual([inp("orders", "payload")]);
    expect(inputNames(r)).toEqual(["orders"]);
  });

  test("SELECT * with JSON_TABLE(o.payload, ...) keeps base table lineage", () => {
    const r = run(
      `SELECT *
       FROM orders o
       CROSS JOIN JSON_TABLE(
         o.payload,
         '$'
         COLUMNS (
           id VARCHAR PATH '$.id'
         )
       ) jt`,
      [ORDERS_WITH_PAYLOAD]
    );
    // Base table star expansion still works
    expect(fields(r)["id"]).toEqual([inp("orders", "id")]);
    expect(fields(r)["payload"]).toEqual([inp("orders", "payload")]);
    expect(fields(r)["status"]).toEqual([inp("orders", "status")]);
  });

  test("JSON_TABLE source using json_extract / json_parse tracks arguments", () => {
    const r = run(
      `SELECT je.eid, jp.pid
       FROM orders o
       CROSS JOIN JSON_TABLE(
         json_extract(o.payload, '$.items'),
         '$[*]'
         COLUMNS (
           eid VARCHAR PATH '$.id'
         )
       ) je
       CROSS JOIN JSON_TABLE(
         json_parse(o.payload_text),
         '$'
         COLUMNS (
           pid VARCHAR PATH '$.id'
         )
       ) jp`,
      [ORDERS_WITH_JSON_COLUMNS]
    );
    expect(dataset(r)).toEqual([inp("orders", "payload"), inp("orders", "payload_text")]);
  });

  test("alias-qualified JSON_TABLE columns are derived (no real table attribution)", () => {
    const r = run(
      `SELECT jt.id, jt.ord
       FROM JSON_TABLE('[{"id":1}]', 'lax $[*]' COLUMNS (
         id BIGINT PATH 'lax $.id',
         ord FOR ORDINALITY
       )) AS jt`
    );
    expect(r.inputs).toEqual([]);
  });

  test("JSON_TABLE alias column list is accepted", () => {
    const r = run(
      `SELECT jt_alias.c1
       FROM JSON_TABLE('[{"id":1}]', 'lax $[*]' COLUMNS (
         id BIGINT PATH 'lax $.id'
       )) AS jt_alias(c1)`
    );
    expect(r.inputs).toEqual([]);
  });

  test("JSON_TABLE in JOIN ON does not leak columns and still tracks real tables", () => {
    const r = run(
      `SELECT u.id
       FROM users u
       JOIN JSON_TABLE('[{"id":1}]', 'lax $[*]' COLUMNS (
         id BIGINT PATH 'lax $.id',
         nested_json VARCHAR FORMAT JSON PATH 'lax $.nested'
       )) AS jt
         ON jt.id = u.id
       WHERE u.status = 'active'`,
      [USERS]
    );
    expect(fields(r)["id"]).toEqual([inp("users", "id")]);
    expectSetEqual(dataset(r), [inp("users", "id"), inp("users", "status")]);
  });

  test("JSON_TABLE with NESTED COLUMNS parses and participates in alias resolution", () => {
    const r = run(
      `SELECT u.id, jt.x
       FROM users u
       JOIN JSON_TABLE('[{"id":1,"arr":[{"x":10}]}]', 'lax $[*]' COLUMNS (
         id BIGINT PATH 'lax $.id',
         NESTED PATH 'lax $.arr[*]' COLUMNS (
           x BIGINT PATH 'lax $.x'
         )
       )) AS jt
         ON jt.id = u.id`,
      [USERS]
    );
    expect(fields(r)["id"]).toEqual([inp("users", "id")]);
    expect(inputNames(r)).toEqual(["users"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// OBSCURE & EDGE CASES — SCHEMA, METADATA, AND SQL
// ─────────────────────────────────────────────────────────────────────────────
describe("Obscure & Edge Cases: Schema, Metadata, SQL", () => {
  test("subquery with duplicate column names", () => {
    const meta = tbl("users", ["id", "name"]);
    const r = run(`SELECT t.id FROM (SELECT id, id FROM users) t`, [meta]);
    expect(fields(r)["id"]).toEqual([inp("users", "id")]);
  });

  test("outer derived table does not satisfy inner subquery's bare column", () => {
    const meta = tbl("y", ["id"]);
    const r = run(`SELECT id FROM (SELECT id FROM y) sub, (SELECT 1 AS id) x`, [meta]);
    // Ambiguous bare id from two derived sources in the outer scope
    // sub.id traces to y.id, x.id traces to nothing (literal); bare id is ambiguous
    // Implementation: both derived tables expose 'id' → ambiguity → empty per-column
    expect(fields(r)["id"]!.length).toBe(0);
  });

  test("qualified correlated ref to outer derived alias is allowed and transparent", () => {
    const meta = tbl("users", ["id"]);
    const r = run(
      `SELECT *
       FROM (SELECT id FROM users) x
       WHERE EXISTS (SELECT 1 WHERE x.id > 0)`,
      [meta]
    );
    expect(fields(r)["id"]).toEqual([inp("users", "id")]);
  });

  test("ambiguous alias shadowing table name", () => {
    const meta = tbl("users", ["id", "name"]);
    const r = run(`SELECT users.id FROM users users`, [meta]);
    expect(fields(r)["id"]).toEqual([inp("users", "id")]);
  });

  test("reserved keyword as quoted identifier", () => {
    const meta = tbl("users", ["select", "from"]);
    const r = run(`SELECT "select", "from" FROM users`, [meta]);
    expect(fields(r)["select"]).toEqual([inp("users", "select")]);
    expect(fields(r)["from"]).toEqual([inp("users", "from")]);
  });

  test("empty column list in metadata — no columns resolve", () => {
    const meta = tbl("users", []);
    const r = run(`SELECT id FROM users`, [meta]);
    // id cannot resolve to any column in metadata → empty
    expect(fields(r)["id"]!.length).toBe(0);
  });

  test("table name is reserved keyword (quoted)", () => {
    const meta = tbl("select", ["id"]);
    const r = run(`SELECT id FROM "select"`, [meta]);
    expect(fields(r)["id"]).toEqual([inp("select", "id")]);
  });

  test("join ON referencing non-existent columns — attributed to tables", () => {
    const meta1 = tbl("users", ["id"]);
    const meta2 = tbl("orders", ["id"]);
    const r = run(`SELECT u.id FROM users u JOIN orders o ON u.foo = o.bar`, [meta1, meta2]);
    expect(fields(r)["id"]).toEqual([inp("users", "id")]);
    // ON clause non-existent columns → dataset-level (synthesized)
    expect(dataset(r)).toEqual([inp("users", "foo"), inp("orders", "bar")]);
  });

  test("SELECT with duplicate column aliases — disambiguated with suffix", () => {
    const meta = tbl("users", ["id", "name"]);
    const r = run(`SELECT id AS x, name AS x FROM users`, [meta]);
    // Second 'x' gets disambiguated
    expect(fields(r)["x"]).toEqual([inp("users", "id")]);
    expect(fields(r)["x_1"]).toEqual([inp("users", "name")]);
  });

  test("function call on unknown column — no inputs", () => {
    const meta = tbl("users", ["id"]);
    const r = run(`SELECT UPPER(name) AS up FROM users`, [meta]);
    // 'name' not in metadata → does not resolve
    expect(fields(r)["up"]!.length).toBe(0);
  });

  test("schema in query, no schema in metadata — unknown table", () => {
    const r = run(`SELECT id FROM myschema.users`, [USERS]);
    // metadata has no schema → myschema.users doesn't match 'users' metadata
    expect(fields(r)["id"]).toEqual([inp("myschema.users", "id")]);
    expect(inputNames(r)).toEqual(["myschema.users"]);
  });

  test("schema in metadata, not in query", () => {
    const meta = tbl("users", ["id", "name"], "myschema");
    const r = run(`SELECT id FROM users`, [meta]);
    expect(fields(r)["id"]).toEqual([inp("myschema.users", "id")]);
  });

  test("schema in both query and metadata", () => {
    const meta = tbl("users", ["id", "name"], "myschema");
    const r = run(`SELECT id FROM myschema.users`, [meta]);
    expect(fields(r)["id"]).toEqual([inp("myschema.users", "id")]);
  });

  test("schema-qualified SQL does not match metadata with namespace.schema prefix", () => {
    const meta = tbl("users", ["id", "name"], "namespaceName.schemaName");
    const r = run(`SELECT u.id FROM schemaName.users u`, [meta]);
    // Doesn't match → unknown table
    expect(fields(r)["id"]).toEqual([inp("schemaName.users", "id")]);
  });

  test("partial metadata: missing columns", () => {
    const meta = tbl("users", ["id"]);
    const r = run(`SELECT id, name FROM users`, [meta]);
    expect(fields(r)["id"]).toEqual([inp("users", "id")]);
    // 'name' not in metadata → does not resolve
    expect(fields(r)["name"]!.length).toBe(0);
  });

  test("table alias with schema", () => {
    const meta = tbl("users", ["id", "name"], "myschema");
    const r = run(`SELECT u.id FROM myschema.users u`, [meta]);
    expect(fields(r)["id"]).toEqual([inp("myschema.users", "id")]);
  });

  test("table alias with schema, metadata missing schemaName", () => {
    const r = run(`SELECT u.id FROM myschema.users u`, [USERS]);
    // myschema.users doesn't match USERS which has no schema
    expect(fields(r)["id"]).toEqual([inp("myschema.users", "id")]);
  });

  test("column alias shadows real column", () => {
    const meta = tbl("users", ["id", "name"]);
    const r = run(`SELECT id AS name FROM users`, [meta]);
    expect(fields(r)["name"]).toEqual([inp("users", "id")]);
  });

  test("SELECT * with partial metadata", () => {
    const meta = tbl("users", ["id"]);
    const r = run(`SELECT * FROM users`, [meta]);
    expect(fields(r)["id"]).toEqual([inp("users", "id")]);
  });

  test("deeply nested subquery with schema, missing metadata", () => {
    const r = run(`SELECT id FROM (SELECT id FROM myschema.users) x`);
    expect(fields(r)["id"]).toEqual([inp("myschema.users", "id")]);
  });

  test("CTE body unresolved column — flows through as empty", () => {
    const meta = tbl("orders", ["id"]);
    const r = run(`WITH cte AS (SELECT name FROM orders) SELECT * FROM cte`, [meta]);
    // 'name' is not in orders metadata → CTE output column has no origins
    expect(fields(r)["name"]!.length).toBe(0);
  });

  test("CTE with schema-qualified reference, partial metadata", () => {
    const meta = tbl("users", ["id"], "myschema");
    const r = run(`WITH cte AS (SELECT id, name FROM myschema.users) SELECT id, name FROM cte`, [meta]);
    expect(fields(r)["id"]).toEqual([inp("myschema.users", "id")]);
    // 'name' not in metadata → empty
    expect(fields(r)["name"]!.length).toBe(0);
  });

  test("quoted identifiers with schema", () => {
    const meta = tbl("users", ["id", "weird name"], "myschema");
    const r = run(`SELECT "id", "weird name" FROM "myschema"."users"`, [meta]);
    expect(fields(r)["id"]).toEqual([inp("myschema.users", "id")]);
    expect(fields(r)["weird name"]).toEqual([inp("myschema.users", "weird name")]);
  });

  test("schema in metadata, query uses alias only", () => {
    const meta = tbl("users", ["id", "name"], "myschema");
    const r = run(`SELECT u.id FROM users u`, [meta]);
    expect(fields(r)["id"]).toEqual([inp("myschema.users", "id")]);
  });

  test("join on schema-qualified and unqualified tables", () => {
    const meta1 = tbl("users", ["id", "name"], "myschema");
    const meta2 = tbl("orders", ["id", "user_id"], undefined);
    const r = run(`SELECT u.id, o.user_id FROM myschema.users u JOIN orders o ON u.id = o.user_id`, [meta1, meta2]);
    expect(fields(r)["id"]).toEqual([inp("myschema.users", "id")]);
    expect(fields(r)["user_id"]).toEqual([inp("orders", "user_id")]);
  });

  test("join with both tables missing schema in metadata", () => {
    const meta1 = tbl("users", ["id", "name"]);
    const meta2 = tbl("orders", ["id", "user_id"]);
    const r = run(`SELECT u.id, o.user_id FROM myschema.users u JOIN myschema.orders o ON u.id = o.user_id`, [
      meta1,
      meta2,
    ]);
    // Neither myschema.users nor myschema.orders match metadata without schema
    expect(fields(r)["id"]).toEqual([inp("myschema.users", "id")]);
    expect(fields(r)["user_id"]).toEqual([inp("myschema.orders", "user_id")]);
  });

  test("join with one table missing metadata", () => {
    const meta1 = tbl("users", ["id", "name"]);
    const r = run(`SELECT u.id, o.user_id FROM users u JOIN orders o ON u.id = o.user_id`, [meta1]);
    expect(fields(r)["id"]).toEqual([inp("users", "id")]);
    expect(fields(r)["user_id"]).toEqual([inp("orders", "user_id")]);
  });

  test("join with no metadata at all", () => {
    const r = run(`SELECT u.id, o.user_id FROM users u JOIN orders o ON u.id = o.user_id`);
    expect(fields(r)["id"]).toEqual([inp("users", "id")]);
    expect(fields(r)["user_id"]).toEqual([inp("orders", "user_id")]);
    expect(inputNames(r)).toEqual(["orders", "users"]);
  });

  test("CTE with schema-qualified table, no metadata", () => {
    const r = run(`WITH cte AS (SELECT id FROM myschema.users) SELECT id FROM cte`);
    expect(fields(r)["id"]).toEqual([inp("myschema.users", "id")]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 20. SAME TABLE NAME, DIFFERENT SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────
describe("Same table name, different schemas", () => {
  const S1_CUSTOMERS = tbl("customers", ["id", "name"], "schema1");
  const S2_CUSTOMERS = tbl("customers", ["id", "email"], "schema2");

  test("fully-qualified references each resolve to the correct schema's table", () => {
    const r = run(
      `SELECT schema1.customers.id, schema2.customers.email
       FROM schema1.customers, schema2.customers`,
      [S1_CUSTOMERS, S2_CUSTOMERS]
    );
    expect(fields(r)["id"]).toEqual([inp("schema1.customers", "id")]);
    expect(fields(r)["email"]).toEqual([inp("schema2.customers", "email")]);
  });

  test("ambiguous short-name qualifier (customers.col) — no resolution", () => {
    const r = run(`SELECT customers.id FROM schema1.customers, schema2.customers`, [S1_CUSTOMERS, S2_CUSTOMERS]);
    // 'customers' is ambiguous (poisoned) → cannot resolve
    expect(fields(r)["id"]!.length).toBe(0);
  });

  test("bare column present in both schemas is ambiguous", () => {
    const r = run(`SELECT id FROM schema1.customers, schema2.customers`, [S1_CUSTOMERS, S2_CUSTOMERS]);
    expect(fields(r)["id"]!.length).toBe(0);
  });

  test("bare column present in only one schema resolves correctly", () => {
    const r = run(`SELECT name FROM schema1.customers, schema2.customers`, [S1_CUSTOMERS, S2_CUSTOMERS]);
    expect(fields(r)["name"]).toEqual([inp("schema1.customers", "name")]);
  });

  test("aliases disambiguate same-name tables from different schemas", () => {
    const r = run(`SELECT c1.id, c2.email FROM schema1.customers c1, schema2.customers c2`, [
      S1_CUSTOMERS,
      S2_CUSTOMERS,
    ]);
    expect(fields(r)["id"]).toEqual([inp("schema1.customers", "id")]);
    expect(fields(r)["email"]).toEqual([inp("schema2.customers", "email")]);
  });

  test("three schemas — short name stays poisoned after first collision", () => {
    const S3_CUSTOMERS = tbl("customers", ["id", "address"], "schema3");
    const r = run(
      `SELECT schema1.customers.id, schema2.customers.email, schema3.customers.address, customers.id AS cid
       FROM schema1.customers, schema2.customers, schema3.customers`,
      [S1_CUSTOMERS, S2_CUSTOMERS, S3_CUSTOMERS]
    );
    expect(fields(r)["id"]).toEqual([inp("schema1.customers", "id")]);
    expect(fields(r)["email"]).toEqual([inp("schema2.customers", "email")]);
    expect(fields(r)["address"]).toEqual([inp("schema3.customers", "address")]);
    // customers.id is ambiguous — no resolution
    expect(fields(r)["cid"]!.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MATCH_RECOGNIZE
// ─────────────────────────────────────────────────────────────────────────────
describe("MATCH_RECOGNIZE", () => {
  const TICKER = tbl("ticker", ["symbol", "event_time", "price", "volume"]);

  test("MEASURES expressions — source table tracked via dataset", () => {
    const r = run(
      `SELECT m.symbol, m.first_price, m.last_price
       FROM ticker MATCH_RECOGNIZE (
         PARTITION BY symbol
         ORDER BY event_time
         MEASURES
           FIRST(A.price) AS first_price,
           LAST(B.price)  AS last_price
         ONE ROW PER MATCH
         PATTERN (A+ B+)
         DEFINE
           A AS price < 100,
           B AS price >= 100
       ) AS m`,
      [TICKER]
    );
    // MATCH_RECOGNIZE output is derived → column refs resolve empty for outer SELECT
    // But lineage from PARTITION BY / ORDER BY / MEASURES / DEFINE comes from the source table
    expect(inputNames(r)).toEqual(["ticker"]);
  });

  test("PARTITION BY expression resolves to source table column", () => {
    const r = run(
      `SELECT m.sym
       FROM ticker MATCH_RECOGNIZE (
         PARTITION BY symbol
         MEASURES symbol AS sym
         ONE ROW PER MATCH
         PATTERN (A)
         DEFINE A AS TRUE
       ) AS m`,
      [TICKER]
    );
    expect(inputNames(r)).toEqual(["ticker"]);
  });

  test("MATCH_RECOGNIZE without alias — still contributes input datasets", () => {
    const r = run(
      `SELECT *
       FROM ticker MATCH_RECOGNIZE (
         PARTITION BY symbol
         MEASURES A.price AS first_price
         ONE ROW PER MATCH
         PATTERN (A+)
         DEFINE A AS price < 100
       )`,
      [TICKER]
    );
    expect(inputNames(r)).toEqual(["ticker"]);
  });

  test("CTE as MATCH_RECOGNIZE source table — lineage flows to base", () => {
    const r = run(
      `WITH ticks AS (SELECT symbol, event_time, price FROM ticker)
       SELECT m.first_price
       FROM ticks MATCH_RECOGNIZE (
         PARTITION BY symbol
         ORDER BY event_time
         MEASURES FIRST(A.price) AS first_price
         ONE ROW PER MATCH
         PATTERN (A+)
         DEFINE A AS price > 0
       ) AS m`,
      [TICKER]
    );
    expect(inputNames(r)).toEqual(["ticker"]);
  });

  test("MATCH_RECOGNIZE inside a CTE body — lineage traces back to source", () => {
    const r = run(
      `WITH mr AS (
         SELECT m.symbol, m.first_price
         FROM ticker MATCH_RECOGNIZE (
           PARTITION BY symbol
           MEASURES FIRST(A.price) AS first_price
           ONE ROW PER MATCH
           PATTERN (A+)
           DEFINE A AS price > 0
         ) AS m
       )
       SELECT symbol, first_price FROM mr`,
      [TICKER]
    );
    expect(inputNames(r)).toEqual(["ticker"]);
  });

  test("MATCH_RECOGNIZE output joined with another table", () => {
    const STOCK_INFO = tbl("stock_info", ["symbol", "sector"]);
    const r = run(
      `SELECT m.first_price, s.sector
       FROM ticker MATCH_RECOGNIZE (
         PARTITION BY symbol
         MEASURES FIRST(A.price) AS first_price, symbol AS symbol
         ONE ROW PER MATCH
         PATTERN (A+)
         DEFINE A AS price > 0
       ) AS m
       JOIN stock_info s ON m.symbol = s.symbol`,
      [TICKER, STOCK_INFO]
    );
    expect(fields(r)["sector"]).toEqual([inp("stock_info", "sector")]);
    expect(inputNames(r)).toEqual(["stock_info", "ticker"]);
    expectSetEqual(dataset(r), [inp("stock_info", "symbol")]);
  });

  test("MATCH_RECOGNIZE source with unknown table — still in inputs", () => {
    const r = run(
      `SELECT m.measure_col
       FROM unknown_tbl MATCH_RECOGNIZE (
         MEASURES A.col1 AS measure_col
         ONE ROW PER MATCH
         PATTERN (A+)
         DEFINE A AS 1 = 1
       ) AS m`,
      []
    );
    expect(inputNames(r)).toEqual(["unknown_tbl"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// API & OPTIONS
// ─────────────────────────────────────────────────────────────────────────────
describe("API & Options", () => {
  test("outputName option sets the output dataset name", () => {
    const r = getColumnLevelLineage("SELECT id FROM users", [USERS], {
      defaultNamespace: NS,
      outputName: "analytics.daily_users",
    });
    expect(r.outputs[0]!.name).toBe("analytics.daily_users");
    expect(r.outputs[0]!.namespace).toBe(NS);
  });

  test("outputNamespace option overrides default for output only", () => {
    const r = getColumnLevelLineage("SELECT id FROM users", [USERS], {
      defaultNamespace: NS,
      outputNamespace: "s3://bucket",
      outputName: "parquet_out",
    });
    expect(r.outputs[0]!.namespace).toBe("s3://bucket");
    expect(r.inputs[0]!.namespace).toBe(NS);
  });

  test("default namespace is empty string when omitted", () => {
    const r = getColumnLevelLineage("SELECT id FROM users", [USERS]);
    expect(r.inputs[0]!.namespace).toBe("");
    expect(r.outputs[0]!.namespace).toBe("");
  });

  test("synthetic output name used when outputName omitted", () => {
    const r = getColumnLevelLineage("SELECT id FROM users", [USERS]);
    expect(r.outputs[0]!.name).toBe("__query_result__");
  });

  test("result structure has inputs and outputs arrays", () => {
    const r = run(`SELECT id FROM users`, [USERS]);
    expect(Array.isArray(r.inputs)).toBe(true);
    expect(Array.isArray(r.outputs)).toBe(true);
    expect(r.outputs).toHaveLength(1);
    expect(r.outputs[0]!.facets).toBeDefined();
    expect(r.outputs[0]!.facets!.columnLineage).toBeDefined();
    expect(r.outputs[0]!.facets!.columnLineage!.fields).toBeDefined();
    expect(Array.isArray(r.outputs[0]!.facets!.columnLineage!.dataset)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Additional Edge Cases
// ─────────────────────────────────────────────────────────────────────────────
describe("Additional Edge Cases", () => {
  test("CAST expression — source column tracked on output", () => {
    const r = run(`SELECT CAST(salary AS VARCHAR) AS salary_str FROM users`, [USERS]);
    expect(fields(r)).toEqual({ salary_str: [inp("users", "salary")] });
    expect(dataset(r)).toEqual([]);
  });

  test("nested CAST — inner column tracked", () => {
    const r = run(`SELECT CAST(CAST(id AS BIGINT) AS VARCHAR) AS id_str FROM users`, [USERS]);
    expect(fields(r)).toEqual({ id_str: [inp("users", "id")] });
    expect(dataset(r)).toEqual([]);
  });

  test("COALESCE — all arguments tracked on output column", () => {
    const r = run(`SELECT COALESCE(u.name, u.department, 'unknown') AS display FROM users u`, [USERS]);
    expect(fields(r)).toEqual({ display: [inp("users", "name"), inp("users", "department")] });
    expect(dataset(r)).toEqual([]);
  });

  test("NULLIF — both arguments tracked", () => {
    const r = run(`SELECT NULLIF(salary, 0) AS safe_salary FROM users`, [USERS]);
    expect(fields(r)).toEqual({ safe_salary: [inp("users", "salary")] });
    expect(dataset(r)).toEqual([]);
  });

  test("string concatenation operator || — both sides tracked", () => {
    const r = run(`SELECT name || ' (' || department || ')' AS label FROM users`, [USERS]);
    expect(fields(r)).toEqual({ label: [inp("users", "name"), inp("users", "department")] });
    expect(dataset(r)).toEqual([]);
  });

  test("multiple USING columns in JOIN", () => {
    const META_A = tbl("table_a", ["id", "region", "status", "value"]);
    const META_B = tbl("table_b", ["id", "region", "score"]);
    const r = run(`SELECT a.value, b.score FROM table_a a JOIN table_b b USING (id, region)`, [META_A, META_B]);
    expect(fields(r)).toEqual({
      value: [inp("table_a", "value")],
      score: [inp("table_b", "score")],
    });
    expectSetEqual(dataset(r), [
      inp("table_a", "id"),
      inp("table_b", "id"),
      inp("table_a", "region"),
      inp("table_b", "region"),
    ]);
  });

  test("subquery in HAVING clause — columns go to dataset", () => {
    const r = run(
      `SELECT department, COUNT(*) AS cnt
       FROM users
       GROUP BY department
       HAVING COUNT(*) > (SELECT AVG(salary) FROM employees)`,
      [USERS, EMPLOYEES]
    );
    expect(fields(r)).toEqual({
      department: [inp("users", "department")],
      cnt: [],
    });
    expectSetEqual(dataset(r), [inp("users", "department"), inp("employees", "salary")]);
  });

  test("LIMIT and OFFSET — no columns tracked", () => {
    const r = run(`SELECT id, name FROM users OFFSET 5 LIMIT 10`, [USERS]);
    expect(fields(r)).toEqual({
      id: [inp("users", "id")],
      name: [inp("users", "name")],
    });
    expect(dataset(r)).toEqual([]);
  });

  test("IS DISTINCT FROM in WHERE — both sides tracked as dataset", () => {
    const r = run(`SELECT id FROM users WHERE status IS DISTINCT FROM department`, [USERS]);
    expect(fields(r)).toEqual({ id: [inp("users", "id")] });
    expectSetEqual(dataset(r), [inp("users", "status"), inp("users", "department")]);
  });

  test("EXTRACT function — source column tracked", () => {
    const META = tbl("events", ["id", "created_at"]);
    const r = run(`SELECT EXTRACT(YEAR FROM created_at) AS yr FROM events`, [META]);
    expect(fields(r)).toEqual({ yr: [inp("events", "created_at")] });
    expect(dataset(r)).toEqual([]);
  });

  test("TRY_CAST — same as CAST", () => {
    const r = run(`SELECT TRY_CAST(salary AS DOUBLE) AS salary_dbl FROM users`, [USERS]);
    expect(fields(r)).toEqual({ salary_dbl: [inp("users", "salary")] });
    expect(dataset(r)).toEqual([]);
  });

  test("multiple aggregates on same column — each output column gets its own copy", () => {
    const r = run(`SELECT MIN(salary) AS min_sal, MAX(salary) AS max_sal, AVG(salary) AS avg_sal FROM users`, [USERS]);
    expect(fields(r)).toEqual({
      min_sal: [inp("users", "salary")],
      max_sal: [inp("users", "salary")],
      avg_sal: [inp("users", "salary")],
    });
    expect(dataset(r)).toEqual([]);
  });

  test("constant expression — no inputs", () => {
    const r = run(`SELECT 1 + 2 AS three, 'hello' AS greeting FROM users`, [USERS]);
    expect(fields(r)).toEqual({ three: [], greeting: [] });
    expect(dataset(r)).toEqual([]);
  });

  test("full-root assertion — simple single-table query", () => {
    const r = getColumnLevelLineage("SELECT id, name FROM users", [USERS], {
      defaultNamespace: "prod",
      outputName: "result_table",
    });
    expect(r).toEqual({
      inputs: [{ namespace: "prod", name: "users" }],
      outputs: [
        {
          namespace: "prod",
          name: "result_table",
          facets: {
            columnLineage: {
              fields: {
                id: { inputFields: [{ namespace: "prod", name: "users", field: "id" }] },
                name: { inputFields: [{ namespace: "prod", name: "users", field: "name" }] },
              },
              dataset: [],
            },
          },
        },
      ],
      unresolvedTableColumns: [],
    });
  });

  test("full-root assertion — JOIN with WHERE", () => {
    const r = getColumnLevelLineage(
      "SELECT u.name, o.amount FROM users u JOIN orders o ON u.id = o.user_id WHERE o.amount > 100",
      [USERS, ORDERS],
      { defaultNamespace: "dw", outputName: "report" }
    );
    expect(r).toEqual({
      inputs: [
        { namespace: "dw", name: "orders" },
        { namespace: "dw", name: "users" },
      ],
      outputs: [
        {
          namespace: "dw",
          name: "report",
          facets: {
            columnLineage: {
              fields: {
                name: { inputFields: [{ namespace: "dw", name: "users", field: "name" }] },
                amount: { inputFields: [{ namespace: "dw", name: "orders", field: "amount" }] },
              },
              dataset: [
                { namespace: "dw", name: "users", field: "id" },
                { namespace: "dw", name: "orders", field: "user_id" },
                { namespace: "dw", name: "orders", field: "amount" },
              ],
            },
          },
        },
      ],
      unresolvedTableColumns: [],
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// API BOUNDARY CASES
// ─────────────────────────────────────────────────────────────────────────────
describe("API boundary cases", () => {
  test("empty SQL string — throws", () => {
    expect(() => run("")).toThrow();
  });

  test("SELECT with no FROM clause — literal columns, no inputs", () => {
    const r = run("SELECT 1 AS one, 'hello' AS greeting");
    expect(r.inputs).toEqual([]);
    expect(fields(r)).toEqual({ one: [], greeting: [] });
    expect(dataset(r)).toEqual([]);
  });

  test("syntax-error SQL — throws", () => {
    expect(() => run("SELECT FROM WHERE")).toThrow();
  });
});
