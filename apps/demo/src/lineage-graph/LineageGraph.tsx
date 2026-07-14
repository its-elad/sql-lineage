import { useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { TableNode } from "./TableNode";
import { buildGraphData, type LineageMode, type LineageModeResult, type TableNodeData } from "./lineage-graph-utils";

const nodeTypes: NodeTypes = {
  tableNode: TableNode,
};

interface LineageGraphProps {
  mode: LineageMode;
  result: LineageModeResult | string;
}

/**
 * Renders the lineage result as an interactive directed graph.
 * Supports all three analysis modes with appropriate visual treatment.
 * Nodes are fully draggable via React Flow's controlled state.
 */
export function LineageGraph({ mode, result }: LineageGraphProps) {
  const graphData = useMemo(
    () => (typeof result === "string" ? null : buildGraphData(mode, result)),
    [mode, result]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<TableNodeData>>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (graphData) {
      setNodes(graphData.nodes);
      setEdges(graphData.edges);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [graphData, setNodes, setEdges]);

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="lineage-graph__empty">
        <p>No lineage data to visualize.</p>
        <p className="lineage-graph__empty-hint">
          Run a query analysis to see the lineage graph.
        </p>
      </div>
    );
  }

  return (
    <div className="lineage-graph">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
      >
        <Background gap={16} size={1} color="#333" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => (node.data?.isOutput ? "#0e639c" : "#3c3c3c")}
          maskColor="rgba(0,0,0,0.7)"
          style={{ backgroundColor: "#1e1e1e" }}
        />
      </ReactFlow>
    </div>
  );
}
