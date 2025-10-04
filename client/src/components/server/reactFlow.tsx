import { useCallback, useMemo, useEffect, useRef } from 'react';
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
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { User, BotMessageSquare, Calendar, FileText, HeartPulse, Database, Bookmark } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

// Custom Node Component
function CustomNode({ data }: { data: any }) {
  const Icon = data.icon;
  const isAgent = data.type === 'agent';
  const isUser = data.type === 'user';
  const isTool = data.type === 'tool';
  const { theme } = useTheme();
  
  // Use darker colors for light theme, lighter colors for dark theme
  const userColor = theme === 'light' ? 'text-blue-700' : 'text-blue-400';
  const agentColor = theme === 'light' ? 'text-purple-700' : 'text-purple-400';
  const toolColor = theme === 'light' ? 'text-emerald-700' : 'text-emerald-400';

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
            w-7 h-7 transition-colors duration-200
            ${isUser ? userColor : ''}
            ${isAgent ? agentColor : ''}
            ${isTool ? toolColor : ''}
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

// Inner component that uses useReactFlow for fitView control
function FlowCanvas({ tools }: ReactFlowCanvasProps) {
  // Default tools from tools.json if not provided
  const defaultTools = [
    { name: '', icon: Calendar },
    { name: '', icon: Database },
    { name: '', icon:  HeartPulse},
    { name: '', icon: Bookmark },
  ];

  const toolsToDisplay = tools && tools.length > 0 ? tools : defaultTools;
  const reactFlowInstance = useReactFlow();

  // Create nodes with responsive positioning
  const createNodes = useCallback(() => {
    const isMobile = window.innerWidth < 768;
    
    // Adjust spacing based on screen size
    const userX = isMobile ? 50 : 100;
    const agentX = isMobile ? 220 : 400;
    const toolX = isMobile ? 400 : 700;
    const toolSpacing = 85;
    const centerY = 150;

    const nodes: Node[] = [
      // User Node
      {
        id: 'user',
        type: 'custom',
        position: { x: userX, y: centerY },
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
        position: { x: agentX, y: centerY },
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
    const startY = centerY - ((toolCount - 1) * toolSpacing) / 2; // Center tools vertically

    toolsToDisplay.forEach((tool, index) => {
      const icon = tool.icon || FileText;
      nodes.push({
        id: `tool-${index}`,
        type: 'custom',
        position: { x: toolX, y: startY + (index * toolSpacing) },
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

  // Create nodes
  const initialNodes: Node[] = useMemo(() => createNodes(), [createNodes]);

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

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Handle window resize to reposition nodes and re-center
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const padding = isMobile ? 0.3 : 0.2;
      
      // Recreate nodes with new positions based on screen size
      const newNodes = createNodes();
      setNodes(newNodes);
      
      // Use setTimeout to ensure ReactFlow has rendered with new positions
      setTimeout(() => {
        reactFlowInstance.fitView({ 
          padding,
          duration: 200,
        });
      }, 100);
    };

    // Initial fit
    handleResize();

    // Add resize listener with debounce
    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, [reactFlowInstance, createNodes, setNodes]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      minZoom={0.5}
      maxZoom={1.5}
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
  );
}

// Main component wrapped with ReactFlowProvider
export default function ReactFlowCanvas({ tools }: ReactFlowCanvasProps) {
  return (
    <div className="w-full h-full relative rounded-xl glass-chip" style={{ overflow: 'visible' }}>
      <ReactFlowProvider>
        <FlowCanvas tools={tools} />
      </ReactFlowProvider>
    </div>
  );
}
