/**
 * Comprehensive test suite for getColumnLineage.
 *
 * Annotation conventions:
 *   - Normal tests: expected to pass.
 *   - test.fails(...)  : known bug in the lineage visitor/parser — marked for
 *                        a future fix. These will show as "(expected failure)"
 *                        in the output and will NOT turn red.
 *   - test.skip(...)   : feature explicitly not supported.
 */
import { describe, expect, test } from "vitest";
import { getColumnLineage, type ColumnLineageResult, type TableMetadata } from "../column-lineage.js";

// ─── tiny helpers ────────────────────────────────────────────────────────────

/** Canonical shape — already sorted by getResult(); re-sort for safety. */
function sorted(r: ColumnLineageResult): ColumnLineageResult {
  return {
    tableColumns: r.tableColumns
      .map((t) => ({ table: t.table, columns: [...t.columns].sort() }))
      .sort((a, b) => a.table.localeCompare(b.table)),
    unresolvedTableColumns: [...r.unresolvedTableColumns].sort((a, b) => {
      const tCmp = (a.table ?? "").localeCompare(b.table ?? "");
      return tCmp !== 0 ? tCmp : a.column.localeCompare(b.column);
    }),
  };
}

function run(sql: string, meta: TableMetadata[] = []): ColumnLineageResult {
  return sorted(getColumnLineage(sql, meta));
}

