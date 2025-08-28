import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import TruckVisualization from './TruckVisualization';
import ItemForm from './ItemForm';
import ResultsDisplay from './ResultsDisplay';
import UserMenu from './UserMenu';
import './UserMenu.css';

interface BinPackerAlgorithmProps {
  onBackToHome: () => void;
  onLogout: () => void;
}

interface OptimizationResult {
  success: boolean;
  efficiency: number;
  total_weight: number;
  truck_dimensions: number[];
  placed_items: any[];
  unplaced_items: any[];
  statistics: {
    items_placed: number;
    items_unplaced: number;
    total_items: number;
  };
  execution_time: number;
  timestamp: string;
}

const BinPackerAlgorithm: React.FC<BinPackerAlgorithmProps> = ({ onBackToHome, onLogout }) => {
  const { user } = useAuth();
  const [truckDimensions, setTruckDimensions] = useState({
    length: 13.62,
    width: 2.48,
    height: 2.7
  });
  const [items, setItems] = useState<any[]>([]);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextItemId, setNextItemId] = useState<number>(1);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleOptimize = async () => {
    if (items.length === 0) {
      setError('Please add at least one item before optimizing.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          truck: truckDimensions,
          items: items
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addItem = (item: any) => {
    const assignedId = (item.id && item.id.toString().trim() !== '') ? item.id.toString().trim() : String(nextItemId);
    setItems([...items, { ...item, id: assignedId }]);
    if (!item.id || item.id.toString().trim() === '') {
      setNextItemId(nextItemId + 1);
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUserMenuAction = (action: string) => {
    switch (action) {
      case 'profile':
        // TODO: Navigate to user profile
        console.log('Navigate to user profile');
        break;
      case 'data':
        // TODO: Navigate to data management
        console.log('Navigate to data management');
        break;
      case 'saved':
        // TODO: Navigate to saved runs
        console.log('Navigate to saved optimization runs');
        break;
      case 'history':
        // TODO: Navigate to history
        console.log('Navigate to optimization history');
        break;
      case 'analytics':
        // TODO: Navigate to analytics
        console.log('Navigate to performance analytics');
        break;
      case 'settings':
        // TODO: Navigate to settings
        console.log('Navigate to settings');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <div className="binpacker-algorithm">
      {/* Header with Navigation */}
      <div className="algorithm-header">
        <div className="header-left">
          <h1>🚛 3D Bin Packing Optimizer</h1>
          <p>Advanced algorithm for truck loading optimization</p>
        </div>
        <div className="header-right">
          <div className="user-info">
            <p>Logged in as: <strong>{user?.email}</strong></p>
          </div>
          <div className="navigation-buttons">
            <button 
              onClick={onBackToHome}
              className="nav-button back-button"
            >
              ← Back
            </button>
            <button 
              onClick={() => setIsUserMenuOpen(true)}
              className="nav-button menu-button"
              aria-label="Open user menu"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* User Menu Component */}
      <UserMenu 
        isOpen={isUserMenuOpen}
        onClose={() => setIsUserMenuOpen(false)}
        onNavigate={handleUserMenuAction}
      />

      <div className="container">
        {/* Truck Configuration */}
        <div className="form-section">
          <h2>Truck Configuration</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Length (m)</label>
              <input
                type="number"
                value={truckDimensions.length}
                onChange={(e) => setTruckDimensions({
                  ...truckDimensions,
                  length: parseFloat(e.target.value) || 0
                })}
                step="0.1"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Width (m)</label>
              <input
                type="number"
                value={truckDimensions.width}
                onChange={(e) => setTruckDimensions({
                  ...truckDimensions,
                  width: parseFloat(e.target.value) || 0
                })}
                step="0.1"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Height (m)</label>
              <input
                type="number"
                value={truckDimensions.height}
                onChange={(e) => setTruckDimensions({
                  ...truckDimensions,
                  height: parseFloat(e.target.value) || 0
                })}
                step="0.1"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Item Management */}
        <div className="form-section">
          <h2>Items to Pack</h2>
          <ItemForm onAddItem={addItem} />
          
          {items.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3>Current Items ({items.length})</h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {items.map((item, index) => (
                  <div key={item.id} style={{ 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    marginBottom: '5px', 
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>
                      {item.id}: {item.length}m × {item.width}m × {item.height}m ({item.weight}kg)
                    </span>
                    <button 
                      onClick={() => removeItem(index)}
                      style={{ 
                        background: '#dc3545', 
                        color: 'white', 
                        border: 'none', 
                        padding: '5px 10px', 
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Optimization Button */}
        <div className="form-section">
          <button 
            className="btn" 
            onClick={handleOptimize}
            disabled={loading || items.length === 0}
          >
            {loading ? 'Optimizing...' : '🚀 Run Optimization'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Loading Display */}
        {loading && (
          <div className="loading">
            <p>🔄 Running optimization algorithm...</p>
            <p>This may take a few seconds...</p>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="results-section">
            <h2>Optimization Results</h2>
            <ResultsDisplay 
              result={result} 
              onSelectItem={(id: string) => setSelectedItemId(prev => prev === id ? null : id)}
              selectedItemId={selectedItemId}
            />
          </div>
        )}

        {/* 3D Visualization */}
        {result && result.placed_items.length > 0 && (
          <div className="form-section">
            <h2>3D Visualization</h2>
            <div className="visualization-container">
              <TruckVisualization 
                truckDimensions={truckDimensions}
                placedItems={result.placed_items}
                selectedItemId={selectedItemId}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BinPackerAlgorithm; 