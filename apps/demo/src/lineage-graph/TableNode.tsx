import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { TableNodeData } from "./lineage-graph-utils";

type TableNodeType = Node<TableNodeData>;

/**
 * Custom React Flow node that displays a table with its column list.
 * Each column gets its own source/target handle for column-level edge connections.
 * Output nodes get a distinct accent color.
 */
function TableNodeComponent({ data }: NodeProps<TableNodeType>) {
  const isOutput = data.isOutput ?? false;
  const hasColumns = data.columns.length > 0;

  return (
    <div className={`lineage-node ${isOutput ? "lineage-node--output" : ""}`}>
      {/* Node-level handles used for dataset-level edges and modes without column handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="__node__"
        className="lineage-node__handle--node"
      />
      <div className="lineage-node__header">{data.label}</div>
      {hasColumns && (
        <ul className="lineage-node__columns">
          {data.columns.map((col) => (
            <li key={col} className="lineage-node__column">
              {/* Per-column target handle (left side) */}
              <Handle
                type="target"
                position={Position.Left}
                id={`col_${col}`}
                className="lineage-node__handle--column"
              />
              <span className="lineage-node__column-name">{col}</span>
              {/* Per-column source handle (right side) */}
              <Handle
                type="source"
                position={Position.Right}
                id={`col_${col}`}
                className="lineage-node__handle--column"
              />
            </li>
          ))}
        </ul>
      )}
      <Handle
        type="source"
        position={Position.Right}
        id="__node__"
        className="lineage-node__handle--node"
      />
    </div>
  );
}

export const TableNode = memo(TableNodeComponent);