// Shorthand metadata builders
const tbl = (tableName: string, columns: string[], tableSchema?: string): TableMetadata =>
  tableSchema ? { tableName, tableSchema, columns } : { tableName, columns };

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
    const result = run(`SELECT id, name FROM users`, [USERS]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["id", "name"] }],
      unresolvedTableColumns: [],
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. SAME COLUMN NAME IN DIFFERENT SCOPES
  // ─────────────────────────────────────────────────────────────────────────────
  describe("Same column name from different tables in different scopes", () => {
    const ONE = tbl("one", ["id"]);
    const TWO = tbl("two", ["id"]);

    test("unqualified column in main and subquery", () => {
      const sql = `SELECT id, (SELECT max(id) FROM two) as max_id FROM one`;
      const result = run(sql, [ONE, TWO]);
      expect(result).toEqual({
        tableColumns: [
          { table: "one", columns: ["id"] },
          { table: "two", columns: ["id"] },
        ],
        unresolvedTableColumns: [],
      });
    });

    test("unqualified column in subquery only", () => {
      const sql = `SELECT (SELECT max(id) FROM two) as max_id FROM one`;
      const result = run(sql, [ONE, TWO]);
      expect(result).toEqual({
        tableColumns: [{ table: "two", columns: ["id"] }],
        unresolvedTableColumns: [],
      });
    });

    test("unqualified column in main query only", () => {
      const sql = `SELECT id FROM one WHERE id > (SELECT max(id) FROM two)`;
      const result = run(sql, [ONE, TWO]);
      expect(result).toEqual({
        tableColumns: [
          { table: "one", columns: ["id"] },
          { table: "two", columns: ["id"] },
        ],
        unresolvedTableColumns: [],
      });
    });
  });

  test("all columns listed explicitly", () => {
    const result = run(`SELECT id, name, email, status FROM users`, [USERS]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["email", "id", "name", "status"] }],
      unresolvedTableColumns: [],
    });
  });

  test("SELECT DISTINCT — same lineage as plain SELECT", () => {
    const result = run(`SELECT DISTINCT id, name FROM users`, [USERS]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["id", "name"] }],
      unresolvedTableColumns: [],
    });
  });

  test("column in WHERE clause is tracked", () => {
    const result = run(`SELECT id FROM users WHERE status = 'active'`, [USERS]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["id", "status"] }],
      unresolvedTableColumns: [],
    });
  });

  test("arithmetic expression — both operands tracked", () => {
    const result = run(`SELECT price * quantity AS total, discount FROM order_items`, [ORDER_ITEMS]);
    expect(result).toEqual({
      tableColumns: [{ table: "order_items", columns: ["discount", "price", "quantity"] }],
      unresolvedTableColumns: [],
    });
  });

  test("function call — argument columns tracked", () => {
    const result = run(`SELECT UPPER(name), LENGTH(email), id FROM users`, [USERS]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["email", "id", "name"] }],
      unresolvedTableColumns: [],
    });
  });

  test("nested function call — argument columns tracked", () => {
    const result = run(`SELECT COALESCE(NULLIF(name, ''), email) FROM users`, [USERS]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["email", "name"] }],
      unresolvedTableColumns: [],
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. TABLE & COLUMN ALIASES
// ─────────────────────────────────────────────────────────────────────────────
describe("Aliases", () => {
  test("table alias — unqualified columns", () => {
    const result = run(`SELECT id, name FROM users u`, [USERS]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["id", "name"] }],
      unresolvedTableColumns: [],
    });
  });

  test("table alias — qualified columns resolve to source table", () => {
    const result = run(`SELECT u.id, u.name FROM users u WHERE u.status = 'active'`, [USERS]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["id", "name", "status"] }],
      unresolvedTableColumns: [],
    });
  });

  test("column alias does NOT create a new column reference", () => {
    const result = run(`SELECT id AS user_id, name AS display_name FROM users`, [USERS]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["id", "name"] }],
      unresolvedTableColumns: [],
    });
  });

  test("mix of qualified and unqualified refs to the same table", () => {
    const result = run(`SELECT u.id, name FROM users u`, [USERS]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["id", "name"] }],
      unresolvedTableColumns: [],
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. JOINs
// ─────────────────────────────────────────────────────────────────────────────
describe("JOINs", () => {
  test("INNER JOIN with ON", () => {
    const result = run(
      `SELECT u.name, o.amount
             FROM users u
             INNER JOIN orders o ON u.id = o.user_id`,
      [USERS, ORDERS]
    );
    expect(result).toEqual({
      tableColumns: [
        { table: "orders", columns: ["amount", "user_id"] },
        { table: "users", columns: ["id", "name"] },
      ],
      unresolvedTableColumns: [],
    });
  });

  test("LEFT JOIN with ON", () => {
    const result = run(
      `SELECT u.name, o.amount
             FROM users u
             LEFT JOIN orders o ON u.id = o.user_id
             WHERE u.status = 'active'`,
      [USERS, ORDERS]
    );
    expect(result).toEqual({
      tableColumns: [
        { table: "orders", columns: ["amount", "user_id"] },
        { table: "users", columns: ["id", "name", "status"] },
      ],
      unresolvedTableColumns: [],
    });
  });

  test("RIGHT JOIN with ON", () => {
    const result = run(
      `SELECT u.name, o.amount
             FROM users u
             RIGHT JOIN orders o ON u.id = o.user_id`,
      [USERS, ORDERS]
    );
    expect(result).toEqual({
      tableColumns: [
        { table: "orders", columns: ["amount", "user_id"] },
        { table: "users", columns: ["id", "name"] },
      ],
      unresolvedTableColumns: [],
    });
  });

  test("FULL OUTER JOIN with ON", () => {
    const result = run(
      `SELECT u.name, o.amount
             FROM users u
             FULL OUTER JOIN orders o ON u.id = o.user_id`,
      [USERS, ORDERS]
    );
    expect(result).toEqual({
      tableColumns: [
        { table: "orders", columns: ["amount", "user_id"] },
        { table: "users", columns: ["id", "name"] },
      ],
      unresolvedTableColumns: [],
    });
  });

  test("CROSS JOIN — no ON condition", () => {
    const result = run(
      `SELECT u.name, p.name AS product_name
             FROM users u
             CROSS JOIN products p`,
      [USERS, PRODUCTS]
    );
    expect(result).toEqual({
      tableColumns: [
        { table: "products", columns: ["name"] },
        { table: "users", columns: ["name"] },
      ],
      unresolvedTableColumns: [],
    });
  });

  test("three-way JOIN chain", () => {
    const result = run(
      `SELECT u.name, o.amount, p.status
             FROM users u
             JOIN orders o ON u.id = o.user_id
             JOIN payments p ON o.id = p.order_id`,
      [USERS, ORDERS, PAYMENTS]
    );
    expect(result).toEqual({
      tableColumns: [
        { table: "orders", columns: ["amount", "id", "user_id"] },
        { table: "payments", columns: ["order_id", "status"] },
        { table: "users", columns: ["id", "name"] },
      ],
      unresolvedTableColumns: [],
    });
  });

  test("self-join — same table under two aliases", () => {
    const result = run(
      `SELECT a.id, b.name AS manager_name
             FROM users a
             JOIN users b ON a.parent_id = b.id`,
      [USERS]
    );
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["id", "name", "parent_id"] }],
      unresolvedTableColumns: [],
    });
  });

  test("JOIN with compound ON condition (AND)", () => {
    const result = run(
      `SELECT o.id, oi.quantity
             FROM orders o
             JOIN order_items oi ON o.id = oi.order_id AND o.status = 'paid'`,
      [ORDERS, ORDER_ITEMS]
    );
    expect(result).toEqual({
      tableColumns: [
        { table: "order_items", columns: ["order_id", "quantity"] },
        { table: "orders", columns: ["id", "status"] },
      ],
      unresolvedTableColumns: [],
    });
  });

  test("four tables joined — columns from all tracked", () => {
    const result = run(
      `SELECT u.name, o.amount, oi.quantity, p.name AS product_name
             FROM users u
             JOIN orders o ON u.id = o.user_id
             JOIN order_items oi ON o.id = oi.order_id
             JOIN products p ON oi.product_id = p.id`,
      [USERS, ORDERS, ORDER_ITEMS, PRODUCTS]
    );
    expect(result).toEqual({
      tableColumns: [
        { table: "order_items", columns: ["order_id", "product_id", "quantity"] },
        { table: "orders", columns: ["amount", "id", "user_id"] },
        { table: "products", columns: ["id", "name"] },
        { table: "users", columns: ["id", "name"] },
      ],
      unresolvedTableColumns: [],
    });
  });

  // Merged: JOIN USING — SELECT columns and using-column tracked on both joined tables
  test("JOIN USING — columns tracked on both joined tables", () => {
    const result = run(`SELECT u.name, o.amount FROM users u JOIN orders o USING (id)`, [USERS, ORDERS]);
    expect(result).toEqual({
      tableColumns: [
        { table: "orders", columns: ["amount", "id"] },
        { table: "users", columns: ["id", "name"] },
      ],
      unresolvedTableColumns: [],
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. FILTERING — WHERE / GROUP BY / HAVING / ORDER BY
// ─────────────────────────────────────────────────────────────────────────────
describe("Filtering & aggregation", () => {
  test("WHERE with AND / OR", () => {
    const result = run(`SELECT id FROM users WHERE status = 'active' AND (department = 'eng' OR salary > 100000)`, [
      USERS,
    ]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["department", "id", "salary", "status"] }],
      unresolvedTableColumns: [],
    });
  });

  test("WHERE with BETWEEN", () => {
    const result = run(`SELECT id FROM orders WHERE created_at BETWEEN '2023-01-01' AND '2023-12-31'`, [ORDERS]);
    expect(result).toEqual({
      tableColumns: [{ table: "orders", columns: ["created_at", "id"] }],
      unresolvedTableColumns: [],
    });
  });

  test("WHERE with LIKE", () => {
    const result = run(`SELECT id FROM users WHERE name LIKE 'A%'`, [USERS]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["id", "name"] }],
      unresolvedTableColumns: [],
    });
  });

  test("WHERE with IN (literal list)", () => {
    const result = run(`SELECT name FROM users WHERE status IN ('active', 'pending')`, [USERS]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["name", "status"] }],
      unresolvedTableColumns: [],
    });
  });

  test("WHERE IS NULL / IS NOT NULL", () => {
    const result = run(`SELECT id FROM users WHERE email IS NOT NULL AND salary IS NULL`, [USERS]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["email", "id", "salary"] }],
      unresolvedTableColumns: [],
    });
  });

  test("GROUP BY — grouped column tracked", () => {
    const result = run(`SELECT user_id, COUNT(*) FROM orders GROUP BY user_id`, [ORDERS]);
    expect(result).toEqual({
      tableColumns: [{ table: "orders", columns: ["user_id"] }],
      unresolvedTableColumns: [],
    });
  });

  test("GROUP BY multiple columns", () => {
    const result = run(`SELECT user_id, status, SUM(amount) FROM orders GROUP BY user_id, status`, [ORDERS]);
    expect(result).toEqual({
      tableColumns: [{ table: "orders", columns: ["amount", "status", "user_id"] }],
      unresolvedTableColumns: [],
    });
  });

  test("HAVING — column in HAVING tracked", () => {
    const result = run(
      `SELECT user_id, SUM(amount) as total
             FROM orders
             GROUP BY user_id
             HAVING SUM(amount) > 500`,
      [ORDERS]
    );
    expect(result).toEqual({
      tableColumns: [{ table: "orders", columns: ["amount", "user_id"] }],
      unresolvedTableColumns: [],
    });
  });

  test("ORDER BY — column in ORDER BY tracked", () => {
    const result = run(`SELECT id, name FROM users ORDER BY name DESC`, [USERS]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["id", "name"] }],
      unresolvedTableColumns: [],
    });
  });

  test("ORDER BY column not in SELECT", () => {
    const result = run(`SELECT id FROM users ORDER BY created_at DESC`, [tbl("users", ["id", "name", "created_at"])]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["created_at", "id"] }],
      unresolvedTableColumns: [],
    });
  });

  test("ORDER BY ordinal — no extra column tracked", () => {
    // ORDER BY 1 is an ordinal; no column reference is emitted.
    const result = run(`SELECT id, name FROM users ORDER BY 1`, [USERS]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["id", "name"] }],
      unresolvedTableColumns: [],
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. CASE EXPRESSIONS
// ─────────────────────────────────────────────────────────────────────────────
describe("CASE expressions", () => {
  test("simple CASE WHEN THEN ELSE — all branch columns tracked", () => {
    const result = run(
      `SELECT CASE WHEN status = 'active' THEN name ELSE email END AS display
             FROM users`,
      [USERS]
    );
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["email", "name", "status"] }],
      unresolvedTableColumns: [],
    });
  });

  test("searched CASE with multiple WHEN branches", () => {
    const result = run(
      `SELECT id,
                    CASE
                        WHEN salary > 100000 THEN 'senior'
                        WHEN salary > 50000 THEN 'mid'
                        ELSE 'junior'
                    END AS level
             FROM employees`,
      [EMPLOYEES]
    );
    expect(result).toEqual({
      tableColumns: [{ table: "employees", columns: ["id", "salary"] }],
      unresolvedTableColumns: [],
    });
  });

  test("CASE in WHERE clause", () => {
    const result = run(`SELECT id FROM users WHERE CASE WHEN department = 'eng' THEN salary ELSE 0 END > 80000`, [
      USERS,
    ]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["department", "id", "salary"] }],
      unresolvedTableColumns: [],
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. SELECT * EXPANSION
// ─────────────────────────────────────────────────────────────────────────────
describe("Star expansion", () => {
  test("bare * from single table expands to all metadata columns", () => {
    const result = run(`SELECT * FROM users`, [USERS]);
    expect(result).toEqual({
      tableColumns: [
        {
          table: "users",
          columns: ["department", "email", "id", "name", "parent_id", "salary", "status"],
        },
      ],
      unresolvedTableColumns: [],
    });
  });

  test("bare * from JOIN expands all columns from all tables", () => {
    const result = run(`SELECT * FROM users u JOIN orders o ON u.id = o.user_id`, [USERS, ORDERS]);
    expect(result).toEqual(
      sorted({
        tableColumns: [
          { table: "orders", columns: ORDERS.columns },
          { table: "users", columns: USERS.columns },
        ],
        unresolvedTableColumns: [],
      })
    );
  });

  test("table.* — only that table's columns expanded", () => {
    const result = run(`SELECT u.*, o.amount FROM users u JOIN orders o ON u.id = o.user_id`, [USERS, ORDERS]);
    expect(result).toEqual(
      sorted({
        tableColumns: [
          { table: "orders", columns: ["amount", "user_id"] },
          { table: "users", columns: USERS.columns },
        ],
        unresolvedTableColumns: [],
      })
    );
  });

  test("* with no metadata → nothing reported (no columns to expand)", () => {
    const result = run(`SELECT * FROM unknown_table`);
    expect(result).toEqual({ tableColumns: [], unresolvedTableColumns: [{ table: "unknown_table", column: "*" }] });
  });

  test("table.* where table alias has no metadata columns — silently empty (not unresolved)", () => {
    const result = run(`SELECT u.* FROM unknown_table u`);
    expect(result).toEqual({
      tableColumns: [],
      unresolvedTableColumns: [{ table: "unknown_table", column: "*" }],
    });
  });

  test("table.* on truly unknown alias (never in FROM) → unresolved", () => {
    const result = run(`SELECT ghost.* FROM users u`, [USERS]);
    expect(result).toEqual({
      tableColumns: [],
      unresolvedTableColumns: [{ column: "ghost.*" }],
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. SUBQUERIES
// ─────────────────────────────────────────────────────────────────────────────
describe("Subqueries", () => {
  test("derived table in FROM — inner columns tracked on source table", () => {
    const result = run(
      `SELECT sub.id, sub.name
             FROM (SELECT id, name FROM users WHERE status = 'active') sub`,
      [USERS]
    );
    expect(result.tableColumns.find((t) => t.table === "users")).toEqual({
      table: "users",
      columns: ["id", "name", "status"],
    });
  });

  test("non-correlated subquery in WHERE (IN)", () => {
    const result = run(
      `SELECT id, name
             FROM users
             WHERE id IN (SELECT user_id FROM orders WHERE amount > 100)`,
      [USERS, ORDERS]
    );
    expect(result).toEqual({
      tableColumns: [
        { table: "orders", columns: ["amount", "user_id"] },
        { table: "users", columns: ["id", "name"] },
      ],
      unresolvedTableColumns: [],
    });
  });

  test("correlated subquery in WHERE (EXISTS)", () => {
    const result = run(
      `SELECT u.id, u.name
             FROM users u
             WHERE EXISTS (
                 SELECT 1 FROM orders o WHERE o.user_id = u.id
             )`,
      [USERS, ORDERS]
    );
    expect(result.tableColumns.find((t) => t.table === "users")).toEqual({
      table: "users",
      columns: ["id", "name"],
    });
    expect(result.tableColumns.find((t) => t.table === "orders")).toEqual({
      table: "orders",
      columns: ["user_id"],
    });
  });

  test("scalar subquery in SELECT", () => {
    const result = run(
      `SELECT u.id,
                    u.name,
                    (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count
             FROM users u`,
      [USERS, ORDERS]
    );
    expect(result.tableColumns.find((t) => t.table === "users")).toEqual({
      table: "users",
      columns: ["id", "name"],
    });
    expect(result.tableColumns.find((t) => t.table === "orders")).toEqual({
      table: "orders",
      columns: ["user_id"],
    });
  });

  test("doubly nested subquery — all levels tracked", () => {
    const result = run(
      `SELECT outer_sub.name
             FROM (
                 SELECT inner_sub.name
                 FROM (
                     SELECT name FROM users
                 ) inner_sub
             ) outer_sub`,
      [USERS]
    );
    expect(result.tableColumns.find((t) => t.table === "users")).toEqual({
      table: "users",
      columns: ["name"],
    });
  });

  test("derived table with column alias list", () => {
    const result = run(
      `SELECT sub.uid, sub.uname
             FROM (SELECT id, name FROM users) sub (uid, uname)`,
      [USERS]
    );
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toContain("id");
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toContain("name");
  });

  test("LATERAL subquery in FROM", () => {
    const result = run(
      `SELECT u.id, l.tag
             FROM users u,
             LATERAL (SELECT tag FROM user_tags WHERE user_id = u.id) l`,
      [USERS, USER_TAGS]
    );
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toContain("id");
    expect(result.tableColumns.find((t) => t.table === "user_tags")?.columns).toContain("tag");
    expect(result.tableColumns.find((t) => t.table === "user_tags")?.columns).toContain("user_id");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. CTEs (WITH)
// ─────────────────────────────────────────────────────────────────────────────
describe("CTEs (WITH)", () => {
  test("simple single CTE — body and outer query both tracked", () => {
    const result = run(
      `WITH active_users AS (
                 SELECT id, name FROM users WHERE status = 'active'
             )
             SELECT id, name FROM active_users`,
      [USERS]
    );
    expect(result.tableColumns.find((t) => t.table === "users")).toEqual({
      table: "users",
      columns: ["id", "name", "status"],
    });
    expect(result.tableColumns.find((t) => t.table === "active_users")).toBeUndefined();
  });

  test("multiple independent CTEs", () => {
    const result = run(
      `WITH
                au AS (SELECT id, name FROM users WHERE status = 'active'),
                ro AS (SELECT id, user_id FROM orders WHERE amount > 0)
             SELECT au.name, ro.id
             FROM au
             JOIN ro ON au.id = ro.user_id`,
      [USERS, ORDERS]
    );
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toEqual(["id", "name", "status"]);
    expect(result.tableColumns.find((t) => t.table === "orders")?.columns).toEqual(["amount", "id", "user_id"]);
  });

  test("chained CTE — second CTE references first CTE", () => {
    const result = run(
      `WITH
                base AS (SELECT id, name FROM users),
                filtered AS (SELECT id, name FROM base WHERE id > 10)
             SELECT id FROM filtered`,
      [USERS]
    );
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toEqual(["id", "name"]);
    // CTE names must NOT appear in the output — only real tables/views do
    expect(result.tableColumns.find((t) => t.table === "base")).toBeUndefined();
    expect(result.tableColumns.find((t) => t.table === "filtered")).toBeUndefined();
  });

  test("CTE with explicit column alias list", () => {
    const result = run(
      `WITH summary(uid, total_amount) AS (
                 SELECT user_id, SUM(amount) FROM orders GROUP BY user_id
             )
             SELECT uid, total_amount FROM summary`,
      [ORDERS]
    );
    expect(result.tableColumns.find((t) => t.table === "orders")?.columns).toContain("amount");
    expect(result.tableColumns.find((t) => t.table === "orders")?.columns).toContain("user_id");
    // CTE names must NOT appear in the output — only real tables/views do
    expect(result.tableColumns.find((t) => t.table === "summary")).toBeUndefined();
  });

  test("CTE used multiple times in the same query", () => {
    const result = run(
      `WITH active AS (SELECT id, name FROM users WHERE status = 'active')
             SELECT a.name AS a_name, b.name AS b_name
             FROM active a
             JOIN active b ON a.id <> b.id`,
      [USERS]
    );
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toEqual(["id", "name", "status"]);
  });

  test("CTE with JOIN inside body", () => {
    const result = run(
      `WITH rich_users AS (
                 SELECT u.id, u.name, SUM(o.amount) as total
                 FROM users u
                 JOIN orders o ON u.id = o.user_id
                 GROUP BY u.id, u.name
             )
             SELECT id, name, total FROM rich_users WHERE total > 1000`,
      [USERS, ORDERS]
    );
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toEqual(["id", "name"]);
    expect(result.tableColumns.find((t) => t.table === "orders")?.columns).toEqual(["amount", "user_id"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. SET OPERATIONS (UNION / INTERSECT / EXCEPT)
// ─────────────────────────────────────────────────────────────────────────────
describe("Set operations", () => {
  test("UNION — both sides tracked independently", () => {
    const result = run(
      `SELECT id, name FROM users
             UNION
             SELECT id, name FROM employees`,
      [USERS, EMPLOYEES]
    );
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toEqual(["id", "name"]);
    expect(result.tableColumns.find((t) => t.table === "employees")?.columns).toEqual(["id", "name"]);
  });

  test("UNION ALL — same as UNION for lineage purposes", () => {
    const result = run(
      `SELECT id, name FROM users
             UNION ALL
             SELECT id, name FROM employees`,
      [USERS, EMPLOYEES]
    );
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toEqual(["id", "name"]);
    expect(result.tableColumns.find((t) => t.table === "employees")?.columns).toEqual(["id", "name"]);
  });

  test("INTERSECT", () => {
    const result = run(
      `SELECT id FROM users WHERE status = 'active'
             INTERSECT
             SELECT user_id FROM orders`,
      [USERS, ORDERS]
    );
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toEqual(["id", "status"]);
    expect(result.tableColumns.find((t) => t.table === "orders")?.columns).toEqual(["user_id"]);
  });

  test("EXCEPT", () => {
    const result = run(
      `SELECT id FROM users
             EXCEPT
             SELECT user_id FROM orders`,
      [USERS, ORDERS]
    );
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toEqual(["id"]);
    expect(result.tableColumns.find((t) => t.table === "orders")?.columns).toEqual(["user_id"]);
  });

  test("three-way UNION — all three sides tracked", () => {
    const result = run(
      `SELECT id, name FROM users
             UNION
             SELECT id, name FROM employees
             UNION
             SELECT id, name AS name FROM categories`,
      [USERS, EMPLOYEES, CATEGORIES]
    );
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toEqual(["id", "name"]);
    expect(result.tableColumns.find((t) => t.table === "employees")?.columns).toEqual(["id", "name"]);
    expect(result.tableColumns.find((t) => t.table === "categories")?.columns).toEqual(["id", "name"]);
  });

  test("UNION with WHERE on one side", () => {
    const result = run(
      `SELECT id, name FROM users WHERE status = 'active'
             UNION ALL
             SELECT id, name FROM employees WHERE department = 'eng'`,
      [USERS, EMPLOYEES]
    );
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toEqual(["id", "name", "status"]);
    expect(result.tableColumns.find((t) => t.table === "employees")?.columns).toEqual(["department", "id", "name"]);
  });

  test("CTE + UNION combination", () => {
    const result = run(
      `WITH base AS (SELECT id, name FROM users WHERE status = 'active')
             SELECT id, name FROM base
             UNION ALL
             SELECT id, name FROM employees`,
      [USERS, EMPLOYEES]
    );
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toEqual(["id", "name", "status"]);
    expect(result.tableColumns.find((t) => t.table === "employees")?.columns).toEqual(["id", "name"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. WINDOW FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
describe("Window functions", () => {
  test("ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)", () => {
    const result = run(
      `SELECT id, name, ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary) AS rn
             FROM employees`,
      [EMPLOYEES]
    );
    expect(result).toEqual({
      tableColumns: [{ table: "employees", columns: ["department", "id", "name", "salary"] }],
      unresolvedTableColumns: [],
    });
  });

  test("aggregate window function SUM OVER", () => {
    const result = run(
      `SELECT id, amount, SUM(amount) OVER (PARTITION BY user_id ORDER BY created_at) AS running_total
             FROM orders`,
      [ORDERS]
    );
    expect(result).toEqual({
      tableColumns: [{ table: "orders", columns: ["amount", "created_at", "id", "user_id"] }],
      unresolvedTableColumns: [],
    });
  });

  test("multiple window functions with different OVER clauses", () => {
    const result = run(
      `SELECT
                 id,
                 salary,
                 ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rn,
                 RANK() OVER (ORDER BY hire_date) AS hire_rank
             FROM employees`,
      [EMPLOYEES]
    );
    expect(result).toEqual({
      tableColumns: [{ table: "employees", columns: ["department", "hire_date", "id", "salary"] }],
      unresolvedTableColumns: [],
    });
  });

  test("LAG / LEAD — referenced columns tracked", () => {
    const result = run(
      `SELECT id, amount, LAG(amount, 1) OVER (PARTITION BY user_id ORDER BY created_at) AS prev_amount
             FROM orders`,
      [ORDERS]
    );
    expect(result).toEqual({
      tableColumns: [{ table: "orders", columns: ["amount", "created_at", "id", "user_id"] }],
      unresolvedTableColumns: [],
    });
  });

  test("named WINDOW clause", () => {
    const result = run(
      `SELECT
                 id,
                 salary,
                 SUM(salary) OVER w AS dept_total
             FROM employees
             WINDOW w AS (PARTITION BY department ORDER BY hire_date)`,
      [EMPLOYEES]
    );
    expect(result).toEqual({
      tableColumns: [{ table: "employees", columns: ["department", "hire_date", "id", "salary"] }],
      unresolvedTableColumns: [],
    });
  });

  test("window function inside CTE", () => {
    const result = run(
      `WITH ranked AS (
                 SELECT id, name, salary,
                        RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank
                 FROM employees
             )
             SELECT id, name FROM ranked WHERE dept_rank = 1`,
      [EMPLOYEES]
    );
    expect(result.tableColumns.find((t) => t.table === "employees")?.columns).toContain("salary");
    expect(result.tableColumns.find((t) => t.table === "employees")?.columns).toContain("department");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. SCHEMA-QUALIFIED & IDENTIFIER HANDLING
// ─────────────────────────────────────────────────────────────────────────────
describe("Identifier handling", () => {
  test("schema-qualified table — display name includes schema", () => {
    const result = run(`SELECT id, name FROM myschema.users`, [tbl("users", ["id", "name", "email"], "myschema")]);
    expect(result).toEqual({
      tableColumns: [{ table: "myschema.users", columns: ["id", "name"] }],
      unresolvedTableColumns: [],
    });
  });

  test("schema-qualified table with alias", () => {
    const result = run(`SELECT u.id, u.email FROM myschema.users u`, [
      tbl("users", ["id", "name", "email"], "myschema"),
    ]);
    expect(result).toEqual({
      tableColumns: [{ table: "myschema.users", columns: ["email", "id"] }],
      unresolvedTableColumns: [],
    });
  });

  test("case-insensitive: SQL in UPPER, metadata in lower", () => {
    const result = run(`SELECT ID, NAME FROM USERS`, [USERS]);
    // Should resolve to original casing from metadata
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["id", "name"] }],
      unresolvedTableColumns: [],
    });
  });

  test("case-insensitive: SQL in lower, metadata in UPPER (mixed casing in metadata)", () => {
    const result = run(`SELECT id, name FROM users`, [tbl("users", ["ID", "Name", "Email"])]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["ID", "Name"] }],
      unresolvedTableColumns: [],
    });
  });

  test('double-quoted identifier — "First Name" with space', () => {
    const result = run(`SELECT "id", "First Name" FROM users`, [tbl("users", ["id", "First Name"])]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["First Name", "id"] }],
      unresolvedTableColumns: [],
    });
  });

  test("double-quoted identifier containing escaped double quote", () => {
    const result = run(`SELECT "say ""hello""" FROM users`, [tbl("users", ['say "hello"'])]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ['say "hello"'] }],
      unresolvedTableColumns: [],
    });
  });

  test("column reference using table name (not alias) still resolves", () => {
    const result = run(`SELECT users.id, users.name FROM users`, [USERS]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["id", "name"] }],
      unresolvedTableColumns: [],
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. UNRESOLVED COLUMNS
// ─────────────────────────────────────────────────────────────────────────────
describe("Unresolved columns", () => {
  test("no metadata at all — unqualified columns are unresolved", () => {
    const result = run(`SELECT id, name FROM users`);
    expect(result).toEqual({
      tableColumns: [],
      unresolvedTableColumns: [{ column: "id" }, { column: "name" }],
    });
  });

  test("column not in metadata — reported as unresolved", () => {
    const result = run(`SELECT id, unknown_col FROM users`, [tbl("users", ["id", "name"])]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["id"] }],
      unresolvedTableColumns: [{ column: "unknown_col" }],
    });
  });

  test("qualified ref to unknown table alias — unresolved as dotted path", () => {
    const result = run(`SELECT x.foo FROM users u`, [USERS]);
    expect(result.unresolvedTableColumns).toContainEqual({ column: "x.foo" });
  });

  test("qualified column with known table but unknown column — attributed to table as unresolved", () => {
    // Column is not in metadata: attributed to the known table in unresolvedTableColumns.
    const result = run(`SELECT u.ghost_column FROM users u`, [USERS]);
    expect(result.unresolvedTableColumns).toContainEqual({ table: "users", column: "ghost_column" });
    expect(result.tableColumns.find((t) => t.table === "users")).toBeUndefined();
  });

  test("mixed: some columns resolve, some do not", () => {
    const result = run(`SELECT id, name, mystery FROM users`, [tbl("users", ["id", "name"])]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["id", "name"] }],
      unresolvedTableColumns: [{ column: "mystery" }],
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. STRUCT FIELD ACCESS
// ─────────────────────────────────────────────────────────────────────────────
// In Trino, struct fields are accessed with dot notation: column.field
// The column name (not the field name) should be recorded as the lineage source.
//
// Fixture: users has a "profile" column (conceptually a struct with fields
//          "age", "address"; "address" is itself a struct with field "street").
// ─────────────────────────────────────────────────────────────────────────────
describe("Struct field access", () => {
  const USERS_STRUCT = tbl("users", ["id", "name", "profile"]);

  // ── Patterns that work correctly ────────────────────────────────────────

  test("column.field — bare column with one struct field: records the column", () => {
    const result = run(`SELECT profile.age FROM users`, [USERS_STRUCT]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["profile"] }],
      unresolvedTableColumns: [],
    });
  });

  test("column.field.field — bare column with nested struct field: records the column", () => {
    const result = run(`SELECT profile.address.street FROM users`, [USERS_STRUCT]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["profile"] }],
      unresolvedTableColumns: [],
    });
  });

  test("table.column.field — alias-qualified struct field: records the column on the table", () => {
    const result = run(`SELECT u.profile.age FROM users u`, [USERS_STRUCT]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["profile"] }],
      unresolvedTableColumns: [],
    });
  });

  test("table.column.field.field — alias-qualified nested struct field: records the column", () => {
    const result = run(`SELECT u.profile.address.street FROM users u`, [USERS_STRUCT]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["profile"] }],
      unresolvedTableColumns: [],
    });
  });

  test("schema.table.column.field — fully-qualified struct field: records the column", () => {
    const SCHEMA_USERS = tbl("users", ["id", "name", "profile"], "myschema");
    const result = run(`SELECT myschema.users.profile.age FROM myschema.users`, [SCHEMA_USERS]);
    expect(result).toEqual({
      tableColumns: [{ table: "myschema.users", columns: ["profile"] }],
      unresolvedTableColumns: [],
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. SAME-NAME COLUMNS FROM MULTIPLE TABLES
// ─────────────────────────────────────────────────────────────────────────────
// Both USERS and ORDERS have columns "id" and "status".
// USERS, ORDERS, and PAYMENTS all have "id" and "status".
//
// Desired lineage behaviour for an ambiguous unqualified reference:
//   record the column on EVERY in-scope table that owns it.
//
// Current behaviour of tryResolveAndRecordUnqualifiedColumn:
//   iterate scope tables in insertion order, return on the FIRST hit →
//   only one table gets credit, the rest are silently ignored.
//   This is a bug for lineage purposes.
// ─────────────────────────────────────────────────────────────────────────────
describe("Same-name columns from multiple tables", () => {
  // ── Qualified references — work correctly ────────────────────────────────

  test("qualified same-name column from each table is tracked on the correct table", () => {
    // u.id → users.id, o.id → orders.id — no ambiguity, both qualify
    const result = run(`SELECT u.id, o.id FROM users u JOIN orders o ON u.id = o.user_id`, [USERS, ORDERS]);
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toContain("id");
    expect(result.tableColumns.find((t) => t.table === "orders")?.columns).toContain("id");
  });

  test("qualified same-name 'status' from both tables tracked independently", () => {
    const result = run(
      `SELECT u.status, o.status
             FROM users u
             JOIN orders o ON u.id = o.user_id`,
      [USERS, ORDERS]
    );
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toContain("status");
    expect(result.tableColumns.find((t) => t.table === "orders")?.columns).toContain("status");
  });

  test("qualified same-name column across three tables", () => {
    const result = run(
      `SELECT u.id, o.id, p.id
             FROM users u
             JOIN orders o ON u.id = o.user_id
             JOIN payments p ON o.id = p.order_id`,
      [USERS, ORDERS, PAYMENTS]
    );
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toContain("id");
    expect(result.tableColumns.find((t) => t.table === "orders")?.columns).toContain("id");
    expect(result.tableColumns.find((t) => t.table === "payments")?.columns).toContain("id");
  });

  test("qualified same-name column in WHERE ON tracked on the correct tables", () => {
    // ON condition uses qualified refs; already covered by join tests, but
    // this confirms same-name columns in ON are correctly attributed.
    const result = run(`SELECT u.name FROM users u JOIN orders o ON u.id = o.user_id WHERE o.status = 'paid'`, [
      USERS,
      ORDERS,
    ]);
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toContain("id");
    expect(result.tableColumns.find((t) => t.table === "orders")?.columns).toContain("user_id");
    expect(result.tableColumns.find((t) => t.table === "orders")?.columns).toContain("status");
    // users.status should NOT be recorded (the WHERE ref was qualified as o.status)
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).not.toContain("status");
  });

  // ── Unqualified references — Trino rejects these as ambiguous ──────────
  //
  // In Trino, writing an unqualified column name that exists in two or more
  // in-scope tables is a hard planning error:
  //   "SemanticException: Column 'id' is ambiguous"
  //
  // The lineage tool mirrors this: when more than one distinct source table in
  // the same scope owns the column, the reference is reported as unresolved.
  test("unqualified 'id' in SELECT — Trino ambiguity: id in SELECT is unresolved but ON clause still adds it to users (edge case)", () => {
    // Trino: SemanticException: Column 'id' is ambiguous (for the bare SELECT id)
    const result = run(`SELECT id FROM users u JOIN orders o ON u.id = o.user_id`, [USERS, ORDERS]);
    expect(result).toEqual(
      sorted({
        tableColumns: [
          { table: "orders", columns: ["user_id"] },
          { table: "users", columns: ["id"] },
        ],
        unresolvedTableColumns: [{ column: "id" }],
      })
    );
  });

  test("unqualified 'status' in SELECT — Trino ambiguity error: reported as unresolved", () => {
    // Trino: SemanticException: Column 'status' is ambiguous
    const result = run(`SELECT status FROM users u JOIN orders o ON u.id = o.user_id`, [USERS, ORDERS]);
    expect(result.unresolvedTableColumns).toContainEqual({ column: "status" });
    expect(result.tableColumns.find((t) => t.table === "users")?.columns ?? []).not.toContain("status");
    expect(result.tableColumns.find((t) => t.table === "orders")?.columns ?? []).not.toContain("status");
  });

  test("unqualified 'id' in WHERE — Trino ambiguity error: reported as unresolved", () => {
    // Trino: SemanticException: Column 'id' is ambiguous
    const result = run(`SELECT u.name, o.amount FROM users u JOIN orders o ON u.id = o.user_id WHERE id > 5`, [
      USERS,
      ORDERS,
    ]);
    expect(result.unresolvedTableColumns).toContainEqual({ column: "id" });
  });

  test("unqualified 'id' in GROUP BY — Trino ambiguity error: reported as unresolved", () => {
    // Trino: SemanticException: Column 'id' is ambiguous
    const result = run(`SELECT id, COUNT(*) FROM users u JOIN orders o ON u.id = o.user_id GROUP BY id`, [
      USERS,
      ORDERS,
    ]);
    expect(result.unresolvedTableColumns).toContainEqual({ column: "id" });
  });

  test("unqualified shared column across three tables — Trino ambiguity error: reported as unresolved", () => {
    // Trino: SemanticException: Column 'id' is ambiguous (and 'status')
    const result = run(
      `SELECT id, status FROM users u JOIN orders o ON u.id = o.user_id JOIN payments p ON o.id = p.order_id`,
      [USERS, ORDERS, PAYMENTS]
    );
    expect(result.unresolvedTableColumns).toContainEqual({ column: "id" });
    expect(result.unresolvedTableColumns).toContainEqual({ column: "status" });
  });

  // ── Unqualified references — unambiguous (column is unique to one table) ──

  test("unqualified 'user_id' is unique to orders — resolves correctly even when joined with users", () => {
    // Only orders has user_id; no ambiguity even though joined.
    const result = run(`SELECT user_id FROM users u JOIN orders o ON u.id = o.user_id`, [USERS, ORDERS]);
    expect(result.tableColumns.find((t) => t.table === "orders")?.columns).toContain("user_id");
    expect(result.tableColumns.find((t) => t.table === "users")?.columns ?? []).not.toContain("user_id");
  });

  test("unqualified column unique to second table — correctly skips first table and finds it in second", () => {
    // orders is joined second; 'amount' only exists in orders
    const result = run(`SELECT amount FROM users u JOIN orders o ON u.id = o.user_id`, [USERS, ORDERS]);
    expect(result.tableColumns.find((t) => t.table === "orders")?.columns).toContain("amount");
    expect(result.tableColumns.find((t) => t.table === "users")?.columns ?? []).not.toContain("amount");
  });

  test("mix of ambiguous and unambiguous unqualified columns in one query", () => {
    // 'amount' is unambiguous (orders only); 'name' is unambiguous (users only).
    // Both should resolve correctly regardless of ordering.
    const result = run(`SELECT name, amount FROM users u JOIN orders o ON u.id = o.user_id`, [USERS, ORDERS]);
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toContain("name");
    expect(result.tableColumns.find((t) => t.table === "orders")?.columns).toContain("amount");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. COMPLEX / REALISTIC QUERIES
// ─────────────────────────────────────────────────────────────────────────────
describe("Complex realistic queries", () => {
  test("dashboard summary: CTE + JOIN + window + GROUP BY", () => {
    const result = run(
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
    expect(result.tableColumns.find((t) => t.table === "orders")?.columns).toEqual(["created_at", "id", "user_id"]);
    expect(result.tableColumns.find((t) => t.table === "order_items")?.columns).toEqual([
      "order_id",
      "price",
      "quantity",
    ]);
  });

  test("user cohort analysis: multiple CTEs chained with set operation", () => {
    const result = run(
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
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toEqual(["id", "salary", "status"]);
    expect(result.tableColumns.find((t) => t.table === "orders")?.columns).toEqual(["amount", "user_id"]);
  });

  test("hierarchical self-join with CTE", () => {
    const result = run(
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
    expect(result.tableColumns.find((t) => t.table === "categories")?.columns).toContain("id");
    expect(result.tableColumns.find((t) => t.table === "categories")?.columns).toContain("name");
    expect(result.tableColumns.find((t) => t.table === "categories")?.columns).toContain("parent_id");
  });

  test("deeply nested correlated subquery", () => {
    const result = run(
      `SELECT u.id, u.name
             FROM users u
             WHERE u.salary > (
                 SELECT AVG(salary)
                 FROM employees e
                 WHERE e.department = u.department
             )`,
      [USERS, EMPLOYEES]
    );
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toEqual([
      "department",
      "id",
      "name",
      "salary",
    ]);
    expect(result.tableColumns.find((t) => t.table === "employees")?.columns).toEqual(["department", "salary"]);
  });

  test("CASE with subquery in THEN branch", () => {
    const result = run(
      `SELECT u.id,
                    CASE
                        WHEN u.status = 'active'
                        THEN (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id)
                        ELSE 0
                    END AS order_count
             FROM users u`,
      [USERS, ORDERS]
    );
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toContain("status");
    expect(result.tableColumns.find((t) => t.table === "orders")?.columns).toContain("user_id");
  });

  test("UPDATE-style SELECT (Trino): qualified multi-table subquery", () => {
    const result = run(
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
    expect(result.tableColumns.find((t) => t.table === "payments")?.columns).toEqual(["id", "order_id", "status"]);
    expect(result.tableColumns.find((t) => t.table === "orders")?.columns).toEqual(["amount", "id", "user_id"]);
    expect(result.tableColumns.find((t) => t.table === "users")?.columns).toEqual(["id", "status"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 16. UNNEST & TABLE() TABLE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
describe("UNNEST and TABLE() table functions", () => {
  test("UNNEST — array column reference is tracked on the source table", () => {
    const result = run(
      `SELECT u.id, t.tag
       FROM users u
       CROSS JOIN UNNEST(u.tags) AS t(tag)`,
      [tbl("users", ["id", "tags"])]
    );
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["id", "tags"] }],
      unresolvedTableColumns: [],
    });
  });

  test("UNNEST — t.tag from derived alias is silently dropped (not unresolved)", () => {
    const result = run(
      `SELECT t.tag
       FROM events e
       CROSS JOIN UNNEST(e.tag_array) AS t(tag)`,
      [tbl("events", ["id", "tag_array"])]
    );
    expect(result).toEqual({
      tableColumns: [{ table: "events", columns: ["tag_array"] }],
      unresolvedTableColumns: [],
    });
  });

  test("UNNEST WITH ORDINALITY — ordinal column is from derived alias, array col tracked", () => {
    const result = run(
      `SELECT e.id, t.tag, t.pos
       FROM events e
       CROSS JOIN UNNEST(e.tag_array) WITH ORDINALITY AS t(tag, pos)`,
      [tbl("events", ["id", "tag_array"])]
    );
    // t.tag / t.pos are qualified refs to the UNNEST derived alias → silently dropped
    expect(result).toEqual({
      tableColumns: [{ table: "events", columns: ["id", "tag_array"] }],
      unresolvedTableColumns: [],
    });
  });

  test("UNNEST with multiple array columns", () => {
    const result = run(
      `SELECT t.a, t.b
       FROM src
       CROSS JOIN UNNEST(src.xs, src.ys) AS t(a, b)`,
      [tbl("src", ["xs", "ys"])]
    );
    // t.a / t.b are qualified refs to the UNNEST derived alias → silently dropped
    expect(result).toEqual({
      tableColumns: [{ table: "src", columns: ["xs", "ys"] }],
      unresolvedTableColumns: [],
    });
  });

  test("TABLE() invocation with no TABLE(tbl) arg — unaliased result columns are unresolved", () => {
    // TABLE(my_catalog.my_table()) has no argument table and no alias,
    // so the column 'id' in SELECT cannot be attributed.
    const result = run(`SELECT id FROM TABLE(my_catalog.my_table())`);
    expect(result).toEqual({
      tableColumns: [],
      unresolvedTableColumns: [{ column: "id" }],
    });
  });

  test("TABLE() with TABLE(tbl) argument — PARTITION BY column tracked on argument table", () => {
    const result = run(
      `SELECT res.val
       FROM TABLE(my_func(TABLE(source_table) PARTITION BY id)) AS res(val)`,
      [tbl("source_table", ["id", "val"])]
    );
    // PARTITION BY id → source_table.id; SELECT res.val → derived, dropped
    expect(result).toEqual({
      tableColumns: [{ table: "source_table", columns: ["id"] }],
      unresolvedTableColumns: [],
    });
  });

  test("TABLE() with TABLE(tbl) argument — ORDER BY column tracked on argument table", () => {
    const result = run(
      `SELECT *
       FROM TABLE(my_func(TABLE(fact_table) ORDER BY created_at)) AS r(v)`,
      [tbl("fact_table", ["created_at", "amount"])]
    );
    expect(result).toEqual({
      tableColumns: [{ table: "fact_table", columns: ["created_at"] }],
      unresolvedTableColumns: [],
    });
  });

  test("TABLE() with multiple TABLE() arguments — columns tracked on respective tables", () => {
    const result = run(
      `SELECT *
       FROM TABLE(my_join_func(
         TABLE(left_table)  PARTITION BY lid,
         TABLE(right_table) PARTITION BY rid
       )) AS r(v)`,
      [tbl("left_table", ["lid", "lval"]), tbl("right_table", ["rid", "rval"])]
    );
    expect(result).toEqual({
      tableColumns: [
        { table: "left_table", columns: ["lid"] },
        { table: "right_table", columns: ["rid"] },
      ],
      unresolvedTableColumns: [],
    });
  });

  test("TABLE() with TABLE(query) argument — inner query columns tracked normally", () => {
    const result = run(
      `SELECT *
       FROM TABLE(my_func(TABLE(SELECT id, amount FROM orders WHERE status = 'pending'))) AS r(v)`,
      [tbl("orders", ["id", "amount", "status"])]
    );
    expect(result).toEqual({
      tableColumns: [{ table: "orders", columns: ["amount", "id", "status"] }],
      unresolvedTableColumns: [],
    });
  });

  test("TABLE() combined with a regular JOIN — both sides contribute columns", () => {
    const result = run(
      `SELECT d.name, r.score
       FROM TABLE(rank_func(TABLE(facts) PARTITION BY category_id)) AS r(score)
       JOIN dims d ON r.score = d.score`,
      [tbl("facts", ["category_id", "value"]), tbl("dims", ["score", "name"])]
    );
    expect(result).toEqual({
      tableColumns: [
        { table: "dims", columns: ["name", "score"] },
        { table: "facts", columns: ["category_id"] },
      ],
      unresolvedTableColumns: [],
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// OBSCURE & EDGE CASES — SCHEMA, METADATA, AND SQL
// ─────────────────────────────────────────────────────────────────────────────
describe("Obscure & Edge Cases: Schema, Metadata, SQL", () => {
  test("subquery with duplicate column names", () => {
    const meta = tbl("users", ["id", "name"]);
    const result = run(`SELECT t.id, t.id FROM (SELECT id, id FROM users) t`, [meta]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["id"] }],
      unresolvedTableColumns: [],
    });
  });

  test("ambiguous alias shadowing table name", () => {
    const meta = tbl("users", ["id", "name"]);
    const result = run(`SELECT users.id FROM users users`, [meta]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["id"] }],
      unresolvedTableColumns: [],
    });
  });

  test("reserved keyword as quoted identifier", () => {
    const meta = tbl("users", ["select", "from"]);
    const result = run(`SELECT "select", "from" FROM users`, [meta]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["from", "select"] }],
      unresolvedTableColumns: [],
    });
  });

  test("empty column list in metadata", () => {
    const meta = tbl("users", []);
    const result = run(`SELECT id FROM users`, [meta]);
    expect(result).toEqual({
      tableColumns: [],
      unresolvedTableColumns: [{ column: "id" }],
    });
  });

  test("table name is reserved keyword (quoted)", () => {
    const meta = tbl("select", ["id"]);
    const result = run(`SELECT id FROM "select"`, [meta]);
    expect(result).toEqual({
      tableColumns: [{ table: "select", columns: ["id"] }],
      unresolvedTableColumns: [],
    });
  });

  test("join ON referencing non-existent columns", () => {
    const meta1 = tbl("users", ["id"]);
    const meta2 = tbl("orders", ["id"]);
    const result = run(`SELECT u.id FROM users u JOIN orders o ON u.foo = o.bar`, [meta1, meta2]);
    expect(result).toEqual(
      sorted({
        tableColumns: [{ table: "users", columns: ["id"] }],
        unresolvedTableColumns: [
          { table: "users", column: "foo" },
          { table: "orders", column: "bar" },
        ],
      })
    );
  });

  test("SELECT with duplicate column aliases", () => {
    const meta = tbl("users", ["id", "name"]);
    const result = run(`SELECT id AS x, name AS x FROM users`, [meta]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["id", "name"] }],
      unresolvedTableColumns: [],
    });
  });

  test("function call on unknown column", () => {
    const meta = tbl("users", ["id"]);
    const result = run(`SELECT UPPER(name) FROM users`, [meta]);
    expect(result).toEqual({
      tableColumns: [],
      unresolvedTableColumns: [{ column: "name" }],
    });
  });
  test("schema in query, no schema in metadata", () => {
    const result = run(`SELECT id FROM myschema.users`, [USERS]);
    expect(result).toEqual({
      tableColumns: [],
      unresolvedTableColumns: [{ column: "id" }],
    });
  });

  test("schema in metadata, not in query", () => {
    const meta = tbl("users", ["id", "name"], "myschema");
    const result = run(`SELECT id FROM users`, [meta]);
    expect(result).toEqual({
      tableColumns: [
        {
          table: "myschema.users",
          columns: ["id"],
        },
      ],
      unresolvedTableColumns: [],
    });
  });

  test("schema in both query and metadata", () => {
    const meta = tbl("users", ["id", "name"], "myschema");
    const result = run(`SELECT id FROM myschema.users`, [meta]);
    expect(result).toEqual({
      tableColumns: [{ table: "myschema.users", columns: ["id"] }],
      unresolvedTableColumns: [],
    });
  });

  test("partial metadata: missing columns", () => {
    const meta = tbl("users", ["id"]);
    const result = run(`SELECT id, name FROM users`, [meta]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["id"] }],
      unresolvedTableColumns: [{ column: "name" }],
    });
  });

  test("table alias with schema", () => {
    const meta = tbl("users", ["id", "name"], "myschema");
    const result = run(`SELECT u.id FROM myschema.users u`, [meta]);
    expect(result).toEqual({
      tableColumns: [{ table: "myschema.users", columns: ["id"] }],
      unresolvedTableColumns: [],
    });
  });

  test("table alias with schema, metadata missing schemaName", () => {
    const result = run(`SELECT u.id FROM myschema.users u`, [USERS]);
    expect(result).toEqual({
      tableColumns: [],
      unresolvedTableColumns: [{ table: "myschema.users", column: "id" }],
    });
  });

  test("column alias shadows real column", () => {
    const meta = tbl("users", ["id", "name"]);
    const result = run(`SELECT id AS name FROM users`, [meta]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["id"] }],
      unresolvedTableColumns: [],
    });
  });

  test("SELECT * with partial metadata", () => {
    const meta = tbl("users", ["id"]);
    const result = run(`SELECT * FROM users`, [meta]);
    expect(result).toEqual({
      tableColumns: [{ table: "users", columns: ["id"] }],
      unresolvedTableColumns: [],
    });
  });

  test("deeply nested subquery with schema, missing metadata", () => {
    const result = run(`SELECT id FROM (SELECT id FROM myschema.users) x`);
    expect(result).toEqual({
      tableColumns: [],
      unresolvedTableColumns: [{ column: "id" }],
    });
  });

  test("CTE body unresolved column is preserved with outer SELECT *", () => {
    const meta = tbl("orders", ["id"]);
    const result = run(`WITH cte AS (SELECT name FROM orders) SELECT * FROM cte`, [meta]);
    expect(result).toEqual({
      tableColumns: [],
      unresolvedTableColumns: [{ column: "name" }],
    });
  });

  test("CTE with schema-qualified reference, partial metadata", () => {
    const meta = tbl("users", ["id"], "myschema");
    const result = run(`WITH cte AS (SELECT id, name FROM myschema.users) SELECT id, name FROM cte`, [meta]);
    expect(result).toEqual({
      tableColumns: [{ table: "myschema.users", columns: ["id"] }],
      unresolvedTableColumns: [{ column: "name" }],
    });
  });

  test("quoted identifiers with schema", () => {
    const meta = tbl("users", ["id", "weird name"], "myschema");
    const result = run(`SELECT "id", "weird name" FROM "myschema"."users"`, [meta]);
    expect(result).toEqual({
      tableColumns: [{ table: "myschema.users", columns: ["id", "weird name"] }],
      unresolvedTableColumns: [],
    });
  });

  test("schema in query, metadata with different schema", () => {
    const meta = tbl("users", ["id", "name"], "otherschema");
    const result = run(`SELECT id FROM myschema.users`, [meta]);
    expect(result).toEqual({
      tableColumns: [],
      unresolvedTableColumns: [{ column: "id" }],
    });
  });

  test("schema in metadata, query uses alias only", () => {
    const meta = tbl("users", ["id", "name"], "myschema");
    const result = run(`SELECT u.id FROM users u`, [meta]);
    expect(result).toEqual({
      tableColumns: [{ table: "myschema.users", columns: ["id"] }],
      unresolvedTableColumns: [],
    });
  });

  test("join on schema-qualified and unqualified tables", () => {
    const meta1 = tbl("users", ["id", "name"], "myschema");
    const meta2 = tbl("orders", ["id", "user_id"], undefined);
    const result = run(`SELECT u.id, o.user_id FROM myschema.users u JOIN orders o ON u.id = o.user_id`, [
      meta1,
      meta2,
    ]);
    expect(result).toEqual(
      sorted({
        tableColumns: [
          { table: "myschema.users", columns: ["id"] },
          { table: "orders", columns: ["user_id"] },
        ],
        unresolvedTableColumns: [],
      })
    );
  });

  test("join with both tables missing schema in metadata", () => {
    const meta1 = tbl("users", ["id", "name"]);
    const meta2 = tbl("orders", ["id", "user_id"]);
    const result = run(`SELECT u.id, o.user_id FROM myschema.users u JOIN myschema.orders o ON u.id = o.user_id`, [
      meta1,
      meta2,
    ]);
    expect(result).toEqual(
      sorted({
        tableColumns: [],
        unresolvedTableColumns: [
          { table: "myschema.users", column: "id" },
          { table: "myschema.orders", column: "user_id" },
        ],
      })
    );
  });

  test("join with one table missing metadata", () => {
    const meta1 = tbl("users", ["id", "name"]);
    const result = run(`SELECT u.id, o.user_id FROM users u JOIN orders o ON u.id = o.user_id`, [meta1]);
    expect(result).toEqual(
      sorted({
        tableColumns: [{ table: "users", columns: ["id"] }],
        unresolvedTableColumns: [{ table: "orders", column: "user_id" }],
      })
    );
  });

  test("join with no metadata at all", () => {
    const result = run(`SELECT u.id, o.user_id FROM users u JOIN orders o ON u.id = o.user_id`);
    expect(result).toEqual(
      sorted({
        tableColumns: [],
        unresolvedTableColumns: [
          { table: "users", column: "id" },
          { table: "orders", column: "user_id" },
        ],
      })
    );
  });

  test("CTE with schema-qualified table, no metadata", () => {
    const result = run(`WITH cte AS (SELECT id FROM myschema.users) SELECT id FROM cte`);
    expect(result).toEqual({
      tableColumns: [],
      unresolvedTableColumns: [{ column: "id" }],
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 20. SAME TABLE NAME, DIFFERENT SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────
describe("Same table name, different schemas", () => {
  const S1_CUSTOMERS = tbl("customers", ["id", "name"], "schema1");
  const S2_CUSTOMERS = tbl("customers", ["id", "email"], "schema2");

  test("fully-qualified references each resolve to the correct schema's table", () => {
    const result = run(
      `SELECT schema1.customers.id, schema2.customers.email
       FROM schema1.customers, schema2.customers`,
      [S1_CUSTOMERS, S2_CUSTOMERS]
    );
    expect(result).toEqual({
      tableColumns: [
        { table: "schema1.customers", columns: ["id"] },
        { table: "schema2.customers", columns: ["email"] },
      ],
      unresolvedTableColumns: [],
    });
  });

  test("ambiguous short-name qualifier (customers.col) is unresolved", () => {
    const result = run(`SELECT customers.id FROM schema1.customers, schema2.customers`, [S1_CUSTOMERS, S2_CUSTOMERS]);
    // 'customers' is ambiguous — neither schema1 nor schema2 should win
    expect(result).toEqual({
      tableColumns: [],
      unresolvedTableColumns: [{ column: "customers.id" }],
    });
  });

  test("bare column present in both schemas is reported as ambiguous", () => {
    const result = run(`SELECT id FROM schema1.customers, schema2.customers`, [S1_CUSTOMERS, S2_CUSTOMERS]);
    expect(result).toEqual({
      tableColumns: [],
      unresolvedTableColumns: [{ column: "id" }],
    });
  });

  test("bare column present in only one schema resolves correctly", () => {
    const result = run(`SELECT name FROM schema1.customers, schema2.customers`, [S1_CUSTOMERS, S2_CUSTOMERS]);
    expect(result).toEqual({
      tableColumns: [{ table: "schema1.customers", columns: ["name"] }],
      unresolvedTableColumns: [],
    });
  });

  test("aliases disambiguate same-name tables from different schemas", () => {
    const result = run(`SELECT c1.id, c2.email FROM schema1.customers c1, schema2.customers c2`, [
      S1_CUSTOMERS,
      S2_CUSTOMERS,
    ]);
    expect(result).toEqual({
      tableColumns: [
        { table: "schema1.customers", columns: ["id"] },
        { table: "schema2.customers", columns: ["email"] },
      ],
      unresolvedTableColumns: [],
    });
  });

  test("three schemas — short name stays poisoned after first collision", () => {
    const S3_CUSTOMERS = tbl("customers", ["id", "address"], "schema3");
    const result = run(
      `SELECT schema1.customers.id, schema2.customers.email, schema3.customers.address, customers.id
       FROM schema1.customers, schema2.customers, schema3.customers`,
      [S1_CUSTOMERS, S2_CUSTOMERS, S3_CUSTOMERS]
    );
    expect(result).toEqual({
      tableColumns: [
        { table: "schema1.customers", columns: ["id"] },
        { table: "schema2.customers", columns: ["email"] },
        { table: "schema3.customers", columns: ["address"] },
      ],
      // customers.id is ambiguous — short name should not resolve to any table
      unresolvedTableColumns: [{ column: "customers.id" }],
    });
  });
});
