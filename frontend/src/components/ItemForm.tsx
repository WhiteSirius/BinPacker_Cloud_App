import React, { useState } from 'react';
import { Flag, Layers, MapPin } from 'lucide-react';

interface ItemFormProps {
  onAddItem: (item: any) => void;
}

type Stackability = 'stackable' | 'semi_stackable' | 'unstackable';

const INPUT_BASE =
  'w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500';

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-xs font-medium text-slate-700 mb-1">{children}</label>
);

const TogglePill: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accent?: 'cyan' | 'purple';
}> = ({ active, onClick, children, accent = 'cyan' }) => {
  const activeClasses =
    accent === 'cyan' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-purple-600 text-white border-purple-600';
  const hoverClasses = accent === 'cyan' ? 'hover:bg-cyan-700 hover:border-cyan-700' : 'hover:bg-purple-700 hover:border-purple-700';

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200',
        active ? activeClasses : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
        active ? hoverClasses : '',
      ].join(' ')}
    >
      {children}
    </button>
  );
};

const ItemForm: React.FC<ItemFormProps> = ({ onAddItem }) => {
  const [item, setItem] = useState({
    length: 1.0,
    width: 0.8,
    height: 0.6,
    weight: 50.0,
    route: '',
    stackability: 'stackable' as Stackability,
    priority: '1',
  });

  // Store last used values for quick repeated item creation
  const [lastValues, setLastValues] = useState({
    length: 1.0,
    width: 0.8,
    height: 0.6,
    weight: 50.0,
    route: '',
    stackability: 'stackable' as Stackability,
    priority: '1',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item.length > 0 && item.width > 0 && item.height > 0 && item.weight > 0) {
      onAddItem({
        ...item
      });
      
      // Save current values as last used values (excluding ID)
      const newLastValues = {
        length: item.length,
        width: item.width,
        height: item.height,
        weight: item.weight,
        route: item.route,
        stackability: item.stackability,
        priority: item.priority
      };
      
      setLastValues(newLastValues);
      
      // Reset form, preserving last values
      setItem({
        length: newLastValues.length,
        width: newLastValues.width,
        height: newLastValues.height,
        weight: newLastValues.weight,
        route: newLastValues.route,
        stackability: newLastValues.stackability,
        priority: newLastValues.priority
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Length (m)</FieldLabel>
          <input
            className={INPUT_BASE}
            type="number"
            inputMode="decimal"
            value={item.length}
            onChange={(e) => setItem({ ...item, length: parseFloat(e.target.value) || 0 })}
            step="0.1"
            min="0"
            required
          />
        </div>
        <div>
          <FieldLabel>Width (m)</FieldLabel>
          <input
            className={INPUT_BASE}
            type="number"
            inputMode="decimal"
            value={item.width}
            onChange={(e) => setItem({ ...item, width: parseFloat(e.target.value) || 0 })}
            step="0.1"
            min="0"
            required
          />
        </div>
        <div>
          <FieldLabel>Height (m)</FieldLabel>
          <input
            className={INPUT_BASE}
            type="number"
            inputMode="decimal"
            value={item.height}
            onChange={(e) => setItem({ ...item, height: parseFloat(e.target.value) || 0 })}
            step="0.1"
            min="0"
            required
          />
        </div>
        <div>
          <FieldLabel>Weight (kg)</FieldLabel>
          <input
            className={INPUT_BASE}
            type="number"
            inputMode="decimal"
            value={item.weight}
            onChange={(e) => setItem({ ...item, weight: parseFloat(e.target.value) || 0 })}
            step="0.1"
            min="0"
            required
          />
        </div>
      </div>

      {/* Stackability */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Layers className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-700">Stackability</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <TogglePill
            accent="purple"
            active={item.stackability === 'stackable'}
            onClick={() => setItem({ ...item, stackability: 'stackable' })}
          >
            Stackable
          </TogglePill>
          <TogglePill
            accent="purple"
            active={item.stackability === 'semi_stackable'}
            onClick={() => setItem({ ...item, stackability: 'semi_stackable' })}
          >
            Semi-stackable
          </TogglePill>
          <TogglePill
            accent="purple"
            active={item.stackability === 'unstackable'}
            onClick={() => setItem({ ...item, stackability: 'unstackable' })}
          >
            Unstackable
          </TogglePill>
        </div>
      </div>

      {/* Priority */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Flag className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-700">Priority</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {(['1', '2', '3', '4', '5'] as const).map((p) => (
            <TogglePill key={p} active={item.priority === p} onClick={() => setItem({ ...item, priority: p })}>
              {p}
            </TogglePill>
          ))}
        </div>
        <div className="mt-2 text-xs text-slate-400">1 is highest priority.</div>
      </div>

      {/* Optional Route */}
      <div>
        <FieldLabel>Route (optional)</FieldLabel>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            className={[INPUT_BASE, 'pl-9'].join(' ')}
            type="text"
            value={item.route}
            onChange={(e) => setItem({ ...item, route: e.target.value })}
            placeholder="e.g. Berlin"
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.preventDefault();
            }}
            autoComplete="off"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-cyan-600 text-white font-medium py-2 rounded-lg hover:bg-cyan-700 transition-all duration-200"
      >
        Add Item
      </button>

      <div className="text-xs text-slate-400">
        The form remembers your last values to speed up adding multiple similar items.
      </div>
    </form>
  );
};

export default ItemForm; 