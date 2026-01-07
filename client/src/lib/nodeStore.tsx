import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mockApps, mockDevices, mockFeeds, mockSystems, App, Device, Feed, System } from './mockData';
import { Plane, Ship, Activity } from 'lucide-react';

// Define Node types
export interface Node extends System {
  location: { lat: number; lng: number; name: string };
}

export interface NodeData {
  apps: App[];
  devices: Device[];
  feeds: Feed[];
  vehicles: any[]; // Using any for now to match the structure in Tracking.tsx
}

interface NodeContextType {
  activeNodeId: string;
  activeNode: Node;
  nodes: Node[];
  setActiveNode: (id: string) => void;
  data: NodeData;
  installApp: (appId: string) => void;
  uninstallApp: (appId: string) => void;
}

const NodeContext = createContext<NodeContextType | undefined>(undefined);

// Helper to generate random vehicles around a center point
const generateVehicles = (centerLat: number, centerLng: number, count: number, prefix: string) => {
  return [
    ...Array.from({ length: count }, (_, i) => ({
      id: `${prefix}-A${i + 1}`,
      type: "aircraft",
      callsign: `${prefix}FLT${100 + i}`,
      icao: Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, '0'),
      lat: centerLat + (Math.random() - 0.5) * 2,
      lng: centerLng + (Math.random() - 0.5) * 2,
      heading: Math.floor(Math.random() * 360),
      speed: 150 + Math.floor(Math.random() * 400),
      alt: 5000 + Math.floor(Math.random() * 30000),
      source: "Simulated Feed",
      rssi: -10 - Math.floor(Math.random() * 20)
    })),
    ...Array.from({ length: Math.floor(count / 2) }, (_, i) => ({
      id: `${prefix}-M${i + 1}`,
      type: "ship",
      callsign: `${prefix}VESSEL${100 + i}`,
      icao: Math.floor(Math.random() * 900000000 + 100000000).toString(),
      lat: centerLat - 0.5 + (Math.random() * 0.5), // Slightly offset for water usually
      lng: centerLng - 0.5 + (Math.random() * 0.5),
      heading: Math.floor(Math.random() * 360),
      speed: 10 + Math.floor(Math.random() * 25),
      alt: undefined,
      source: "Marine Traffic Feed",
      rssi: -5 - Math.floor(Math.random() * 15)
    }))
  ];
};

// Initial nodes configuration
const initialNodes: Node[] = [
  {
    ...mockSystems[0],
    location: { lat: 37.7, lng: -122.4, name: "San Francisco" } // Core
  },
  {
    ...mockSystems[1],
    location: { lat: 34.05, lng: -118.25, name: "Los Angeles" } // Attic
  },
  {
    ...mockSystems[2],
    location: { lat: 47.60, lng: -122.33, name: "Seattle" } // Garage
  }
];

// Initial data generation for each node
const generateInitialData = (): Record<string, NodeData> => {
  const data: Record<string, NodeData> = {};

  // Core Node (SF) - Default state
  data['sys-1'] = {
    apps: [...mockApps],
    devices: [...mockDevices],
    feeds: [...mockFeeds],
    vehicles: generateVehicles(37.7, -122.4, 50, 'SF')
  };

  // Attic Node (LA) - Minimal apps
  data['sys-2'] = {
    apps: mockApps.map(a => ({ ...a, installed: a.id === 'readsb' || a.id === 'external-feed-source' })), // Only basic apps
    devices: [mockDevices[0], mockDevices[3]], // Subset of devices
    feeds: [mockFeeds[1]], 
    vehicles: generateVehicles(34.05, -118.25, 30, 'LA')
  };

  // Garage Node (Seattle) - Different set
  data['sys-3'] = {
    apps: mockApps.map(a => ({ ...a, installed: a.id === 'ais-catcher' || a.id === 'rtl_433' })), // Marine & Utility focus
    devices: [mockDevices[2]],
    feeds: [mockFeeds[2]],
    vehicles: generateVehicles(47.60, -122.33, 40, 'SEA')
  };

  return data;
};

export function NodeProvider({ children }: { children: ReactNode }) {
  const [activeNodeId, setActiveNodeId] = useState<string>(() => {
    return localStorage.getItem('activeNodeId') || 'sys-1';
  });

  const [nodeData, setNodeData] = useState<Record<string, NodeData>>(() => {
    const saved = localStorage.getItem('nodeData');
    return saved ? JSON.parse(saved) : generateInitialData();
  });

  const [nodes] = useState<Node[]>(initialNodes);

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('activeNodeId', activeNodeId);
  }, [activeNodeId]);

  useEffect(() => {
    localStorage.setItem('nodeData', JSON.stringify(nodeData));
  }, [nodeData]);

  const activeNode = nodes.find(n => n.id === activeNodeId) || nodes[0];
  const currentData = nodeData[activeNodeId] || generateInitialData()['sys-1'];

  const installApp = (appId: string) => {
    setNodeData(prev => ({
      ...prev,
      [activeNodeId]: {
        ...prev[activeNodeId],
        apps: prev[activeNodeId].apps.map(app => 
          app.id === appId ? { ...app, installed: true, status: 'installing' } : app
        )
      }
    }));

    // Simulate installation finish
    setTimeout(() => {
      setNodeData(prev => ({
        ...prev,
        [activeNodeId]: {
          ...prev[activeNodeId],
          apps: prev[activeNodeId].apps.map(app => 
            app.id === appId ? { ...app, status: 'running' } : app
          )
        }
      }));
    }, 2000);
  };

  const uninstallApp = (appId: string) => {
    setNodeData(prev => ({
      ...prev,
      [activeNodeId]: {
        ...prev[activeNodeId],
        apps: prev[activeNodeId].apps.map(app => 
          app.id === appId ? { ...app, installed: false, status: 'stopped' } : app
        )
      }
    }));
  };

  return (
    <NodeContext.Provider value={{
      activeNodeId,
      activeNode,
      nodes,
      setActiveNode: setActiveNodeId,
      data: currentData,
      installApp,
      uninstallApp
    }}>
      {children}
    </NodeContext.Provider>
  );
}

export function useNodeStore() {
  const context = useContext(NodeContext);
  if (context === undefined) {
    throw new Error('useNodeStore must be used within a NodeProvider');
  }
  return context;
}
