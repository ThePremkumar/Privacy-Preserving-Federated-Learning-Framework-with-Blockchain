'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HospitalNode } from './types';

interface MapViewProps {
  nodes: HospitalNode[];
  onNodeClick: (node: HospitalNode) => void;
  selectedNode: HospitalNode | null;
}

const createMarkerIcon = (status: HospitalNode['status']) => {
  const colors = {
    active: { ring: '#16a34a', fill: '#22c55e' },
    idle: { ring: '#d97706', fill: '#f59e0b' },
    offline: { ring: '#dc2626', fill: '#ef4444' },
  };

  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div class="hmarker hmarker-${status}" style="background-color: ${colors[status].fill}; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="white" style="margin-top: 6px; margin-left: 6px;">
          <rect x="4" y="1" width="4" height="10" rx="1"/>
          <rect x="1" y="4" width="10" height="4" rx="1"/>
        </svg>
        ${status === 'active' ? '<div class="pulse-ring"></div>' : ''}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

function MapEvents({ onInteract }: { onInteract: () => void }) {
  useMapEvents({
    click: () => onInteract(),
  });
  return null;
}

export default function MapView({ nodes, onNodeClick, selectedNode }: MapViewProps) {
  const [mapEnabled, setMapEnabled] = useState(false);

  // Fix for default Leaflet icons in Next.js
  useEffect(() => {
    if (typeof window !== 'undefined') {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    }
  }, []);

  return (
    <div className="w-full h-full relative rounded-[32px] overflow-hidden border border-slate-100 shadow-inner bg-[#f8fafc]">
      <style jsx global>{`
        .hmarker {
          width: 28px;
          height: 28px;
          border-radius: 10px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .hmarker:hover {
          transform: scale(1.2);
          z-index: 1000;
        }
        .pulse-ring {
          position: absolute;
          inset: -4px;
          border: 2px solid #22c55e;
          border-radius: 12px;
          animation: h-pulse 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes h-pulse {
          0% { transform: scale(1); opacity: 0.8; }
          70%, 100% { transform: scale(1.8); opacity: 0; }
        }
        .leaflet-container {
          background: #f8fafc !important;
          width: 100%;
          height: 100%;
        }
        .leaflet-bar {
          border: none !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
          margin: 12px !important;
        }
        .leaflet-bar a {
          background-color: white !important;
          color: #64748b !important;
          border: 1px solid #f1f5f9 !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-weight: 900 !important;
        }
        .leaflet-bar a:first-child { border-radius: 12px 12px 0 0 !important; }
        .leaflet-bar a:last-child { border-radius: 0 0 12px 12px !important; }
      `}</style>

      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        minZoom={4}
        maxZoom={14}
        scrollWheelZoom={mapEnabled}
        className="w-full h-full z-0"
      >
        <MapEvents onInteract={() => setMapEnabled(true)} />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {selectedNode && (
          <MapController center={[selectedNode.lat, selectedNode.lng]} zoom={7} />
        )}

        {nodes.map((node) => (
          <Marker
            key={node.id}
            position={[node.lat, node.lng]}
            icon={createMarkerIcon(node.status)}
            eventHandlers={{
              click: () => onNodeClick(node),
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
              <div className="px-2 py-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">{node.name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">{node.city}</p>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {!mapEnabled && (
        <div 
          className="absolute inset-0 z-[500] bg-transparent cursor-pointer"
          onClick={() => setMapEnabled(true)}
          title="Click to enable map interaction"
        />
      )}
    </div>
  );
}
