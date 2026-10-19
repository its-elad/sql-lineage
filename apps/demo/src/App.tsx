import { useCallback, useRef, useState } from "react";
import Editor, { type EditorProps, type Monaco } from "@monaco-editor/react";
import { getColumnLineage, getColumnLevelLineage, getUpstreamTables, type TableMetadata } from "@sql-lineage/core";
import { LineageGraphModal } from "./lineage-graph";
import type { LineageModeResult } from "./lineage-graph";
import "./lineage-graph/lineage-graph.css";
import "./App.css";

type AnalysisMode = "column-lineage" | "column-level-lineage" | "upstream-tables";

const DEFAULT_SQL = `WITH order_summary AS (
  SELECT
    o.order_id,
    o.customer_id,
    o.status,
    oi.product_id,
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

function computeLineage(mode: AnalysisMode, sql: string, metadata: TableMetadata[]): LineageModeResult | string {
  try {
    switch (mode) {
      case "column-lineage":
        return getColumnLineage(sql, metadata);
      case "column-level-lineage":
        return getColumnLevelLineage(sql, metadata, { defaultNamespace: "demo", outputName: "demo_output" });
      case "upstream-tables":
        return getUpstreamTables(sql);
    }
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

const METADATA_SCHEMA_URI = "schema://sql-lineage/table-metadata.json";

const TABLE_METADATA_SCHEMA = {
  $id: METADATA_SCHEMA_URI,
  type: "array",
  items: {
    type: "object",
    required: ["tableName", "columns"],
    additionalProperties: false,
    properties: {
      tableName: { type: "string", description: "Name of the table" },
      tableSchema: { type: "string", description: "Optional schema qualifier (e.g. 'public')" },
      columns: {
        type: "array",
        items: { type: "string" },
        description: "List of column names in the table",
      },
    },
  },
};

const EDITOR_OPTIONS: EditorProps["options"] = {
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  fontSize: 13,
  wordWrap: "off" as const,
};

export default function App() {
  const [sql, setSql] = useState(DEFAULT_SQL);
  const [namespaceMetadata, setNamespaceMetadata] = useState(DEFAULT_NAMESPACE_METADATA);
  const [metadataText, setMetadataText] = useState(() => JSON.stringify(DEFAULT_NAMESPACE_METADATA, null, 2));
  const [mode, setMode] = useState<AnalysisMode>("column-lineage");
  const [graphOpen, setGraphOpen] = useState(false);
  const schemaRegistered = useRef(false);

  const handleSqlChange = useCallback((value: string | undefined) => {
    setSql(value ?? "");
  }, []);

  const handleMetadataEditorBeforeMount = useCallback((monaco: Monaco) => {
    if (schemaRegistered.current) return;
    schemaRegistered.current = true;
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [
        {
          uri: METADATA_SCHEMA_URI,
          fileMatch: ["metadata.json"],
          schema: TABLE_METADATA_SCHEMA,
        },
      ],
    });
  }, []);

  // const rawParseTree = safeSerialize(sql);
  const lineageResult = computeLineage(mode, sql, namespaceMetadata);
  const lineage = JSON.stringify(lineageResult, null, 2);

  return (
    <div className="app">
      <header className="app-header">
        <h1>SQL Lineage Explorer</h1>
        <div className="mode-switcher">
          <button
            className={mode === "column-lineage" ? "mode-btn active" : "mode-btn"}
            onClick={() => setMode("column-lineage")}
          >
            Column Lineage
          </button>
          <button
            className={mode === "column-level-lineage" ? "mode-btn active" : "mode-btn"}
            onClick={() => setMode("column-level-lineage")}
          >
            Column-Level Lineage
          </button>
          <button
            className={mode === "upstream-tables" ? "mode-btn active" : "mode-btn"}
            onClick={() => setMode("upstream-tables")}
          >
            Upstream Tables
          </button>
        </div>
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
              path="metadata.json"
              value={metadataText}
              beforeMount={handleMetadataEditorBeforeMount}
              onChange={(value) => {
                const text = value ?? "";
                setMetadataText(text);
                try {
                  setNamespaceMetadata(JSON.parse(text));
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

      <button
        className="lineage-fab"
        onClick={() => setGraphOpen(true)}
        title="Visualize lineage graph"
        aria-label="Open lineage graph"
      >
        ⬡
      </button>

      <LineageGraphModal
        isOpen={graphOpen}
        onClose={() => setGraphOpen(false)}
        mode={mode}
        result={lineageResult}
      />
    </div>
  );
}
