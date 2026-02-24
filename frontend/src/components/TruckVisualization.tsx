import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { RefreshCcw, ZoomIn, ZoomOut } from 'lucide-react';

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
  containerClassName?: string;
  useAspectVideo?: boolean;
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
            background: 'rgba(255, 255, 255, 0.9)',
            color: '#0f172a',
            border: '1px solid rgba(148, 163, 184, 0.6)',
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
          color="#e2e8f0"
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
          <lineBasicMaterial color="#0891b2" opacity={0.55} transparent />
        </lineSegments>
      )}
    </group>
  );
};

// Main Visualization Component
const TruckVisualization: React.FC<TruckVisualizationProps> = ({ 
  truckDimensions, 
  placedItems,
  showLabels = true,
  showWireframe = true,
  selectedItemId = null,
  containerClassName,
  useAspectVideo = true,
}) => {
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);


  const getCameraPosition = (): [number, number, number] => {
    const maxDim = Math.max(truckDimensions.length, truckDimensions.width, truckDimensions.height);
    const distance = maxDim * 2;
    const centerX = truckDimensions.length / 2;
    const centerY = truckDimensions.height / 2;
    const centerZ = truckDimensions.width / 2;
    
    // Default camera position - slightly elevated and offset for good overview
    return [centerX + distance, centerY + distance, centerZ + distance];
  };

  useEffect(() => {
    if (!controlsRef.current) return;
    const centerX = truckDimensions.length / 2;
    const centerY = truckDimensions.height / 2;
    const centerZ = truckDimensions.width / 2;
    controlsRef.current.target.set(centerX, centerY, centerZ);
    controlsRef.current.update();
  }, [truckDimensions, placedItems]);

  const zoomBy = (factor: number) => {
    const c = controlsRef.current;
    if (!c) return;
    const cam = c.object as THREE.PerspectiveCamera;
    const target = c.target as THREE.Vector3;
    const dir = new THREE.Vector3().subVectors(cam.position, target);

    // Clamp distance for safety
    const currentDist = dir.length();
    const nextDist = THREE.MathUtils.clamp(currentDist * factor, 2, 100);
    dir.setLength(nextDist);
    cam.position.copy(target.clone().add(dir));
    cam.updateProjectionMatrix();
    c.update();
  };

  return (
    <div
      className={[
        'bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative',
        useAspectVideo ? 'aspect-video' : '',
        containerClassName || '',
      ].join(' ').trim()}
    >
      {/* In-viewport toolbar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={() => zoomBy(0.85)}
          className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-slate-700 hover:bg-white transition-all duration-200"
          aria-label="Zoom in"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1.15)}
          className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-slate-700 hover:bg-white transition-all duration-200"
          aria-label="Zoom out"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => controlsRef.current?.reset?.()}
          className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-slate-700 hover:bg-white transition-all duration-200"
          aria-label="Reset view"
          title="Reset"
        >
          <RefreshCcw className="h-4 w-4" />
        </button>
      </div>

      <Canvas
        style={{ width: '100%', height: '100%' }}
        camera={{
          position: getCameraPosition(),
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        shadows
      >
        {/* Match the light viewport background */}
        <color attach="background" args={['#f1f5f9']} />

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
            '#cbd5e1', 
            '#cbd5e1'
          ]} 
          position={[truckDimensions.length / 2, 0.001, truckDimensions.width / 2]}
        />
        
        {/* Axes helper */}
        <axesHelper args={[Math.max(truckDimensions.length, truckDimensions.width, truckDimensions.height)]} position={[0, 0.002, 0]} />
      </Canvas>
    </div>
  );
};

export default TruckVisualization; 