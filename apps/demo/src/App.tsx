import { useCallback, useState } from "react";
import Editor from "@monaco-editor/react";
import { parseSqlAntlr, serializeParseTreeAntlr, getColumnLineage, type TableMetadata } from "@sql-lineage/lineage";
import "./App.css";

const DEFAULT_SQL = `WITH order_summary AS (
  SELECT
    o.order_id,
    o.customer_id,
    o.status,
    SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) AS order_total,
    COUNT(oi.product_id) AS item_count,
    (SELECT MAX(price) FROM products WHERE category = p.category) AS max_category_price
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.order_id
  JOIN products p ON p.product_id = oi.product_id
  WHERE o.order_date >= '2024-01-01'
  GROUP BY o.order_id, o.customer_id, o.status, p.category
),
customer_orders AS (
  SELECT
    c.customer_id,
    c.name,
    c.email,
    c.status,
    os.order_total,
    os.item_count,
    os.status AS order_status,
    p.category,
    p.product_name,
    p.status AS product_status
  FROM order_summary os
  JOIN customers c ON c.customer_id = os.customer_id
  JOIN products p ON p.product_id = os.product_id
  WHERE p.price > 10
)
SELECT
  co.customer_id,
  co.name,
  co.email,
  co.product_name,
  co.category,
  co.order_total,
  s.supplier_name,
  s.status AS supplier_status
FROM customer_orders co
JOIN suppliers s ON s.supplier_id = (SELECT supplier_id FROM products WHERE product_id = co.product_name)
WHERE co.order_total > 100
ORDER BY co.order_total DESC`;

const DEFAULT_NAMESPACE_METADATA: TableMetadata[] = [
  { tableName: "orders", columns: ["order_id", "customer_id", "order_date", "total_amount", "status"] },
  { tableName: "customers", columns: ["customer_id", "name", "email", "phone", "status"] },
  { tableName: "order_items", columns: ["order_id", "quantity", "unit_price", "product_id", "discount"] },
  { tableName: "products", columns: ["product_id", "product_name", "category", "price", "status", "supplier_id"] },
  { tableName: "suppliers", columns: ["supplier_id", "supplier_name", "country", "status"] },
];

/** Stub: replace with real lineage extraction once implemented */
function computeLineage(...params: Parameters<typeof getColumnLineage>): unknown {
  try {
    return getColumnLineage(...params);
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

function safeSerialize(sql: string): string {
  try {
    const tree = parseSqlAntlr(sql);
    return JSON.stringify(serializeParseTreeAntlr(tree), null, 2);
  } catch (e) {
    return String(e);
  }
}

const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  fontSize: 13,
  wordWrap: "off" as const,
};

export default function App() {
  const [sql, setSql] = useState(DEFAULT_SQL);
  const [namespaceMetadata, setNamespaceMetadata] = useState(DEFAULT_NAMESPACE_METADATA);

  const handleSqlChange = useCallback((value: string | undefined) => {
    setSql(value ?? "");
  }, []);

  // const rawParseTree = safeSerialize(sql);
  const lineage = JSON.stringify(computeLineage(sql, namespaceMetadata), null, 2);

  return (
    <div className="app">
      <header className="app-header">
        <h1>SQL Lineage Explorer</h1>
      </header>
      <div className="panels">
        <section className="panel">
          <div className="panel-title">Trino SQL Input</div>
          <div className="panel-body">
            <Editor
              height="100%"
              defaultLanguage="sql"
              value={sql}
              onChange={handleSqlChange}
              theme="vs-dark"
              options={EDITOR_OPTIONS}
            />
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">Namespace Metadata</div>
          <div className="panel-body">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={JSON.stringify(namespaceMetadata, null, 2)}
              onChange={(value) => {
                try {
                  setNamespaceMetadata(JSON.parse(value ?? ""));
                } catch {}
              }}
              theme="vs-dark"
              options={EDITOR_OPTIONS}
            />
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">Lineage Output</div>
          <div className="panel-body">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={lineage}
              theme="vs-dark"
              options={{ ...EDITOR_OPTIONS, readOnly: true }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
