import React from 'react';

interface ResultsDisplayProps {
  result: any;
  onSelectItem?: (id: string) => void;
  selectedItemId?: string | null;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, onSelectItem, selectedItemId }) => {
  return (
    <div>
      {/* Summary Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ textAlign: 'center', padding: '15px', background: '#e3f2fd', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Efficiency</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#1976d2' }}>
            {result.efficiency}%
          </p>
        </div>
        
        <div style={{ textAlign: 'center', padding: '15px', background: '#e8f5e8', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>Items Placed</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#2e7d32' }}>
            {result.statistics.items_placed}
          </p>
        </div>
        
        <div style={{ textAlign: 'center', padding: '15px', background: '#fff3e0', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>Total Weight</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#f57c00' }}>
            {result.total_weight} kg
          </p>
        </div>
        
        <div style={{ textAlign: 'center', padding: '15px', background: '#fce4ec', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#c2185b' }}>Execution Time</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#c2185b' }}>
            {result.execution_time.toFixed(3)}s
          </p>
        </div>
      </div>

      {/* Detailed Results */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Placed Items */}
        <div>
          <h3>✅ Placed Items ({result.placed_items.length})</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {result.placed_items.map((item: any, index: number) => (
              <div key={index} onClick={() => onSelectItem && onSelectItem(item.id)} style={{ 
                padding: '10px', 
                border: '1px solid #4caf50', 
                marginBottom: '5px', 
                borderRadius: '4px',
                background: selectedItemId === item.id ? '#c8e6c9' : '#f1f8e9',
                cursor: onSelectItem ? 'pointer' : 'default'
              }}>
                <strong>{item.id}</strong> — <em>{(item.stackability || 'stackable').toString()}</em><br />
                Position: ({item.position.x.toFixed(2)}, {item.position.y.toFixed(2)}, {item.position.z.toFixed(2)})<br />
                Dimensions: {item.dimensions.length.toFixed(2)}m × {item.dimensions.width.toFixed(2)}m × {item.dimensions.height.toFixed(2)}m<br />
                Weight: {item.weight} kg
              </div>
            ))}
          </div>
        </div>

        {/* Unplaced Items */}
        <div>
          <h3>❌ Unplaced Items ({result.unplaced_items.length})</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {result.unplaced_items.map((item: any, index: number) => (
              <div key={index} style={{ 
                padding: '10px', 
                border: '1px solid #f44336', 
                marginBottom: '5px', 
                borderRadius: '4px',
                background: '#ffebee'
              }}>
                <strong>{item.id}</strong> — <em>{(item.stackability || 'stackable').toString()}</em><br />
                Volume: {item.volume.toFixed(3)} m³<br />
                Weight: {item.weight} kg
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Truck Information */}
      <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Truck Information</h3>
        <p><strong>Dimensions:</strong> {result.truck_dimensions[0]}m × {result.truck_dimensions[1]}m × {result.truck_dimensions[2]}m</p>
        <p><strong>Total Volume:</strong> {(result.truck_dimensions[0] * result.truck_dimensions[1] * result.truck_dimensions[2]).toFixed(2)} m³</p>
        <p><strong>Optimization Time:</strong> {new Date(result.timestamp).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default ResultsDisplay; 