import React, { useState, useRef } from 'react';

interface ItemUploadProps {
  onItemsLoaded: (items: any[]) => void;
  onError: (message: string) => void;
}

const ItemUpload: React.FC<ItemUploadProps> = ({ onItemsLoaded, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find(file => 
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    );
    
    if (excelFile) {
      processFile(excelFile);
    } else {
      onError('Please upload an Excel file (.xlsx or .xls)');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    setUploading(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload to backend
      const response = await fetch('/api/v1/upload-excel', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.items) {
        onItemsLoaded(result.items);
      } else {
        onError('Failed to parse Excel file. Please check the format.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      onError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="upload-section">
      <h3>📁 Upload Items from Excel</h3>
      
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        {uploading ? (
          <div className="upload-content">
            <div className="spinner"></div>
            <p>Processing Excel file...</p>
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon">📄</div>
            <p><strong>Drop Excel file here</strong> or click to browse</p>
            <p className="upload-hint">
              Supported formats: .xlsx, .xls<br />
              Expected columns: ID, Length, Width, Height, Weight, Can_Rotate, Destination
            </p>
          </div>
        )}
      </div>
      
      <div className="upload-example">
        <h4>📋 Expected Excel Format:</h4>
        <div className="example-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Length (m)</th>
                <th>Width (m)</th>
                <th>Height (m)</th>
                <th>Weight (kg)</th>
                <th>Can_Rotate</th>
                <th>Destination</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Item1</td>
                <td>1.0</td>
                <td>0.8</td>
                <td>0.6</td>
                <td>50</td>
                <td>Yes</td>
                <td>Bucharest</td>
              </tr>
              <tr>
                <td>Item2</td>
                <td>1.2</td>
                <td>0.9</td>
                <td>0.7</td>
                <td>75</td>
                <td>No</td>
                <td>Cluj</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ItemUpload; 