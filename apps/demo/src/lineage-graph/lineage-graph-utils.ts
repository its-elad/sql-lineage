import type { Node, Edge } from "@xyflow/react";
import dagre from "dagre";
import type {
  ColumnLineageResult,
  ColumnLevelLineageResult,
  TableColumnLineage,
} from "@sql-lineage/core";

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export type LineageMode = "column-lineage" | "column-level-lineage" | "upstream-tables";

export interface TableNodeData {
  label: string;
  columns: string[];
  isOutput?: boolean;
  [key: string]: unknown;
}

export interface GraphData {
  nodes: Node<TableNodeData>[];
  edges: Edge[];
}

// ────────────────────────────────────────────────────────────────
// Layout
// ────────────────────────────────────────────────────────────────

const NODE_WIDTH = 240;
const NODE_BASE_HEIGHT = 50;
const COLUMN_ROW_HEIGHT = 24;

function estimateNodeHeight(columnCount: number): number {
  return NODE_BASE_HEIGHT + columnCount * COLUMN_ROW_HEIGHT;
}

function applyDagreLayout(nodes: Node<TableNodeData>[], edges: Edge[]): Node<TableNodeData>[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", ranksep: 120, nodesep: 40 });

  for (const node of nodes) {
    const height = estimateNodeHeight(node.data.columns.length);
    g.setNode(node.id, { width: NODE_WIDTH, height });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    const height = estimateNodeHeight(node.data.columns.length);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - height / 2,
      },
    };
  });
}

// ────────────────────────────────────────────────────────────────
// Converters
// ────────────────────────────────────────────────────────────────

/**
 * Converts `getColumnLineage` result into a graph.
 * Shows source tables with their referenced columns flowing into an output node.
 */
function fromColumnLineage(result: ColumnLineageResult): GraphData {
  const nodes: Node<TableNodeData>[] = [];
  const edges: Edge[] = [];

  // Source table nodes
  for (const tc of result.tableColumns) {
    const nodeId = `src_${tc.table}`;
    nodes.push({
      id: nodeId,
      type: "tableNode",
      position: { x: 0, y: 0 },
      data: { label: tc.table, columns: tc.columns },
    });
    edges.push({
      id: `edge_${nodeId}_output`,
      source: nodeId,
      sourceHandle: "__node__",
      target: "output",
      targetHandle: "__node__",
      animated: true,
    });
  }

  // Unresolved tables (if any have a table name)
  const unresolvedByTable = new Map<string, string[]>();
  for (const u of result.unresolvedTableColumns) {
    if (u.table) {
      const cols = unresolvedByTable.get(u.table) ?? [];
      cols.push(u.column);
      unresolvedByTable.set(u.table, cols);
    }
  }
  for (const [table, cols] of unresolvedByTable) {
    const nodeId = `unresolved_${table}`;
    nodes.push({
      id: nodeId,
      type: "tableNode",
      position: { x: 0, y: 0 },
      data: { label: `${table} (unresolved)`, columns: cols },
    });
    edges.push({
      id: `edge_${nodeId}_output`,
      source: nodeId,
      sourceHandle: "__node__",
      target: "output",
      targetHandle: "__node__",
      style: { strokeDasharray: "5,5" },
    });
  }

  // Output node — all referenced columns
  const allOutputCols = result.tableColumns.flatMap((tc: TableColumnLineage) => tc.columns);
  const uniqueOutputCols = [...new Set(allOutputCols)];
  nodes.push({
    id: "output",
    type: "tableNode",
    position: { x: 0, y: 0 },
    data: { label: "Query Output", columns: uniqueOutputCols, isOutput: true },
  });

  const layoutNodes = applyDagreLayout(nodes, edges);
  return { nodes: layoutNodes, edges };
}

/**
 * Converts `getColumnLevelLineage` (OpenLineage-shaped) result into a graph
 * with true column-to-column edges.
 *
 * - Each output column is connected to its specific source columns via
 *   per-column handles, making the lineage path fully visible.
 * - Dataset-level inputs (WHERE/JOIN/GROUP BY) are shown with dashed amber
 *   edges connected at the node level (not a specific column).
 */
