import React, { useState } from 'react';

interface OptimizationDashboardProps {
  result: any;
  onExportResults?: () => void;
  onSaveConfiguration?: () => void;
}

const OptimizationDashboard: React.FC<OptimizationDashboardProps> = ({ 
  result, 
  onExportResults, 
  onSaveConfiguration 
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'analysis'>('summary');

  const calculateEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return '#28a745';
    if (efficiency >= 75) return '#ffc107';
    if (efficiency >= 60) return '#fd7e14';
    return '#dc3545';
  };

  const formatTime = (seconds: number) => {
    if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
    return `${seconds.toFixed(3)}s`;
  };

  const formatVolume = (volume: number) => {
    return `${volume.toFixed(3)} m³`;
  };

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(1)} kg`;
  };

  return (
    <div className="optimization-dashboard">
      <div className="dashboard-header">
        <h2>📊 Optimization Results Dashboard</h2>
        <div className="dashboard-actions">
          {onExportResults && (
            <button className="btn btn-secondary" onClick={onExportResults}>
              📥 Export Results
            </button>
          )}
          {onSaveConfiguration && (
            <button className="btn btn-secondary" onClick={onSaveConfiguration}>
              💾 Save Configuration
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          📈 Summary
        </button>
        <button 
          className={`tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          📋 Details
        </button>
        <button 
          className={`tab ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          🔍 Analysis
        </button>
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {activeTab === 'summary' && (
          <div className="summary-tab">
            {/* Key Metrics */}
            <div className="metrics-grid">
              <div className="metric-card" style={{ borderColor: calculateEfficiencyColor(result.efficiency) }}>
                <div className="metric-icon">📊</div>
                <div className="metric-value" style={{ color: calculateEfficiencyColor(result.efficiency) }}>
                  {result.efficiency}%
                </div>
                <div className="metric-label">Efficiency</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon">✅</div>
                <div className="metric-value">{result.statistics.items_placed}</div>
                <div className="metric-label">Items Placed</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon">❌</div>
                <div className="metric-value">{result.statistics.items_unplaced}</div>
                <div className="metric-label">Items Unplaced</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon">⚖️</div>
                <div className="metric-value">{formatWeight(result.total_weight)}</div>
                <div className="metric-label">Total Weight</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon">⏱️</div>
                <div className="metric-value">{formatTime(result.execution_time)}</div>
                <div className="metric-label">Execution Time</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-icon">📦</div>
                <div className="metric-value">{result.statistics.total_items}</div>
                <div className="metric-label">Total Items</div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="quick-stats">
              <div className="stat-item">
                <span className="stat-label">Success Rate:</span>
                <span className="stat-value">
                  {((result.statistics.items_placed / result.statistics.total_items) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Truck Volume:</span>
                <span className="stat-value">
                  {formatVolume(result.truck_dimensions[0] * result.truck_dimensions[1] * result.truck_dimensions[2])}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Optimization Date:</span>
                <span className="stat-value">
                  {new Date(result.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="details-tab">
            <div className="details-grid">
              {/* Placed Items */}
              <div className="details-section">
                <h3>✅ Placed Items ({result.placed_items.length})</h3>
                <div className="items-list">
                  {result.placed_items.map((item: any, index: number) => (
                    <div key={index} className="item-card placed">
                      <div className="item-header">
                        <strong>{item.id}</strong>
                        <span className="item-volume">{formatVolume(item.volume)}</span>
                      </div>
                      <div className="item-details">
                        <div>Position: ({item.position.x.toFixed(2)}, {item.position.y.toFixed(2)}, {item.position.z.toFixed(2)})</div>
                        <div>Dimensions: {item.dimensions.length.toFixed(2)}m × {item.dimensions.width.toFixed(2)}m × {item.dimensions.height.toFixed(2)}m</div>
                        <div>Weight: {formatWeight(item.weight)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unplaced Items */}
              <div className="details-section">
                <h3>❌ Unplaced Items ({result.unplaced_items.length})</h3>
                <div className="items-list">
                  {result.unplaced_items.map((item: any, index: number) => (
                    <div key={index} className="item-card unplaced">
                      <div className="item-header">
                        <strong>{item.id}</strong>
                        <span className="item-volume">{formatVolume(item.volume)}</span>
                      </div>
                      <div className="item-details">
                        <div>Dimensions: {item.length.toFixed(2)}m × {item.width.toFixed(2)}m × {item.height.toFixed(2)}m</div>
                        <div>Weight: {formatWeight(item.weight)}</div>
                        <div className="unplaced-reason">Could not fit in available space</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="analysis-tab">
            <div className="analysis-grid">
              {/* Volume Analysis */}
              <div className="analysis-section">
                <h3>📦 Volume Analysis</h3>
                <div className="volume-breakdown">
                  <div className="volume-item">
                    <span>Total Truck Volume:</span>
                    <span>{formatVolume(result.truck_dimensions[0] * result.truck_dimensions[1] * result.truck_dimensions[2])}</span>
                  </div>
                  <div className="volume-item">
                    <span>Used Volume:</span>
                    <span>{formatVolume(result.placed_items.reduce((sum: number, item: any) => sum + item.volume, 0))}</span>
                  </div>
                  <div className="volume-item">
                    <span>Unused Volume:</span>
                    <span>{formatVolume((result.truck_dimensions[0] * result.truck_dimensions[1] * result.truck_dimensions[2]) - result.placed_items.reduce((sum: number, item: any) => sum + item.volume, 0))}</span>
                  </div>
                </div>
              </div>

              {/* Weight Analysis */}
              <div className="analysis-section">
                <h3>⚖️ Weight Analysis</h3>
                <div className="weight-breakdown">
                  <div className="weight-item">
                    <span>Total Weight:</span>
                    <span>{formatWeight(result.total_weight)}</span>
                  </div>
                  <div className="weight-item">
                    <span>Average Item Weight:</span>
                    <span>{formatWeight(result.total_weight / result.statistics.items_placed)}</span>
                  </div>
                  <div className="weight-item">
                    <span>Unplaced Weight:</span>
                    <span>{formatWeight(result.unplaced_items.reduce((sum: number, item: any) => sum + item.weight, 0))}</span>
                  </div>
                </div>
              </div>

              {/* Performance Analysis */}
              <div className="analysis-section">
                <h3>🚀 Performance Analysis</h3>
                <div className="performance-breakdown">
                  <div className="performance-item">
                    <span>Execution Time:</span>
                    <span>{formatTime(result.execution_time)}</span>
                  </div>
                  <div className="performance-item">
                    <span>Items Processed:</span>
                    <span>{result.statistics.total_items}</span>
                  </div>
                  <div className="performance-item">
                    <span>Success Rate:</span>
                    <span>{((result.statistics.items_placed / result.statistics.total_items) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizationDashboard; 