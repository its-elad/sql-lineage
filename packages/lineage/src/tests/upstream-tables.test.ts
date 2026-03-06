import { describe, expect, test } from "vitest";
import { getUpstreamTables } from "../upstream-tables.js";

// ─────────────────────────────────────────────────────────────────────────────
// 1. SIMPLE QUERIES
// ─────────────────────────────────────────────────────────────────────────────
describe("Simple queries", () => {
  test("single table", () => {
    expect(getUpstreamTables(`SELECT id, name FROM users`)).toEqual(["users"]);
  });

  test("two tables in JOIN", () => {
    expect(
      getUpstreamTables(`SELECT u.id, o.amount FROM users u JOIN orders o ON u.id = o.user_id`)
    ).toEqual(["orders", "users"]);
  });

  test("three tables in multi-join", () => {
    expect(
      getUpstreamTables(`
        SELECT u.name, o.amount, p.status
        FROM users u
        JOIN orders o ON u.id = o.user_id
        JOIN payments p ON o.id = p.order_id
      `)
    ).toEqual(["orders", "payments", "users"]);
  });

  test("result is de-duplicated when the same table appears twice", () => {
    expect(
      getUpstreamTables(`
        SELECT a.id, b.id
        FROM users a
        JOIN users b ON a.parent_id = b.id
      `)
    ).toEqual(["users"]);
  });

  test("schema-qualified table name is preserved", () => {
    expect(getUpstreamTables(`SELECT * FROM myschema.orders`)).toEqual(["myschema.orders"]);
  });

  test("result is sorted alphabetically", () => {
    expect(
      getUpstreamTables(`SELECT * FROM zebra, alpha, middle`)
    ).toEqual(["alpha", "middle", "zebra"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. SUBQUERIES
// ─────────────────────────────────────────────────────────────────────────────
describe("Subqueries", () => {
  test("subquery in FROM — inner table is returned", () => {
    expect(
      getUpstreamTables(`SELECT sub.id FROM (SELECT id FROM users) sub`)
    ).toEqual(["users"]);
  });

  test("nested subqueries — all inner tables returned", () => {
    expect(
      getUpstreamTables(`
        SELECT *
        FROM (
          SELECT u.id, o.amount
          FROM users u
          JOIN (SELECT * FROM orders WHERE amount > 100) o ON u.id = o.user_id
        ) sub
      `)
    ).toEqual(["orders", "users"]);
  });

  test("correlated subquery in WHERE", () => {
    expect(
      getUpstreamTables(`
        SELECT u.id
        FROM users u
        WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id)
      `)
    ).toEqual(["orders", "users"]);
  });

  test("scalar subquery in SELECT", () => {
    expect(
      getUpstreamTables(`
        SELECT id, (SELECT MAX(amount) FROM orders WHERE user_id = users.id) AS max_order
        FROM users
      `)
    ).toEqual(["orders", "users"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. CTEs
// ─────────────────────────────────────────────────────────────────────────────
describe("CTEs", () => {
  test("simple CTE — CTE name excluded, underlying table returned", () => {
    expect(
      getUpstreamTables(`
        WITH recent_orders AS (
          SELECT * FROM orders WHERE created_at > DATE '2024-01-01'
        )
        SELECT u.name, r.amount
        FROM users u
        JOIN recent_orders r ON r.user_id = u.id
      `)
    ).toEqual(["orders", "users"]);
  });

  test("multiple CTEs — all CTE names excluded", () => {
    expect(
      getUpstreamTables(`
        WITH
          active_users AS (SELECT * FROM users WHERE status = 'active'),
          big_orders AS (SELECT * FROM orders WHERE amount > 1000)
        SELECT u.id, o.amount
        FROM active_users u
        JOIN big_orders o ON u.id = o.user_id
      `)
    ).toEqual(["orders", "users"]);
  });

  test("chained CTEs — earlier CTE referenced by later CTE", () => {
    expect(
      getUpstreamTables(`
        WITH
          a AS (SELECT * FROM t1),
          b AS (SELECT * FROM a JOIN t2 ON a.id = t2.a_id)
        SELECT * FROM b
      `)
    ).toEqual(["t1", "t2"]);
  });

  test("nested WITH (subquery with its own CTE)", () => {
    expect(
      getUpstreamTables(`
        WITH outer_cte AS (
          WITH inner_cte AS (SELECT * FROM t1)
          SELECT * FROM inner_cte JOIN t2 ON inner_cte.id = t2.id
        )
        SELECT * FROM outer_cte JOIN t3 ON outer_cte.id = t3.id
      `)
    ).toEqual(["t1", "t2", "t3"]);
  });

  test("CTE body is itself a multi-table join", () => {
    expect(
      getUpstreamTables(`
        WITH enriched AS (
          SELECT o.id, u.name, p.status
          FROM orders o
          JOIN users u ON o.user_id = u.id
          JOIN payments p ON o.id = p.order_id
        )
        SELECT * FROM enriched
      `)
    ).toEqual(["orders", "payments", "users"]);
  });

  test("schema-qualified name that shares a base name with a CTE is not excluded", () => {
    // 'orders' is a CTE, but 'myschema.orders' is schema-qualified and therefore real
    expect(
      getUpstreamTables(`
        WITH orders AS (SELECT * FROM myschema.orders)
        SELECT * FROM orders
      `)
    ).toEqual(["myschema.orders"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. SET OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────
describe("Set operations", () => {
  test("UNION ALL — tables from both sides", () => {
    expect(
      getUpstreamTables(`
        SELECT id FROM users
        UNION ALL
        SELECT id FROM employees
      `)
    ).toEqual(["employees", "users"]);
  });

  test("UNION with WHERE on both branches", () => {
    expect(
      getUpstreamTables(`
        SELECT id FROM users WHERE status = 'active'
        UNION
        SELECT id FROM archived_users WHERE archived_at > DATE '2023-01-01'
      `)
    ).toEqual(["archived_users", "users"]);
  });

  test("INTERSECT / EXCEPT", () => {
    expect(
      getUpstreamTables(`
        SELECT user_id FROM orders
        EXCEPT
        SELECT user_id FROM payments
      `)
    ).toEqual(["orders", "payments"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. UNNEST & TABLE() TABLE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────
describe("UNNEST and TABLE() table functions", () => {
  test("UNNEST over an array column — upstream table from JOIN is captured", () => {
    // UNNEST itself doesn't introduce a new table; the upstream table comes
    // from the regular FROM / CROSS JOIN clause.
    expect(
      getUpstreamTables(`
        SELECT u.id, tag
        FROM users u
        CROSS JOIN UNNEST(u.tags) AS t(tag)
      `)
    ).toEqual(["users"]);
  });

  test("UNNEST with WITH ORDINALITY", () => {
    expect(
      getUpstreamTables(`
        SELECT id, tag, pos
        FROM events
        CROSS JOIN UNNEST(events.tag_array) WITH ORDINALITY AS t(tag, pos)
      `)
    ).toEqual(["events"]);
  });

  test("TABLE() invocation with a TABLE(table_name) argument", () => {
    expect(
      getUpstreamTables(`
        SELECT *
        FROM TABLE(my_func(TABLE(source_table)))
      `)
    ).toEqual(["source_table"]);
  });

  test("TABLE() function name is NOT captured as a table", () => {
    // my_func is a PTF name, not a table
    const result = getUpstreamTables(`
      SELECT *
      FROM TABLE(my_func(TABLE(source_table)))
    `);
    expect(result).not.toContain("my_func");
    expect(result).toEqual(["source_table"]);
  });

  test("TABLE() with multiple TABLE() arguments", () => {
    expect(
      getUpstreamTables(`
        SELECT *
        FROM TABLE(my_join_func(
          TABLE(left_table)  PARTITION BY id,
          TABLE(right_table) PARTITION BY id
        ))
      `)
    ).toEqual(["left_table", "right_table"]);
  });

  test("TABLE() argument table that is schema-qualified", () => {
    expect(
      getUpstreamTables(`
        SELECT *
        FROM TABLE(my_func(TABLE(myschema.source_table) PARTITION BY id))
      `)
    ).toEqual(["myschema.source_table"]);
  });

  test("TABLE() argument table that is a CTE name is excluded", () => {
    expect(
      getUpstreamTables(`
        WITH cte AS (SELECT * FROM base_table)
        SELECT *
        FROM TABLE(my_func(TABLE(cte) PARTITION BY id))
      `)
    ).toEqual(["base_table"]);
  });

  test("TABLE() combined with a regular JOIN", () => {
    expect(
      getUpstreamTables(`
        SELECT *
        FROM TABLE(my_func(TABLE(fact_table) PARTITION BY id))
        JOIN dim_table ON fact_table.key = dim_table.key
      `)
    ).toEqual(["dim_table", "fact_table"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. CASE INSENSITIVITY & CASING
// ─────────────────────────────────────────────────────────────────────────────
describe("Case insensitivity", () => {
  test("same table referenced with different casing is de-duplicated", () => {
    expect(
      getUpstreamTables(`SELECT * FROM Users u1 JOIN USERS u2 ON u1.id = u2.parent_id`)
    ).toHaveLength(1);
  });

  test("original casing of the FIRST occurrence is preserved", () => {
    const result = getUpstreamTables(`SELECT * FROM MyTable t JOIN mytable t2 ON t.id = t2.id`);
    expect(result).toEqual(["MyTable"]);
  });
});