function fromColumnLevelLineage(result: ColumnLevelLineageResult): GraphData {
  const nodes: Node<TableNodeData>[] = [];
  const edges: Edge[] = [];
  const edgeSet = new Set<string>();

  const output = result.outputs[0];
  if (!output) return { nodes: [], edges: [] };

  const columnLineage = output.facets?.columnLineage;
  const outputColumns = columnLineage ? Object.keys(columnLineage.fields) : [];
  const datasetInputs = columnLineage?.dataset ?? [];

  // Collect all referenced input datasets and their fields (for node column lists)
  const inputFieldsByDataset = new Map<string, Set<string>>();

  const trackField = (ns: string, name: string, field: string) => {
    const key = `${ns}\0${name}`;
    const set = inputFieldsByDataset.get(key) ?? new Set();
    set.add(field);
    inputFieldsByDataset.set(key, set);
  };

  // From column-level mappings
  if (columnLineage) {
    for (const col of Object.values(columnLineage.fields)) {
      for (const inp of col.inputFields) {
        trackField(inp.namespace, inp.name, inp.field);
      }
    }
  }

  // From dataset-level inputs
  for (const inp of datasetInputs) {
    trackField(inp.namespace, inp.name, inp.field);
  }

  // Build a map of nodeId per input dataset
  const datasetNodeIds = new Map<string, string>();
  for (const input of result.inputs) {
    const key = `${input.namespace}\0${input.name}`;
    const nodeId = `input_${input.namespace}_${input.name}`;
    datasetNodeIds.set(key, nodeId);

    const fields = inputFieldsByDataset.get(key);
    const columns = fields ? [...fields].filter((f) => f !== "*") : [];

    nodes.push({
      id: nodeId,
      type: "tableNode",
      position: { x: 0, y: 0 },
      data: { label: input.name, columns },
    });
  }

  // Output node
  nodes.push({
    id: "output",
    type: "tableNode",
    position: { x: 0, y: 0 },
    data: { label: output.name, columns: outputColumns, isOutput: true },
  });

  // Column-to-column edges: source_col → output_col
  if (columnLineage) {
    for (const [outputCol, colLineage] of Object.entries(columnLineage.fields)) {
      for (const inp of colLineage.inputFields) {
        const datasetKey = `${inp.namespace}\0${inp.name}`;
        const sourceNodeId = datasetNodeIds.get(datasetKey);
        if (!sourceNodeId) continue;

        const edgeId = `col_${sourceNodeId}_${inp.field}__output_${outputCol}`;
        if (edgeSet.has(edgeId)) continue;
        edgeSet.add(edgeId);

        edges.push({
          id: edgeId,
          source: sourceNodeId,
          sourceHandle: `col_${inp.field}`,
          target: "output",
          targetHandle: `col_${outputCol}`,
          animated: true,
          style: { stroke: "#4ec9b0", strokeWidth: 1.5 },
        });
      }
    }
  }

  // Dataset-level edges (WHERE/JOIN/HAVING/GROUP BY/ORDER BY)
  // These connect at the node level, not column level, shown as dashed amber.
  const datasetEdgeSources = new Set<string>();
  for (const inp of datasetInputs) {
    const datasetKey = `${inp.namespace}\0${inp.name}`;
    const sourceNodeId = datasetNodeIds.get(datasetKey);
    if (!sourceNodeId || datasetEdgeSources.has(sourceNodeId)) continue;
    datasetEdgeSources.add(sourceNodeId);

    const edgeId = `dataset_${sourceNodeId}_output`;
    if (edgeSet.has(edgeId)) continue;
    edgeSet.add(edgeId);

    edges.push({
      id: edgeId,
      source: sourceNodeId,
      sourceHandle: "__node__",
      target: "output",
      targetHandle: "__node__",
      style: { stroke: "#f59e0b", strokeWidth: 1.5, strokeDasharray: "6,3" },
      label: "dataset-level",
      labelStyle: { fill: "#f59e0b", fontSize: 10 },
    });
  }

  const layoutNodes = applyDagreLayout(nodes, edges);
  return { nodes: layoutNodes, edges };
}

/**
 * Converts `getUpstreamTables` result (string[]) into a graph.
 * Simple: upstream tables → query output.
 */
function fromUpstreamTables(tables: string[]): GraphData {
  const nodes: Node<TableNodeData>[] = [];
  const edges: Edge[] = [];

  for (const table of tables) {
    const nodeId = `upstream_${table}`;
    nodes.push({
      id: nodeId,
      type: "tableNode",
      position: { x: 0, y: 0 },
      data: { label: table, columns: [] },
    });
    edges.push({
      id: `edge_${nodeId}_output`,
      source: nodeId,
      sourceHandle: "__node__",
      target: "output",
      targetHandle: "__node__",
      animated: true,
    });
  }

  nodes.push({
    id: "output",
    type: "tableNode",
    position: { x: 0, y: 0 },
    data: { label: "Query Output", columns: [], isOutput: true },
  });

  const layoutNodes = applyDagreLayout(nodes, edges);
  return { nodes: layoutNodes, edges };
}

// ────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────

/**
 * Converts any lineage result to React Flow graph data based on the analysis mode.
 */
export function buildGraphData(mode: LineageMode, result: unknown): GraphData | null {
  if (!result || typeof result === "string") return null;

  try {
    switch (mode) {
      case "column-lineage":
        return fromColumnLineage(result as ColumnLineageResult);
      case "column-level-lineage":
        return fromColumnLevelLineage(result as ColumnLevelLineageResult);
      case "upstream-tables":
        return fromUpstreamTables(result as string[]);
    }
  } catch {
    return null;
  }
}
