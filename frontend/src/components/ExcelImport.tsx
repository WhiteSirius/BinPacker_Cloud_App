import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import './ExcelImport.css';

interface ColumnMapping {
  [key: string]: string;
}

interface ExcelImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[], mapping: ColumnMapping) => void;
}

const ExcelImport: React.FC<ExcelImportProps> = ({ isOpen, onClose, onImport }) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [excludeRows, setExcludeRows] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiredFields = ['length', 'width', 'height', 'weight'];
  const optionalFields = ['stackability', 'route', 'priority', 'notes', 'duplicate'];

  const generateColumns = () => {
    // Simple: Generate columns A to Z
    const columns = [];
    for (let i = 0; i < 26; i++) {
      columns.push(`Column ${String.fromCharCode(65 + i)}`); // 65 = 'A' in ASCII
    }
    return columns;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setError('');
    
    if (selectedFile) {
      // Check file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        
        // Simple: Generate columns A to Z
        const columns = generateColumns();
        setAvailableColumns(columns);
        setStep(2);
      } else {
        setError('Please select a valid Excel file (.xlsx, .xls) or CSV file.');
      }
    }
  };



  const handleColumnMapping = (excelColumn: string, fieldName: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [fieldName]: excelColumn
    }));
  };

  const handleExcludeRows = (value: string) => {
    setExcludeRows(value);
    // TODO: Apply row exclusion and update preview
    // This would filter the preview data based on exclusion rules
  };

  const validateMapping = () => {
    const mappedFields = Object.keys(columnMapping);
    const requiredMapped = requiredFields.filter(field => mappedFields.includes(field));
    
    if (requiredMapped.length < 4) {
      setError('Please map at least the 4 required fields: Length, Width, Height, and Weight.');
      return false;
    }
    
    // Check for duplicate column mappings
    const mappedColumns = Object.values(columnMapping);
    const uniqueColumns = new Set(mappedColumns);
    if (mappedColumns.length !== uniqueColumns.size) {
      setError('Each Excel column can only be mapped to one field.');
      return false;
    }
    
    return true;
  };

  const handleImport = () => {
    if (!validateMapping()) {
      return;
    }

    if (!file) {
      setError('No file selected');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // REAL Excel parsing implementation
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          console.log('Raw Excel data (first 3 rows):', jsonData.slice(0, 3));
          console.log('Total rows in Excel:', jsonData.length);
          
          if (jsonData.length < 2) {
            setError('Excel file must have at least 2 rows (header + data)');
            setIsProcessing(false);
            return;
          }
          
          // Skip header row (row 0), start from row 1
          const dataRows = jsonData.slice(1);
          
          // Process each row based on column mapping
          const processedData: any[] = [];
          
          dataRows.forEach((row: unknown, rowIndex: number) => {
            if (!Array.isArray(row) || row.length === 0) return; // Skip empty rows
            
            const typedRow = row as any[];
            console.log(`Processing row ${rowIndex + 1}:`, typedRow);
            
            const item: any = {};
            let hasRequiredFields = true;
            
            // Map each field to its corresponding column value
            Object.entries(columnMapping).forEach(([field, columnName]) => {
              // Convert "Column A" to index 0, "Column B" to index 1, etc.
              const columnLetter = columnName.replace('Column ', '');
              const columnIndex = columnLetter.charCodeAt(0) - 65; // A=65, B=66, etc. So A=0, B=1, C=2...
              const value = typedRow[columnIndex];
              
              console.log(`Field "${field}" mapped to "${columnName}" (index ${columnIndex}): value =`, value);
              
              if (value !== undefined && value !== null && value !== '') {
                item[field] = value;
              } else if (['length', 'width', 'height', 'weight'].includes(field)) {
                // Required field is missing
                hasRequiredFields = false;
                console.log(`❌ Missing required field: ${field}`);
              }
            });
            
            console.log(`Row ${rowIndex + 1} processed item:`, item);
            console.log(`Row ${rowIndex + 1} has required fields:`, hasRequiredFields);
            
            // Only add items with all required fields
            if (hasRequiredFields) {
              processedData.push(item);
            }
          });
          
          console.log('Final processed data:', processedData);
          console.log('Column mapping used:', columnMapping);
          
          onImport(processedData, columnMapping);
          onClose();
          setIsProcessing(false);
          
        } catch (parseError) {
          console.error('Excel parsing error:', parseError);
          setError('Error parsing Excel file. Please check the file format.');
          setIsProcessing(false);
        }
      };
      
      reader.onerror = () => {
        setError('Error reading file');
        setIsProcessing(false);
      };
      
      // Read the file as array buffer
      reader.readAsArrayBuffer(file);
      
    } catch (err) {
      console.error('Import error:', err);
      setError('Error processing file. Please try again.');
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFile(null);
    setColumnMapping({});
    setExcludeRows('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className='excel-import-overlay' onClick={handleClose}>
      <div className='excel-import-modal' onClick={(e) => e.stopPropagation()}>
        <div className='modal-header'>
          <h2>📊 Import Excel Data</h2>
          <button className='close-btn' onClick={handleClose} aria-label="Close modal">×</button>
        </div>

        <div className='modal-content'>
          {error && (
            <div className='error-message'>
              <strong>⚠️ Error:</strong> {error}
            </div>
          )}

          {step === 1 && (
            <div className='step-1'>
              <h3>Step 1: Select Excel File</h3>
              <p>Please select an Excel file (.xlsx, .xls) or CSV file containing your cargo data.</p>
              
              <div className='file-upload-area'>
                <input
                  type='file'
                  ref={fileInputRef}
                  accept='.xlsx,.xls,.csv'
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <button 
                  className='upload-btn'
                  onClick={() => fileInputRef.current?.click()}
                >
                  📁 Choose Excel File
                </button>
                {file && (
                  <div className='selected-file'>
                    <span>✅ Selected: {file.name}</span>
                    <small>Size: {(file.size / 1024).toFixed(1)} KB</small>
                  </div>
                )}
              </div>

              <div className='file-requirements'>
                <h4>📋 File Requirements:</h4>
                <ul>
                  <li>Supported formats: .xlsx, .xls, .csv</li>
                  <li>First row should contain column headers</li>
                  <li>Data should start from row 2</li>
                  <li>Required fields: Length, Width, Height, Weight</li>
                </ul>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className='step-2'>
              <h3>Step 2: Map Columns</h3>
              <p>Tell us which columns contain which data:</p>
              
              <div className='column-mapping'>
                <h4>Required Fields *</h4>
                {requiredFields.map(field => (
                  <div key={field} className='mapping-row'>
                    <label className='field-label required'>
                      {field.charAt(0).toUpperCase() + field.slice(1)} *
                    </label>
                    <select
                      value={columnMapping[field] || ''}
                      onChange={(e) => handleColumnMapping(e.target.value, field)}
                      required
                      className={columnMapping[field] ? 'mapped' : ''}
                    >
                      <option value=''>Select column...</option>
                      {availableColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                ))}
                
                <h4>Optional Fields</h4>
                {optionalFields.map(field => (
                  <div key={field} className='mapping-row'>
                    <label className='field-label'>
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    <select
                      value={columnMapping[field] || ''}
                      onChange={(e) => handleColumnMapping(e.target.value, field)}
                      className={columnMapping[field] ? 'mapped' : ''}
                    >
                      <option value=''>Select column...</option>
                      {availableColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className='exclude-rows'>
                <label>🚫 Exclude Rows (e.g., 1-3, 5, 8-10):</label>
                <input
                  type='text'
                  value={excludeRows}
                  onChange={(e) => setExcludeRows(e.target.value)}
                  placeholder='Leave empty to include all rows'
                />
                <small>Use comma-separated values or ranges (e.g., 1-3, 5, 8-10)</small>
              </div>

              <div className='preview-section'>
                <h4>🔍 Column Mapping Verification</h4>
                <div className='preview-table'>
                  {Object.keys(columnMapping).length > 0 ? (
                    <div className='mapping-verification'>
                      <h5>✅ Mapped Fields:</h5>
                      <div className='mapped-fields'>
                        {Object.entries(columnMapping).map(([field, column]) => (
                          <div key={field} className='mapped-field'>
                            <span className='field-name'>{field.charAt(0).toUpperCase() + field.slice(1)}</span>
                            <span className='arrow'>→</span>
                            <span className='column-name'>{column}</span>
                          </div>
                        ))}
                      </div>
                      
                      <h5>📊 Available Columns (A to Z):</h5>
                      <div className='available-columns'>
                        {availableColumns.map(col => (
                          <span 
                            key={col} 
                            className={`column-badge ${Object.values(columnMapping).includes(col) ? 'mapped' : 'unmapped'}`}
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p>Map columns above to see the verification</p>
                  )}
                </div>
              </div>

              <div className='modal-actions'>
                <button className='btn-secondary' onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button 
                  className='btn-primary'
                  onClick={handleImport}
                  disabled={Object.keys(columnMapping).length < 4 || isProcessing}
                >
                  {isProcessing ? '🔄 Processing...' : '📥 Import Data'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelImport; 