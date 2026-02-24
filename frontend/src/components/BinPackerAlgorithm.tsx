import React, { useState } from 'react';
import ItemForm from './ItemForm';
import UserMenu from './UserMenu';
import ExcelImport from './ExcelImport';
import {
  AlertTriangle,
  BarChart3,
  Box,
  ChevronLeft,
  FileSpreadsheet,
  Filter,
  MapPin,
  Inbox,
  Loader2,
  Menu,
  Layers,
  PackagePlus,
  Pencil,
  Rocket,
  Sparkles,
  Trash2,
  Truck,
  Wrench,
} from 'lucide-react';
import { Optimization3DViewer, OptimizationManifest, OptimizationStats } from './ResultsDisplay';
import Modal from './ui/Modal';

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
  void onLogout;
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
  const [stackingPolicy, setStackingPolicy] = useState<{
    mode: StackingMode;
    maxStacks: number;
  }>({
    mode: 'max_weight_stack',
    maxStacks: 3,
  });

  /**
   * Route selection for optimization:
   * - All: optimize all items regardless of route
   * - No Route: include items with empty route
   * - Custom: select one or more explicit routes
   */
  const [routeFilter, setRouteFilter] = useState<{
    mode: 'all' | 'custom';
    includeNoRoute: boolean;
    selectedRoutes: string[];
  }>({ mode: 'all', includeNoRoute: false, selectedRoutes: [] });

  const availableRoutes = Array.from(
    new Set(items.map((it) => String(it.route || '').trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const itemsForOptimization =
    routeFilter.mode === 'all'
      ? items
      : items.filter((it) => {
          const r = String(it.route || '').trim();
          if (!r) return routeFilter.includeNoRoute;
          return routeFilter.selectedRoutes.includes(r);
        });

  const toggleAllRoutes = () => {
    setRouteFilter({ mode: 'all', includeNoRoute: false, selectedRoutes: [] });
  };

  const toggleNoRoute = () => {
    setRouteFilter((prev) => {
      if (prev.mode === 'all') return { mode: 'custom', includeNoRoute: true, selectedRoutes: [] };
      const next = { ...prev, includeNoRoute: !prev.includeNoRoute };
      if (!next.includeNoRoute && next.selectedRoutes.length === 0) return { mode: 'all', includeNoRoute: false, selectedRoutes: [] };
      return next;
    });
  };

  const toggleRoute = (route: string) => {
    setRouteFilter((prev) => {
      if (prev.mode === 'all') return { mode: 'custom', includeNoRoute: false, selectedRoutes: [route] };
      const exists = prev.selectedRoutes.includes(route);
      const nextSelected = exists ? prev.selectedRoutes.filter((r) => r !== route) : [...prev.selectedRoutes, route];
      if (!prev.includeNoRoute && nextSelected.length === 0) return { mode: 'all', includeNoRoute: false, selectedRoutes: [] };
      return { ...prev, selectedRoutes: nextSelected };
    });
  };

  const handleOptimize = async () => {
    const itemsToOptimize = itemsForOptimization;
    
    if (itemsToOptimize.length === 0) {
      setError('No items available for optimization. Please select at least one route (or choose All).');
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
        max_stack_height: stackingPolicy.mode === 'stack_enforcement' ? Math.max(1, Math.floor(stackingPolicy.maxStacks || 1)) : undefined
      }
    };
    console.log('Sending optimization request with data:', requestData);
    console.log('Items to optimize:', itemsToOptimize.length);
    console.log('Total items available:', items.length);
    console.log('Truck dimensions:', truckDimensions);
    console.log('Route filter:', routeFilter);
    
    // Debug: Log each item being sent
    console.log('Items being sent to backend:');
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
      
      console.log('Making API call to:', apiUrl);
      console.log('API_BASE from env:', process.env.REACT_APP_API_BASE_URL);
      console.log('Request data:', requestData);
      
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
          console.log('Error response data:', errorData);
          
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
      console.error('Optimization error:', err);
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

  const clearAll = () => {
    setItems([]);
    setFailedItems([]);
    setNextItemId(1);
    setRouteFilter({ mode: 'all', includeNoRoute: false, selectedRoutes: [] });
    setResult(null);
    setSelectedItemId(null);
    setError(null);
  };

  const openEditItem = (item: any) => {
    setEditingItem({ ...item });
    setIsEditModalOpen(true);
  };

  const removeItemById = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
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
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 h-16 px-6 flex items-center justify-between sticky top-0 z-40 relative overflow-hidden">
        {/* Header aesthetic layers (subtle, non-interactive) */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.10] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-600/10 animate-pulse pointer-events-none" />

        <button
          type="button"
          onClick={onBackToHome}
          className="relative z-10 flex items-center gap-3 min-w-0 text-left hover:opacity-95 transition-opacity duration-200"
          aria-label="Go to landing page"
          title="Go to landing page"
        >
          <img
            src="/brand-logo.png"
            alt="BinPacker"
            className="h-7 w-auto select-none"
            draggable={false}
          />
          <span className="font-semibold text-slate-100 truncate">BinPacker Optimizer</span>
        </button>

        <div className="relative z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-200"
            aria-label="Back to landing page"
            title="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => setIsUserMenuOpen(true)}
            className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-200"
            aria-label="Open user menu"
            title="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Overlays / Modals (kept functional) */}
      <UserMenu isOpen={isUserMenuOpen} onClose={() => setIsUserMenuOpen(false)} onNavigate={handleUserMenuAction} />
      <ExcelImport isOpen={isExcelImportOpen} onClose={() => setIsExcelImportOpen(false)} onImport={handleExcelImport} />
      <Modal
        isOpen={isEditModalOpen && !!editingItem}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Item"
        description={editingItem ? `Item ID: ${editingItem.id}` : undefined}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => editingItem && handleEditItem(editingItem)}
              className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-700 transition-all duration-200"
            >
              Save
            </button>
          </div>
        }
      >
        {editingItem && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Length (m)</label>
                <input
                  type="number"
                  value={editingItem.length || 0}
                  onChange={(e) => setEditingItem({ ...editingItem, length: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                  min="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Width (m)</label>
                <input
                  type="number"
                  value={editingItem.width || 0}
                  onChange={(e) => setEditingItem({ ...editingItem, width: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                  min="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Height (m)</label>
                <input
                  type="number"
                  value={editingItem.height || 0}
                  onChange={(e) => setEditingItem({ ...editingItem, height: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                  min="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={editingItem.weight || 0}
                  onChange={(e) => setEditingItem({ ...editingItem, weight: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                  min="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-slate-700 mb-2">Stackability</div>
                <div className="flex flex-wrap gap-2">
                  {(['stackable', 'semi_stackable', 'unstackable'] as const).map((s) => {
                    const active = editingItem.stackability === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, stackability: s })}
                        className={[
                          'px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200',
                          active
                            ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700 hover:border-purple-700'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                        ].join(' ')}
                      >
                        {s === 'stackable' ? 'Stackable' : s === 'semi_stackable' ? 'Semi-stackable' : 'Unstackable'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-700 mb-2">Priority</div>
                <div className="grid grid-cols-5 gap-2">
                  {(['1', '2', '3', '4', '5'] as const).map((p) => {
                    const active = String(editingItem.priority || '1') === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, priority: p })}
                        className={[
                          'px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200',
                          active
                            ? 'bg-cyan-600 text-white border-cyan-600 hover:bg-cyan-700 hover:border-cyan-700'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                        ].join(' ')}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs text-slate-400">1 is highest priority.</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Route (optional)</label>
                <input
                  type="text"
                  value={editingItem.route || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, route: e.target.value })}
                  placeholder="e.g. Berlin"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  placeholder="Add a note"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Main Content Wrapper */}
      <main className="max-w-[95%] mx-auto px-2 sm:px-4 lg:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel (placeholder for next steps) */}
          <section className="lg:col-span-4">
            <div className="space-y-6">
              {/* Truck Configuration Card */}
              <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-cyan-500 shadow-md hover:shadow-lg transition-shadow p-6">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-cyan-600" />
                  <h2 className="text-sm font-bold text-slate-800">Truck Settings</h2>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Length (m)</label>
                    <input
                      type="number"
                      value={truckDimensions.length}
                      onChange={(e) =>
                        setTruckDimensions({
                          ...truckDimensions,
                          length: parseFloat(e.target.value) || 0,
                        })
                      }
                      step="0.1"
                      min="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Width (m)</label>
                    <input
                      type="number"
                      value={truckDimensions.width}
                      onChange={(e) =>
                        setTruckDimensions({
                          ...truckDimensions,
                          width: parseFloat(e.target.value) || 0,
                        })
                      }
                      step="0.1"
                      min="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Height (m)</label>
                    <input
                      type="number"
                      value={truckDimensions.height}
                      onChange={(e) =>
                        setTruckDimensions({
                          ...truckDimensions,
                          height: parseFloat(e.target.value) || 0,
                        })
                      }
                      step="0.1"
                      min="0"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Add Item Card */}
              <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-cyan-500 shadow-md hover:shadow-lg transition-shadow p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <PackagePlus className="h-5 w-5 text-cyan-600" />
                    <h2 className="text-sm font-bold text-slate-800">Add New Item</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExcelImportOpen(true)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg px-3 py-2 transition-all duration-200"
                    aria-label="Import items from Excel"
                    title="Import from Excel"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-slate-500" />
                    Import
                  </button>
                </div>
                <div className="mt-4">
                  <ItemForm onAddItem={addItem} />
                </div>

                <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-4 w-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700">Stacking Policy</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setStackingPolicy((prev) => ({ ...prev, mode: 'unlimited_stacks' }))}
                      className={[
                        'px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200',
                        stackingPolicy.mode === 'unlimited_stacks'
                          ? 'bg-cyan-600 text-white border-cyan-600 hover:bg-cyan-700 hover:border-cyan-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100',
                      ].join(' ')}
                    >
                      Unlimited stacks
                    </button>
                    <button
                      type="button"
                      onClick={() => setStackingPolicy((prev) => ({ ...prev, mode: 'stack_enforcement' }))}
                      className={[
                        'px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200',
                        stackingPolicy.mode === 'stack_enforcement'
                          ? 'bg-cyan-600 text-white border-cyan-600 hover:bg-cyan-700 hover:border-cyan-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100',
                      ].join(' ')}
                    >
                      Stack enforcement
                    </button>
                    <button
                      type="button"
                      onClick={() => setStackingPolicy((prev) => ({ ...prev, mode: 'max_weight_stack' }))}
                      className={[
                        'px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200',
                        stackingPolicy.mode === 'max_weight_stack'
                          ? 'bg-cyan-600 text-white border-cyan-600 hover:bg-cyan-700 hover:border-cyan-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100',
                      ].join(' ')}
                    >
                      Max weight stack
                    </button>
                  </div>

                  {stackingPolicy.mode === 'stack_enforcement' && (
                    <div className="mt-3 max-w-[220px]">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Maximum stacks</label>
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
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  )}

                  <div className="mt-2 text-xs text-slate-500">
                    {stackingPolicy.mode === 'unlimited_stacks'
                      ? 'No stack count or stack-weight cap is enforced. Other constraints still apply.'
                      : stackingPolicy.mode === 'stack_enforcement'
                        ? 'Enforces only a maximum number of items in each vertical stack.'
                        : 'Enforces weight carrying limits through the support chain for stacked items.'}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Right Panel (placeholder for next steps) */}
          <section className="lg:col-span-8">
            <div className="space-y-6">
              {/* Item Management */}
              <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-cyan-500 shadow-md hover:shadow-lg transition-shadow">
                <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-cyan-600" />
                      <div className="text-sm font-bold text-slate-800">Item Management</div>
                    </div>
                    <div className="text-xs text-slate-400">
                      {items.length} item{items.length === 1 ? '' : 's'}
                    </div>
                  </div>

                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsExcelImportOpen(true)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all duration-200"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Import Excel
                    </button>
                    <button
                      type="button"
                      onClick={cleanupItems}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 transition-all duration-200"
                      title="Normalize priority values"
                    >
                      <Wrench className="h-4 w-4" />
                      Fix Priorities
                    </button>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
                      title="Remove all items"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Current Items List */}
                <div className="p-6">
                  {items.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="mx-auto h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                        <Inbox className="h-6 w-6 text-slate-400" />
                      </div>
                      <div className="mt-4 text-sm font-semibold text-slate-900">No items added yet</div>
                      <div className="mt-1 text-sm text-slate-600">
                        Add items on the left, or import an Excel file to get started.
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left px-4 py-3 font-medium text-slate-600">Route</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-600">Dimensions</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-600">Weight</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-600">Stackability</th>
                            <th className="text-left px-4 py-3 font-medium text-slate-600">Priority</th>
                            <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {items.map((item) => {
                            const p = String(item.priority || '1');
                            const badge =
                              p === '1'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : p === '2'
                                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                                  : p === '3'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : p === '4'
                                      ? 'bg-green-50 text-green-700 border-green-200'
                                      : 'bg-slate-50 text-slate-700 border-slate-200';

                            const stackabilityRaw = String(item.stackability || 'stackable');
                            const stackabilityLabel =
                              stackabilityRaw === 'unstackable'
                                ? 'Unstackable'
                                : stackabilityRaw === 'semi_stackable'
                                  ? 'Semi-stackable'
                                  : 'Stackable';
                            const stackabilityBadge =
                              stackabilityRaw === 'unstackable'
                                ? 'bg-slate-50 text-slate-800 border-slate-200'
                                : stackabilityRaw === 'semi_stackable'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-cyan-50 text-cyan-700 border-cyan-200';
                            const route = String(item.route || '').trim();
                            return (
                              <tr key={item.id} className="border-b border-slate-200 last:border-b-0">
                                <td className="px-4 py-3 text-slate-900" title={route || 'No Route'}>
                                  <div className="inline-flex items-center gap-2 max-w-[260px] min-w-0">
                                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                                    <span className="truncate">{route || 'No Route'}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-slate-900">
                                  {Number(item.length).toFixed(2)} × {Number(item.width).toFixed(2)} ×{' '}
                                  {Number(item.height).toFixed(2)} m
                                </td>
                                <td className="px-4 py-3 text-slate-900">{Number(item.weight).toFixed(2)} kg</td>
                                <td className="px-4 py-3">
                                  <span
                                    className={[
                                      'inline-flex items-center rounded-full px-3 py-1 border text-xs font-semibold',
                                      stackabilityBadge,
                                    ].join(' ')}
                                    title={stackabilityLabel}
                                  >
                                    {stackabilityLabel}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={[
                                      'inline-flex items-center rounded-full px-3 py-1 border text-xs font-semibold',
                                      badge,
                                    ].join(' ')}
                                    title={`Priority: ${p}`}
                                  >
                                    P{p}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openEditItem(item)}
                                      className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all duration-200"
                                      aria-label="Edit item"
                                      title="Edit"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeItemById(String(item.id))}
                                      className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-red-600 hover:bg-red-50 transition-all duration-200"
                                      aria-label="Delete item"
                                      title="Delete"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Failed Items Alert */}
                  {failedItems.length > 0 && (
                    <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">Failed items detected</div>
                          <div className="text-sm">
                            {failedItems.length} item{failedItems.length === 1 ? '' : 's'} could not be imported due to
                            missing required fields. Open Import Excel to review and re-import.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Optimization Action Bar */}
              <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-purple-500 shadow-md hover:shadow-lg transition-shadow p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      <div className="text-sm font-bold text-slate-800">Optimization</div>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      Run the optimizer to generate results and a 3D packing view.
                    </div>
                  </div>
                </div>

                {/* Route selector */}
                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-slate-400" />
                      <div className="text-sm font-semibold text-slate-800">Routes to optimize</div>
                    </div>
                    <div className="text-xs text-slate-500">
                      Optimizing: <span className="font-semibold text-slate-700">{itemsForOptimization.length}</span> item
                      {itemsForOptimization.length === 1 ? '' : 's'}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={toggleAllRoutes}
                      className={[
                        'px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200',
                        routeFilter.mode === 'all'
                          ? 'bg-cyan-600 text-white border-cyan-600 hover:bg-cyan-700 hover:border-cyan-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                      ].join(' ')}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={toggleNoRoute}
                      className={[
                        'px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200',
                        routeFilter.mode === 'custom' && routeFilter.includeNoRoute
                          ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700 hover:border-purple-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                      ].join(' ')}
                      title="Include items without a route"
                    >
                      No Route
                    </button>

                    {availableRoutes.map((r) => {
                      const active = routeFilter.mode === 'custom' && routeFilter.selectedRoutes.includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => toggleRoute(r)}
                          className={[
                            'px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200',
                            active
                              ? 'bg-cyan-600 text-white border-cyan-600 hover:bg-cyan-700 hover:border-cyan-700'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                          ].join(' ')}
                          title={r}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5">
                  {loading ? (
                    <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-center gap-3 text-slate-700">
                      <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
                      <span className="font-medium">Optimizing...</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleOptimize}
                      disabled={itemsForOptimization.length === 0}
                      className={[
                        'w-full inline-flex items-center justify-center gap-2',
                        'py-3 rounded-lg font-bold text-white uppercase tracking-wide',
                        'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700',
                        'shadow-lg shadow-cyan-500/30',
                        'transition-all duration-200',
                        'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:from-cyan-500 disabled:hover:to-purple-600',
                      ].join(' ')}
                    >
                      <Rocket className="h-5 w-5" />
                      Run Optimization
                    </button>
                  )}
                </div>

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    <div className="text-sm font-semibold">Optimization failed</div>
                    <div className="mt-1 text-sm">{error}</div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Results row (no blank space between stats and 3D; manifest matches full height) */}
          {result && (
            <section className="lg:col-span-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left: Loading Sequence (same top as Results; same bottom as 3D) */}
                <div className="lg:col-span-4 lg:h-[700px]">
                  <OptimizationManifest
                    result={result}
                    fillHeight
                    selectedItemId={selectedItemId}
                    onSelectItem={(id) => setSelectedItemId((prev) => (prev === id ? null : id))}
                  />
                </div>

                {/* Right: Stats directly above 3D */}
                <div className="lg:col-span-8 lg:h-[700px]">
                  <div className="flex flex-col gap-4 h-full">
                    <div className="flex-1 min-h-0">
                      <Optimization3DViewer
                        truckDimensions={truckDimensions}
                        placedItems={Array.isArray(result?.placed_items) ? result.placed_items : []}
                        selectedItemId={selectedItemId}
                        fillHeight
                      />
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-purple-500 shadow-md hover:shadow-lg transition-shadow p-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-purple-600" />
                        <div className="text-sm font-bold text-slate-800">Results</div>
                      </div>
                      <div className="mt-3">
                        <OptimizationStats result={result} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default BinPackerAlgorithm; 