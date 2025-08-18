import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';

interface TruckVisualizationProps {
  truckDimensions: {
    length: number;
    width: number;
    height: number;
  };
  placedItems: any[];
  showLabels?: boolean;
  showWireframe?: boolean;
  selectedItemId?: string | null;
}

// Animated Item Component with Hover Effects
const AnimatedItem: React.FC<{ 
  item: any; 
  showLabels: boolean;
  isHovered: boolean;
  onHover: (id: string) => void;
  onLeave: () => void;
  truckDimensions: { length: number; width: number; height: number };
}> = ({ item, showLabels, isHovered, onHover, onLeave, truckDimensions }) => {
  const meshRef = useRef<THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial | THREE.Material>>(null);
  const { position, dimensions } = item;
  
  // Convert from truck coordinates to Three.js coordinates
  const x = position.x + dimensions.length / 2;
  const y = position.z + dimensions.height / 2;
  // Mirror the width axis so y=0 maps to the left side of the truck (z small)
  const z = truckDimensions.width - (position.y + dimensions.width / 2);
  
  // Generate a color based on item ID for visual distinction
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
  const colorIndex = item.id.toString().charCodeAt(0) % colors.length;
  const baseColor = colors[colorIndex];
  
  // Opacity change on hover (no scaling)
  useFrame(() => {
    if (meshRef.current) {
      const material = meshRef.current.material;
      if (!Array.isArray(material)) {
        material.transparent = true;
        (material as THREE.Material & { opacity: number }).opacity = isHovered ? 0.8 : 0.6;
      }
    }
  });

  return (
    <group position={[x, y, z]}>
      <mesh
        ref={meshRef}
        onPointerOver={() => onHover(String(item.id))}
        onPointerOut={onLeave}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[dimensions.length, dimensions.height, dimensions.width]} />
        {(() => {
          const idHash = item.id.toString().split('').reduce((acc: number, ch: string) => acc + ch.charCodeAt(0), 0);
          const polyFactor = -0.6 - (idHash % 5) * 0.02;
          return (
            <meshStandardMaterial 
          color={baseColor}
          transparent
          opacity={0.6}
          depthWrite={true}
          polygonOffset={true}
          polygonOffsetFactor={polyFactor}
          polygonOffsetUnits={1}
          side={THREE.FrontSide}
          roughness={0.3}
          metalness={0.1}
            />
          );
        })()}
      </mesh>
      
      {/* Wireframe overlay (ignore raycast to avoid intercepting hovers) */}
      <lineSegments raycast={null as any}>
        <edgesGeometry args={[new THREE.BoxGeometry(dimensions.length, dimensions.height, dimensions.width)]} />
        <lineBasicMaterial color="#000000" opacity={0.3} transparent />
      </lineSegments>
      
      {/* Item Label (only on hover/selection) */}
      {showLabels && isHovered && (
        <Html position={[0, dimensions.height / 2 + 0.1, 0]} center>
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          }}>
            {item.id}
          </div>
        </Html>
      )}
    </group>
  );
};

// Enhanced Truck Container with Wireframe
const TruckContainer: React.FC<{ 
  dimensions: any; 
  showWireframe: boolean;
}> = ({ dimensions, showWireframe }) => {
  return (
    <group position={[dimensions.length / 2, dimensions.height / 2, dimensions.width / 2]}>
      {/* Main truck container */}
      <mesh receiveShadow raycast={null as any}>
        <boxGeometry args={[dimensions.length, dimensions.height, dimensions.width]} />
        <meshStandardMaterial 
          color="lightblue" 
          transparent 
          opacity={0.2}
          depthWrite={false}
          polygonOffset={true}
          polygonOffsetFactor={-1}
          polygonOffsetUnits={1}
          side={THREE.BackSide}
          roughness={0.5}
        />
      </mesh>
      
      {/* Wireframe for truck */}
      {showWireframe && (
        <lineSegments raycast={null as any}>
          <edgesGeometry args={[new THREE.BoxGeometry(dimensions.length, dimensions.height, dimensions.width)]} />
          <lineBasicMaterial color="#0066cc" opacity={0.6} transparent />
        </lineSegments>
      )}
    </group>
  );
};

// Camera Controller Component
const CameraController: React.FC<{ 
  truckDimensions: any;
  placedItems: any[];
  cameraMode: string;
}> = ({ truckDimensions, placedItems, cameraMode }) => {
  const controlsRef = useRef<any>(null);
  
  useEffect(() => {
    if (controlsRef.current) {
      // Set the target to the center of the truck
      const centerX = truckDimensions.length / 2;
      const centerY = truckDimensions.height / 2;
      const centerZ = truckDimensions.width / 2;
      
      controlsRef.current.target.set(centerX, centerY, centerZ);
      controlsRef.current.update();
    }
  }, [truckDimensions, placedItems, cameraMode]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={2}
      maxDistance={100}
      dampingFactor={0.05}
      enableDamping={true}
      autoRotate={false}
      autoRotateSpeed={1}
    />
  );
};

