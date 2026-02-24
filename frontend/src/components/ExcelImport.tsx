import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { AlertCircle, ArrowLeft, FileSpreadsheet, UploadCloud } from 'lucide-react';
import Modal from './ui/Modal';

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
          setIsProcessing(false);
          handleClose();
          
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Excel Data"
      description="Upload a spreadsheet and map its columns to item fields."
      maxWidthClassName="max-w-3xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div>
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all duration-200"
            >
              Cancel
            </button>
            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!file}
                className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleImport}
                disabled={Object.keys(columnMapping).length < 4 || isProcessing}
                className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-700 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Importing...' : 'Import'}
              </button>
            )}
          </div>
        </div>
      }
    >
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          <div className="text-sm">{error}</div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="text-sm font-semibold text-slate-900">Step 1: Select file</div>
          <div className="text-sm text-slate-600">
            Supported formats: <span className="font-medium text-slate-900">.xlsx</span>,{' '}
            <span className="font-medium text-slate-900">.xls</span>,{' '}
            <span className="font-medium text-slate-900">.csv</span>.
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all duration-200"
            >
              <UploadCloud className="h-5 w-5 text-slate-500" />
              Choose Excel/CSV File
            </button>

            {file ? (
              <div className="mt-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <FileSpreadsheet className="h-5 w-5 text-cyan-600 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{file.name}</div>
                  <div className="text-sm text-slate-600">Size: {(file.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-slate-600">No file selected yet.</div>
            )}
          </div>

          <div className="text-sm text-slate-600">
            Required fields to optimize: <span className="font-medium text-slate-900">Length, Width, Height, Weight</span>.
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <div className="text-sm font-semibold text-slate-900">Step 2: Map columns</div>
            <div className="mt-1 text-sm text-slate-600">Select which spreadsheet columns correspond to each field.</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-900">Required fields</div>
              {requiredFields.map((field) => (
                <div key={field} className="grid grid-cols-2 gap-3 items-center">
                  <div className="text-sm text-slate-700">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                    <span className="text-red-600"> *</span>
                  </div>
                  <select
                    value={columnMapping[field] || ''}
                    onChange={(e) => handleColumnMapping(e.target.value, field)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Select column...</option>
                    {availableColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-900">Optional fields</div>
              {optionalFields.map((field) => (
                <div key={field} className="grid grid-cols-2 gap-3 items-center">
                  <div className="text-sm text-slate-700">{field.charAt(0).toUpperCase() + field.slice(1)}</div>
                  <select
                    value={columnMapping[field] || ''}
                    onChange={(e) => handleColumnMapping(e.target.value, field)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Select column...</option>
                    {availableColumns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="block text-xs font-medium text-slate-700 mb-1">Exclude rows (optional)</label>
            <input
              type="text"
              value={excludeRows}
              onChange={(e) => handleExcludeRows(e.target.value)}
              placeholder="e.g. 1-3, 5, 8-10"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <div className="mt-2 text-xs text-slate-400">Use comma-separated numbers or ranges.</div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ExcelImport; 