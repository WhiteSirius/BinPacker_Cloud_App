import React, { useState } from 'react';

interface ItemFormProps {
  onAddItem: (item: any) => void;
}

const ItemForm: React.FC<ItemFormProps> = ({ onAddItem }) => {
  const [item, setItem] = useState({
    id: '',
    length: 1.0,
    width: 0.8,
    height: 0.6,
    weight: 50.0,
    destination: '',
    stackability: 'stackable' as 'stackable' | 'semi_stackable' | 'unstackable',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item.length > 0 && item.width > 0 && item.height > 0 && item.weight > 0) {
      onAddItem({
        ...item
      });
      // Reset form
      setItem({
        id: '',
        length: 1.0,
        width: 0.8,
        height: 0.6,
        weight: 50.0,
        destination: '',
        stackability: 'stackable'
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '10px', alignItems: 'end' }}>
      <div className="form-group">
        <label>ID</label>
        <input
          type="text"
          value={item.id}
          onChange={(e) => setItem({ ...item, id: e.target.value })}
          placeholder="Auto-generated if empty"
        />
      </div>
      
      <div className="form-group">
        <label>Length (m)</label>
        <input
          type="number"
          value={item.length}
          onChange={(e) => setItem({ ...item, length: parseFloat(e.target.value) || 0 })}
          step="0.1"
          min="0"
          required
        />
      </div>
      
      <div className="form-group">
        <label>Width (m)</label>
        <input
          type="number"
          value={item.width}
          onChange={(e) => setItem({ ...item, width: parseFloat(e.target.value) || 0 })}
          step="0.1"
          min="0"
          required
        />
      </div>
      
      <div className="form-group">
        <label>Height (m)</label>
        <input
          type="number"
          value={item.height}
          onChange={(e) => setItem({ ...item, height: parseFloat(e.target.value) || 0 })}
          step="0.1"
          min="0"
          required
        />
      </div>
      
      <div className="form-group">
        <label>Weight (kg)</label>
        <input
          type="number"
          value={item.weight}
          onChange={(e) => setItem({ ...item, weight: parseFloat(e.target.value) || 0 })}
          step="0.1"
          min="0"
          required
        />
      </div>
      
      {/* Stackability (radio group) */}
      <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
        <label>Stackability</label>
        <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="radio"
              name="stackability"
              value="stackable"
              checked={item.stackability === 'stackable'}
              onChange={() => setItem({ ...item, stackability: 'stackable' })}
            />
            Stackable
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="radio"
              name="stackability"
              value="semi_stackable"
              checked={item.stackability === 'semi_stackable'}
              onChange={() => setItem({ ...item, stackability: 'semi_stackable' })}
            />
            Semi-stackable
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="radio"
              name="stackability"
              value="unstackable"
              checked={item.stackability === 'unstackable'}
              onChange={() => setItem({ ...item, stackability: 'unstackable' })}
            />
            Unstackable
          </label>
        </div>
      </div>
      
      <div className="form-group">
        <label>Destination</label>
        <input
          type="text"
          value={item.destination}
          onChange={(e) => setItem({ ...item, destination: e.target.value })}
          placeholder="Optional"
        />
      </div>
      
      
      <div className="form-group">
        <button type="submit" className="btn" style={{ marginTop: '20px' }}>
          ➕ Add Item
        </button>
      </div>
    </form>
  );
};

export default ItemForm; 