// Main Visualization Component
const TruckVisualization: React.FC<TruckVisualizationProps> = ({ 
  truckDimensions, 
  placedItems,
  showLabels = true,
  showWireframe = true,
  selectedItemId = null,
}) => {
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<'free' | 'top' | 'side' | 'front'>('free');

  const handleCameraModeChange = (mode: 'free' | 'top' | 'side' | 'front') => {
    setCameraMode(mode);
  };

  const getCameraPosition = (): [number, number, number] => {
    const maxDim = Math.max(truckDimensions.length, truckDimensions.width, truckDimensions.height);
    const distance = maxDim * 2;
    const centerX = truckDimensions.length / 2;
    const centerY = truckDimensions.height / 2;
    const centerZ = truckDimensions.width / 2;
    
    switch (cameraMode) {
      case 'top':
        return [centerX, centerY + distance, centerZ];
      case 'side':
        return [centerX + distance, centerY, centerZ];
      case 'front':
        return [centerX, centerY, centerZ + distance];
      default:
        return [centerX + distance, centerY + distance, centerZ + distance];
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas 
        camera={{ 
          position: getCameraPosition(), 
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        shadows
      >
        {/* Enhanced Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        
        {/* Camera Controls */}
        <CameraController truckDimensions={truckDimensions} placedItems={placedItems} cameraMode={cameraMode} />
        
        {/* Truck Container */}
        <TruckContainer dimensions={truckDimensions} showWireframe={showWireframe} />
        
        {/* Placed Items */}
        {placedItems.map((item) => (
          <AnimatedItem
            key={String(item.id)}
            item={item}
            showLabels={showLabels}
            isHovered={(hoveredItemId !== null && String(item.id) === hoveredItemId) || (typeof item.id !== 'undefined' && String(item.id) === String(selectedItemId))}
            onHover={setHoveredItemId}
            onLeave={() => setHoveredItemId(null)}
            truckDimensions={truckDimensions}
          />
        ))}
        
        {/* Enhanced Grid */}
        <gridHelper 
          args={[
            Math.max(truckDimensions.length, truckDimensions.width) * 2, 
            20, 
            '#cccccc', 
            '#cccccc'
          ]} 
          position={[truckDimensions.length / 2, 0.001, truckDimensions.width / 2]}
        />
        
        {/* Axes helper */}
        <axesHelper args={[Math.max(truckDimensions.length, truckDimensions.width, truckDimensions.height)]} position={[0, 0.002, 0]} />
      </Canvas>
      
      {/* Enhanced Controls Panel */}
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        left: '10px', 
        background: 'rgba(255, 255, 255, 0.95)', 
        padding: '15px', 
        borderRadius: '8px',
        fontSize: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        minWidth: '200px'
      }}>
        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>🎮 Controls</div>
        <div style={{ marginBottom: '8px' }}>🖱️ Left click + drag: Rotate</div>
        <div style={{ marginBottom: '8px' }}>🖱️ Right click + drag: Pan</div>
        <div style={{ marginBottom: '8px' }}>🖱️ Scroll: Zoom</div>
        
        <div style={{ marginTop: '15px', marginBottom: '10px', fontWeight: 'bold' }}>📷 Camera Views</div>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {(['free', 'top', 'side', 'front'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleCameraModeChange(mode)}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: cameraMode === mode ? '#007bff' : 'white',
                color: cameraMode === mode ? 'white' : '#333',
                cursor: 'pointer'
              }}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ marginTop: '8px' }}>
          <button
            onClick={() => handleCameraModeChange('free')}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              border: '1px solid #28a745',
              borderRadius: '4px',
              background: '#28a745',
              color: 'white',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            🔄 Reset View
          </button>
        </div>
        
        <div style={{ marginTop: '15px', marginBottom: '10px', fontWeight: 'bold' }}>🎨 Legend</div>
        <div style={{ color: 'lightblue' }}>■ Truck Container</div>
        <div style={{ color: '#ff6b6b' }}>■ Placed Items ({placedItems.length})</div>
        {hoveredItemId !== null && (
          <div style={{ 
            marginTop: '8px', 
            padding: '5px', 
            background: '#e3f2fd', 
            borderRadius: '4px',
            fontSize: '11px'
          }}>
            Hovering: {hoveredItemId}
          </div>
        )}
      </div>
      
      {/* Statistics Panel */}
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '10px', 
        background: 'rgba(255, 255, 255, 0.95)', 
        padding: '15px', 
        borderRadius: '8px',
        fontSize: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        minWidth: '150px'
      }}>
        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>📊 Statistics</div>
        <div>Items: {placedItems.length}</div>
        <div>Volume: {(truckDimensions.length * truckDimensions.width * truckDimensions.height).toFixed(1)} m³</div>
        <div>Efficiency: {placedItems.length > 0 ? 'Calculating...' : 'N/A'}</div>
      </div>
    </div>
  );
};

export default TruckVisualization; 