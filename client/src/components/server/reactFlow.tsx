import { useCallback, useMemo } from 'react';
import type { ComponentType } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Position,
  ConnectionLineType,
  Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { User, BotMessageSquare, Calendar, FileText, XCircle } from 'lucide-react';

// Custom Node Component
function CustomNode({ data }: { data: any }) {
  const Icon = data.icon;
  const isAgent = data.type === 'agent';
  const isUser = data.type === 'user';
  const isTool = data.type === 'tool';

  return (
    <div 
      className={`
        relative p-2 rounded-xl shadow-xl
        backdrop-filter backdrop-blur-lg
        transition-all duration-300 hover:scale-105
        ${isUser ? 'glass-chip border-2 border-blue-500/40' : ''}
        ${isAgent ? 'glass-chip border-2 border-purple-500/40' : ''}
        ${isTool ? 'glass-chip border-2 border-emerald-500/30' : ''}
      `}
    >
      {/* Source handle for user and agent */}
      {(isUser || isAgent) && (
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: '#3b82f6', border: '2px solid #ffffff' }}
        />
      )}
      
      {/* Target handle for agent and tools */}
      {(isAgent || isTool) && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: '#a855f7', border: '2px solid #ffffff' }}
        />
      )}
      
      <div 
        className={`
          w-12 h-12 rounded-xl flex items-center justify-center
          ${isUser ? '' : ''}
          ${isAgent ? '' : ''}
          ${isTool ? '' : ''}
        `}
      >
        <Icon 
          className={`
            w-7 h-7
            ${isUser ? 'text-blue-400' : ''}
            ${isAgent ? 'text-purple-400' : ''}
            ${isTool ? 'text-emerald-400' : ''}
          `}
        />
      </div>
      
      {isAgent && (
        <div className="absolute inset-0 rounded-xl border-2 border-purple-500/20 animate-pulse" />
      )}
    </div>
  );
}

const nodeTypes = {
  custom: CustomNode,
};

interface ReactFlowCanvasProps {
  tools?: Array<{ 
    name: string; 
    description?: string;
    icon?: ComponentType;
  }>;
}

export default function ReactFlowCanvas({ tools }: ReactFlowCanvasProps) {
  // Default tools from tools.json if not provided
  const defaultTools = [
    { name: '', icon: Calendar },
    { name: '', icon: Calendar },
    { name: '', icon: XCircle },
    { name: '', icon: FileText },
  ];

  const toolsToDisplay = tools && tools.length > 0 ? tools : defaultTools;

  // Create nodes
  const initialNodes: Node[] = useMemo(() => {
    const nodes: Node[] = [
      // User Node
      {
        id: 'user',
        type: 'custom',
        position: { x: 100, y: 200 },
        data: { 
          label: '', 
          icon: User, 
          type: 'user'
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      },
      // Agent Node
      {
        id: 'agent',
        type: 'custom',
        position: { x: 400, y: 200 },
        data: { 
          label: '', 
          icon: BotMessageSquare, 
          type: 'agent'
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      },
    ];

    // Tool Nodes - arranged vertically to the right of agent
    const toolCount = toolsToDisplay.length;
    const startY = 200 - ((toolCount - 1) * 100) / 2; // Center tools vertically
    const toolX = 700; // Fixed X position for all tools

    toolsToDisplay.forEach((tool, index) => {
      const icon = tool.icon || FileText;
      nodes.push({
        id: `tool-${index}`,
        type: 'custom',
        position: { x: toolX, y: startY + (index * 100) },
        data: { 
          label: tool.name,
          icon: tool.icon,
          type: 'tool'
        },
        targetPosition: Position.Left,
      });
    });

    return nodes;
  }, [toolsToDisplay]);

  // Create edges
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [
      // User to Agent
      {
        id: 'user-agent',
        source: 'user',
        target: 'agent',
        animated: true,
        style: { 
          stroke: '#3b82f6',
          strokeWidth: 4,
          strokeOpacity: 1,
        },
        type: 'default',
      },
    ];

    // Agent to Tools
    toolsToDisplay.forEach((_, index) => {
      edges.push({
        id: `agent-tool-${index}`,
        source: 'agent',
        target: `tool-${index}`,
        animated: true,
        style: { 
          stroke: '#a855f7',
          strokeWidth: 4,
          strokeOpacity: 1,
        },
        type: 'default',
      });
    });

    return edges;
  }, [toolsToDisplay]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-full relative rounded-xl glass-chip" style={{ overflow: 'visible' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
        connectionLineType={ConnectionLineType.Straight}
        defaultEdgeOptions={{
          animated: true,
          style: { 
            strokeWidth: 4,
            strokeOpacity: 1,
          },
          type: 'default',
        }}
      >
        <Background 
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          className="opacity-20"
        />
      </ReactFlow>
    </div>
  );
}
