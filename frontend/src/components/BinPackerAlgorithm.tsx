import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import TruckVisualization from './TruckVisualization';
import ItemForm from './ItemForm';
import ResultsDisplay from './ResultsDisplay';
import UserMenu from './UserMenu';
import ExcelImport from './ExcelImport';
import './UserMenu.css';
import './ExcelImport.css';

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

type StackingMode = 'unlimited_stacks' | 'stack_enforcement' | 'max_weight_stack';

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
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [failedItems, setFailedItems] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string>('all');
  const [stackingPolicy, setStackingPolicy] = useState<{
    mode: StackingMode;
    maxStacks: number;
  }>({
    mode: 'max_weight_stack',
    maxStacks: 3,
  });

  // Debug logging for failed items
  console.log('Current failedItems state:', failedItems);
  console.log('Current failedItems length:', failedItems.length);

  // Get unique routes from items
  const uniqueRoutes = ['all', ...Array.from(new Set(items.map(item => item.route).filter(Boolean)))];
  
  // Debug logging for routes
  console.log('All items:', items);
  console.log('Items with routes:', items.map(item => ({ id: item.id, route: item.route })));
  console.log('Unique routes found:', uniqueRoutes);
  console.log('Selected route:', selectedRoute);
  
  // Filter items by selected route
  const filteredItems = selectedRoute === 'all' ? items : items.filter(item => item.route === selectedRoute);
  console.log('Filtered items:', filteredItems);

  const handleOptimize = async () => {
    // Use filtered items instead of all items
    const itemsToOptimize = selectedRoute === 'all' ? items : filteredItems;
    
    if (itemsToOptimize.length === 0) {
      setError(`No items available for optimization. ${selectedRoute === 'all' ? 'Please add some items.' : `No items found for route: ${selectedRoute}`}`);
      return;
    }

    setLoading(true);
    setError(null);

    // Debug: Log the data being sent
    const requestData = {
      truck: truckDimensions,
      items: itemsToOptimize.map(item => ({
        ...item,
        // Ensure stackability is in correct format for backend
        stackability: item.stackability?.toLowerCase().replace('-', '_') || 'stackable',
        // Keep both route and destination for backend compatibility
        route: item.route || '',
        destination: item.route || '',
        // Ensure priority is always a valid string
        priority: item.priority?.toString() || '1'
      })),
      algorithm_config: {
        stacking_mode: stackingPolicy.mode,
        max_stack_height:
          stackingPolicy.mode === 'stack_enforcement'
            ? Math.max(1, Math.floor(stackingPolicy.maxStacks || 1))
            : undefined,
      },
    };
    console.log('🚀 Sending optimization request with data:', requestData);
    console.log('📦 Items to optimize:', itemsToOptimize.length);
    console.log('📦 Total items available:', items.length);
    console.log('🚛 Truck dimensions:', truckDimensions);
    console.log('🛣️ Selected route:', selectedRoute);
    
    // Debug: Log each item being sent
    console.log('🔍 Items being sent to backend:');
    requestData.items.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, {
        id: item.id,
        length: item.length,
        width: item.width,
        height: item.height,
        weight: item.weight,
        stackability: item.stackability,
        route: item.route,
        destination: item.destination,
        priority: item.priority
      });
    });

    try {
      // Get API base URL from environment or use default
      const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
      const apiUrl = `${API_BASE}/api/v1/optimize`;
      
      console.log('🌐 Making API call to:', apiUrl);
      console.log('🔧 API_BASE from env:', process.env.REACT_APP_API_BASE_URL);
      console.log('📤 Request data:', requestData);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        // Try to get detailed error message from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.log('🔍 Error response data:', errorData);
          
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              // Handle validation errors array
              const validationErrors = errorData.detail.map((err: any) => 
                `${err.loc?.join('.')}: ${err.msg}`
              ).join(', ');
              errorMessage += ` - Validation errors: ${validationErrors}`;
            } else {
              errorMessage += ` - ${errorData.detail}`;
            }
          } else if (errorData.message || errorData.error) {
            errorMessage += ` - ${errorData.message || errorData.error}`;
          }
        } catch (e) {
          console.log('Could not parse error response:', e);
          // If we can't parse error response, just use status
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('❌ Optimization error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addItem = (item: any) => {
    // Always assign the next sequential ID and ensure priority is valid
    const assignedId = String(nextItemId);
    const itemWithDefaults = {
      ...item,
      id: assignedId,
      priority: item.priority?.toString() || '1',
      route: item.route || '',
      stackability: item.stackability || 'stackable'
    };
    setItems([...items, itemWithDefaults]);
    setNextItemId(nextItemId + 1);
  };

  // Clean up existing items to ensure all have valid priority values
  const cleanupItems = () => {
    setItems(prevItems => 
      prevItems.map(item => ({
        ...item,
        priority: (item.priority || '1').toString(),
        route: item.route || '',
        stackability: item.stackability || 'stackable'
      }))
    );
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

  const handleEditItem = (editedItem: any) => {
    if (editingItem) {
      // Check if this was a failed item
      const isFailedItem = failedItems.some(item => item.id === editingItem.id);
      
      if (isFailedItem) {
        // Move from failed items to main items if all required fields are present
        if (editedItem.length && editedItem.width && editedItem.height && editedItem.weight) {
          setItems(prevItems => [...prevItems, editedItem]);
          setFailedItems(prevFailed => prevFailed.filter(item => item.id !== editingItem.id));
          console.log('Failed item fixed and moved to main items');
        } else {
          // Update the failed item with new data
          setFailedItems(prevFailed => 
            prevFailed.map(item => 
              item.id === editingItem.id ? { ...editedItem, failureReason: item.failureReason } : item
            )
          );
        }
      } else {
        // Update existing item in main items
        setItems(prevItems => 
          prevItems.map(item => 
            item.id === editingItem.id ? editedItem : item
          )
        );
      }
      
      setEditingItem(null);
      setIsEditModalOpen(false);
    }
  };

    const handleExcelImport = (importedData: any[], mapping: any) => {
    try {
      console.log('Excel Import - Raw data:', importedData);
      console.log('Excel Import - Mapping:', mapping);
      
      const validItems: any[] = [];
      const failedItemsList: any[] = [];
      
      // Process each imported item
      let currentId = nextItemId;
      importedData.forEach((item, index) => {
        console.log(`Processing imported item ${index}:`, item);
        console.log(`Item route value: "${item.route}"`);
        console.log(`Item has route field: ${'route' in item}`);
        
        // Check if item has all required fields
        const hasRequiredFields = item.length && item.width && item.height && item.weight;
        
        if (hasRequiredFields) {
          // Handle duplicate functionality
          const duplicateCount = parseInt(item.duplicate) || 1;
          const actualCount = duplicateCount > 0 ? duplicateCount : 1;
          
          for (let i = 0; i < actualCount; i++) {
            const transformedItem = {
              id: String(currentId), // Use current ID and increment
              length: parseFloat(item.length) || 0,
              width: parseFloat(item.width) || 0,
              height: parseFloat(item.height) || 0,
              weight: parseFloat(item.weight) || 0,
              stackability: item.stackability || 'stackable',
              route: item.route || '',
              priority: (item.priority || '1').toString(), // Ensure priority is always a string
              notes: item.notes || ''
            };
            console.log(`Transformed item ${i}:`, transformedItem);
            validItems.push(transformedItem);
            currentId++; // Increment for next item
          }
        } else {
          // Add to failed items with reason
          const failedItem = {
            ...item,
            id: item.id || `failed_${index}`,
            failureReason: `Missing required fields: ${[
              !item.length && 'Length',
              !item.width && 'Width', 
              !item.height && 'Height',
              !item.weight && 'Weight'
            ].filter(Boolean).join(', ')}`
          };
          failedItemsList.push(failedItem);
        }
      });

      // Add valid items to main items list
      if (validItems.length > 0) {
        setItems(prevItems => [...prevItems, ...validItems]);
        setNextItemId(currentId); // Use the final currentId value
        console.log(`Successfully imported ${validItems.length} items from Excel`);
        console.log(`Next item ID will be: ${currentId}`);
      }

      // Add failed items to failed items list
      if (failedItemsList.length > 0) {
        setFailedItems(prevFailed => [...prevFailed, ...failedItemsList]);
        console.log(`${failedItemsList.length} items failed to import and added to failed items queue`);
        console.log('Failed items details:', failedItemsList);
        console.log('Current failedItems state length:', failedItems.length);
      }

      // Close the import modal
      setIsExcelImportOpen(false);
      
    } catch (error) {
      console.error('Error in handleExcelImport:', error);
      setError('Failed to import Excel data. Please check the file format.');
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

        {/* Excel Import Component */}
        <ExcelImport 
          isOpen={isExcelImportOpen}
          onClose={() => setIsExcelImportOpen(false)}
          onImport={handleExcelImport}
        />

        {/* Edit Item Modal */}
        {isEditModalOpen && editingItem && (
          <div className="edit-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
            <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
              <div className="edit-modal-header">
                <h3>✏️ Edit Item: {editingItem.id}</h3>
                <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>×</button>
              </div>
              <div className="edit-modal-content">
                <div className="edit-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Length (m)</label>
                      <input
                        type="number"
                        value={editingItem.length || ''}
                        onChange={(e) => setEditingItem({...editingItem, length: parseFloat(e.target.value) || 0})}
                        step="0.1"
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Width (m)</label>
                      <input
                        type="number"
                        value={editingItem.width || ''}
                        onChange={(e) => setEditingItem({...editingItem, width: parseFloat(e.target.value) || 0})}
                        step="0.1"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Height (m)</label>
                      <input
                        type="number"
                        value={editingItem.height || ''}
                        onChange={(e) => setEditingItem({...editingItem, height: parseFloat(e.target.value) || 0})}
                        step="0.1"
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Weight (kg)</label>
                      <input
                        type="number"
                        value={editingItem.weight || ''}
                        onChange={(e) => setEditingItem({...editingItem, weight: parseFloat(e.target.value) || 0})}
                        step="0.1"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                                         <div className="form-group">
                       <label>Stackability</label>
                       <select
                         value={editingItem.stackability || 'stackable'}
                         onChange={(e) => setEditingItem({...editingItem, stackability: e.target.value})}
                       >
                         <option value="stackable">Stackable</option>
                         <option value="semi_stackable">Semi-stackable</option>
                         <option value="unstackable">Unstackable</option>
                       </select>
                     </div>
                                         <div className="form-group">
                       <label>Priority (Loading Order)</label>
                       <select
                         value={editingItem.priority || '1'}
                         onChange={(e) => setEditingItem({...editingItem, priority: e.target.value})}
                       >
                         <option value="1">1 - First Priority</option>
                         <option value="2">2 - Second Priority</option>
                         <option value="3">3 - Third Priority</option>
                         <option value="4">4 - Fourth Priority</option>
                         <option value="5">5 - Fifth Priority</option>
                       </select>
                     </div>
                  </div>
                                     <div className="form-group">
                     <label>Route</label>
                     <input
                       type="text"
                       value={editingItem.route || ''}
                       onChange={(e) => setEditingItem({...editingItem, route: e.target.value})}
                       placeholder="Enter route"
                     />
                   </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <textarea
                      value={editingItem.notes || ''}
                      onChange={(e) => setEditingItem({...editingItem, notes: e.target.value})}
                      placeholder="Enter notes"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="edit-modal-actions">
                  <button className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={() => handleEditItem(editingItem)}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      
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
          <div className="section-header">
            <h2>Items to Pack</h2>
            <div className="section-actions">
              <button 
                onClick={() => setIsExcelImportOpen(true)}
                className="excel-import-btn"
                title="Import items from Excel file"
              >
                📊 Import Excel
              </button>
            </div>
          </div>
          <ItemForm onAddItem={addItem} />
          <div style={{ marginTop: '16px', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', background: '#f8f9fa' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Stacking Policy</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setStackingPolicy((prev) => ({ ...prev, mode: 'unlimited_stacks' }))}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  background: stackingPolicy.mode === 'unlimited_stacks' ? '#0d6efd' : '#fff',
                  color: stackingPolicy.mode === 'unlimited_stacks' ? '#fff' : '#333',
                  cursor: 'pointer',
                }}
              >
                Unlimited stacks
              </button>
              <button
                type="button"
                onClick={() => setStackingPolicy((prev) => ({ ...prev, mode: 'stack_enforcement' }))}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  background: stackingPolicy.mode === 'stack_enforcement' ? '#0d6efd' : '#fff',
                  color: stackingPolicy.mode === 'stack_enforcement' ? '#fff' : '#333',
                  cursor: 'pointer',
                }}
              >
                Stack enforcement
              </button>
              <button
                type="button"
                onClick={() => setStackingPolicy((prev) => ({ ...prev, mode: 'max_weight_stack' }))}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  background: stackingPolicy.mode === 'max_weight_stack' ? '#0d6efd' : '#fff',
                  color: stackingPolicy.mode === 'max_weight_stack' ? '#fff' : '#333',
                  cursor: 'pointer',
                }}
              >
                Max weight stack
              </button>
            </div>
            {stackingPolicy.mode === 'stack_enforcement' && (
              <div style={{ marginTop: '10px', maxWidth: '220px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Maximum stacks</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={stackingPolicy.maxStacks}
                  onChange={(e) =>
                    setStackingPolicy((prev) => ({
                      ...prev,
                      maxStacks: Math.max(1, Math.floor(Number(e.target.value) || 1)),
                    }))
                  }
                />
              </div>
            )}
          </div>
          
           {items.length > 0 && (
             <div style={{ marginTop: '20px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                 <h3>Current Items ({filteredItems.length})</h3>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <label style={{ fontWeight: 'bold' }}>Route: </label>
                   <select
                     value={selectedRoute}
                     onChange={(e) => setSelectedRoute(e.target.value)}
                     style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                   >
                     {uniqueRoutes.map(route => (
                       <option key={route} value={route}>
                         {route === 'all' ? 'All Routes' : route}
                       </option>
                     ))}
                   </select>
                   <button
                     onClick={cleanupItems}
                     style={{
                       background: '#28a745',
                       color: 'white',
                       border: 'none',
                       padding: '5px 10px',
                       borderRadius: '4px',
                       cursor: 'pointer',
                       fontSize: '0.9rem',
                       marginRight: '10px'
                     }}
                     title="Fix priority values for all items"
                   >
                     🔧 Fix Priorities
                   </button>
                   <button
                     onClick={() => {
                       setItems([]);
                       setNextItemId(1);
                       setSelectedRoute('all');
                     }}
                     style={{
                       background: '#dc3545',
                       color: 'white',
                       border: 'none',
                       padding: '5px 10px',
                       borderRadius: '4px',
                       cursor: 'pointer',
                       fontSize: '0.9rem'
                     }}
                     title="Remove all items"
                   >
                     🗑️ Remove All
                   </button>
                 </div>
               </div>
               <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                 {filteredItems.map((item, index) => {
                   // Priority-based colors
                   const priorityColors: { [key: string]: string } = {
                     '1': '#e3f2fd', // Light blue for priority 1
                     '2': '#f3e5f5', // Light purple for priority 2
                     '3': '#fff3e0', // Light orange for priority 3
                     '4': '#f1f8e9', // Light green for priority 4
                     '5': '#ffebee'  // Light red for priority 5
                   };
                   
                   return (
                     <div key={item.id} style={{ 
                       padding: '10px', 
                       border: '1px solid #ddd', 
                       marginBottom: '5px', 
                       borderRadius: '4px',
                       backgroundColor: priorityColors[item.priority] || '#ffffff',
                       display: 'flex',
                       justifyContent: 'space-between',
                       alignItems: 'center'
                     }}>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                         <span style={{ fontWeight: 'bold' }}>
                           {index + 1}: {item.length}m × {item.width}m × {item.height}m ({item.weight}kg)
                         </span>
                         <span style={{ fontSize: '0.9rem', color: '#666' }}>
                           Route: {item.route || 'N/A'} | Priority: {item.priority} | Stackability: {item.stackability}
                         </span>
                       </div>
                       <div style={{ display: 'flex', gap: '8px' }}>
                         <button 
                           onClick={() => {
                             setEditingItem(item);
                             setIsEditModalOpen(true);
                           }}
                           style={{ 
                             background: '#ffc107', 
                             color: '#212529', 
                             border: 'none', 
                             padding: '5px 10px', 
                             borderRadius: '3px',
                             cursor: 'pointer'
                           }}
                         >
                           ✏️ Edit
                         </button>
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
                           🗑️ Remove
                         </button>
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>
           )}

          {/* Failed Items Queue */}
          {/* Debug: Always show failed items section */}
          <div style={{ marginTop: '20px' }}>
            <h3>❌ Failed Items ({failedItems.length})</h3>
            {failedItems.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No failed items at the moment</p>
            ) : (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {failedItems.map((item, index) => (
                  <div key={item.id} style={{ 
                    padding: '10px', 
                    border: '1px solid #dc3545', 
                    marginBottom: '5px', 
                    borderRadius: '4px',
                    backgroundColor: '#f8d7da',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#721c24', fontWeight: 'bold', marginBottom: '4px' }}>
                        {item.id}: {item.length || 0}m × {item.width || 0}m × {item.height || 0}m ({item.weight || 0}kg)
                      </div>
                      <div style={{ color: '#721c24', fontSize: '0.9rem' }}>
                        {item.failureReason}
                      </div>
                      <div style={{ color: '#721c24', fontSize: '0.9rem' }}>
                        Route: {item.route || 'N/A'} | Priority: {item.priority || 'N/A'} | Stackability: {item.stackability || 'N/A'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => {
                          setEditingItem(item);
                          setIsEditModalOpen(true);
                        }}
                        style={{ 
                          background: '#ffc107', 
                          color: '#212529', 
                          border: 'none', 
                          padding: '5px 10px', 
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        onClick={() => {
                          setFailedItems(prev => prev.filter((_, i) => i !== index));
                        }}
                        style={{ 
                          background: '#dc3545', 
                          color: 'white', 
                          border: 'none', 
                          padding: '5px 10px', 
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Optimization Button */}
        <div className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>
              {selectedRoute === 'all' 
                ? `Will optimize ${items.length} items from all routes`
                : `Will optimize ${filteredItems.length} items from route: ${selectedRoute}`
              }
            </span>
          </div>
          <button 
            className="btn" 
            onClick={handleOptimize}
            disabled={loading || (selectedRoute === 'all' ? items.length === 0 : filteredItems.length === 0)}
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