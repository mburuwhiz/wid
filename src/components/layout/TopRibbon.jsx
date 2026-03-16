import React, { useState } from 'react';
import useStore from '../../store/useStore';
import { toast } from 'sonner';
import CalibrationModal from './CalibrationModal';
import BatchReportModal from './BatchReportModal';

const TABS = ['FILE', 'HOME', 'INSERT', 'BATCH DATA'];

export default function TopRibbon() {
  const { theme, activeTab, setActiveTab, setRecords, records, calibration, setHasUnsavedChanges, setFileName, setCalibration } = useStore();
  const [loading, setLoading] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [showBatchReport, setShowBatchReport] = useState(false);

  const handleSaveWzip = async () => {
    if (!window.fabricCanvas) return;
    try {
      const result = await window.electronAPI.showSaveDialog({
        title: 'Save Batch Document',
        defaultPath: 'Untitled.wzid',
        filters: [{ name: 'WhizID Pro Document', extensions: ['wzid'] }]
      });

      if (!result.canceled && result.filePath) {
        setLoading(true);
        const layout = window.fabricCanvas.toJSON();
        const data = { records };
        const meta = { application: "WhizID Pro", version: "1.0.0", saved_by: "user" };

        toast.promise(
          window.electronAPI.saveWzip({
            filePath: result.filePath,
            layout,
            data,
            meta,
            calibration
          }),
          {
            loading: 'Saving...',
            success: (res) => {
               setHasUnsavedChanges(false);
               const filename = result.filePath.split('\\').pop().split('/').pop();
               setFileName(filename);
               return 'Saved successfully!';
            },
            error: 'Failed to save document'
          }
        );
      }
    } catch (err) {
      console.error(err);
      toast.error('Error initiating save.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportPhotos = async () => {
    try {
      const result = await window.electronAPI.showOpenDirDialog({
        title: 'Select Photo Directory',
      });

      if (!result.canceled && result.filePaths.length > 0) {
        setLoading(true);
        const dirPath = result.filePaths[0];
        const files = await window.electronAPI.readDirectory(dirPath);

        // Allowed extensions per spec
        const allowedExts = ['.jpg', '.jpeg', '.png', '.bmp', '.webp', '.tiff'];

        // Create a map of photoid (without extension, lowercase) to full path
        const fileMap = {};
        files.forEach(file => {
           const lowerFile = file.toLowerCase();
           const ext = allowedExts.find(e => lowerFile.endsWith(e));
           if (ext) {
             const baseName = lowerFile.slice(0, -ext.length);
             // use the first matching one alphabetically
             if (!fileMap[baseName]) {
                 fileMap[baseName] = `whizid://${dirPath}/${file}`;
             }
           }
        });

        // Match against current records
        let matched = 0;
        const newRecords = records.map(record => {
           if (record.photoid) {
              const lookup = record.photoid.toString().toLowerCase();
              if (fileMap[lookup]) {
                  matched++;
                  return { ...record, _photoPath: fileMap[lookup] };
              }
           }
           return record;
        });

        setRecords(newRecords);
        setHasUnsavedChanges(true);
        toast.success(`Matched ${matched} photos out of ${records.length} records.`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to process photo folder.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadWzip = async () => {
    try {
      const result = await window.electronAPI.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'WhizID Pro Document', extensions: ['wzid'] }]
      });

      if (!result.canceled && result.filePaths.length > 0) {
        setLoading(true);
        const filePath = result.filePaths[0];

        toast.promise(
          window.electronAPI.loadWzip(filePath),
          {
            loading: 'Loading document...',
            success: (parsed) => {
               if (window.fabricCanvas) {
                   window.fabricCanvas.loadFromJSON(parsed.layout, () => {
                       window.fabricCanvas.renderAll();
                   });
               }
               setRecords(parsed.data.records || []);
               setCalibration(parsed.calibration || calibration);
               setHasUnsavedChanges(false);
               const filename = filePath.split('\\').pop().split('/').pop();
               setFileName(filename);
               return 'Document loaded successfully!';
            },
            error: 'Failed to load document. File may be corrupted.'
          }
        );
      }
    } catch (err) {
      console.error(err);
      toast.error('Error initiating load.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportExcel = async () => {
    try {
      const result = await window.electronAPI.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Excel Files', extensions: ['xlsx', 'csv'] }]
      });

      if (!result.canceled && result.filePaths.length > 0) {
        setLoading(true);
        const data = await window.electronAPI.parseExcel(result.filePaths[0]);
        setRecords(data);
        setHasUnsavedChanges(true);
        toast.success(`Imported ${data.length} records successfully!`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to import Excel file.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (records.length === 0) {
      toast.warning("No records to export.");
      return;
    }
    if (!window.fabricCanvas) return;

    try {
      const result = await window.electronAPI.showSaveDialog({
        title: 'Export to PDF',
        defaultPath: 'BatchExport.pdf',
        filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
      });

      if (!result.canceled && result.filePath) {
        setLoading(true);

        // Render each card to base64
        const images = [];
        const originalState = JSON.stringify(window.fabricCanvas.toJSON());

        for (let i = 0; i < records.length; i++) {
           const record = records[i];

           // A quick internal function mirroring BottomStatusBar's applyRecordToCanvas logic
           // Ideally this is centralized, but for POC we duplicate the replacement logic
           await new Promise((resolve) => {
               window.fabricCanvas.loadFromJSON(originalState, () => {
                   window.fabricCanvas.getObjects().forEach(obj => {
                     // Hide selection borders
                     obj.set({ selectable: false, evented: false });

                     if (obj.type === 'i-text' && obj.text) {
                       let newText = obj.text;
                       const matches = newText.match(/\{\{([^\}]+)\}\}/g);
                       if (matches) {
                         matches.forEach(match => {
                           const key = match.replace(/[{}]/g, '').toLowerCase().trim();
                           if (record[key] !== undefined) {
                              newText = newText.replace(match, record[key]);
                           }
                         });
                         obj.set('text', newText);
                       }
                     }
                   });
                   window.fabricCanvas.renderAll();

                   // Export canvas to dataURL at higher multiplier to maintain resolution
                   // The standard size is 1009x638
                   const dataUrl = window.fabricCanvas.toDataURL({
                       format: 'png',
                       quality: 1.0,
                       multiplier: 1
                   });
                   images.push({ index: i, dataUrl });
                   resolve();
               });
           });
        }

        // Restore canvas
        window.fabricCanvas.loadFromJSON(originalState, () => {
            window.fabricCanvas.renderAll();
        });

        toast.promise(
          window.electronAPI.generatePdf({
            records,
            calibration,
            outputPath: result.filePath,
            images,
            batchName: result.filePath.split('\\').pop().split('/').pop()
          }),
          {
            loading: 'Generating PDF...',
            success: () => {
                setLoading(false);
                return 'PDF exported successfully!';
            },
            error: () => {
                setLoading(false);
                return 'Failed to export PDF';
            },
          }
        );
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to start PDF export.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className={`h-12 border-b flex items-end px-2 select-none ${theme === 'light' ? 'bg-[#f8f9fa] border-[#dee2e6]' : 'bg-[#2d2d2d] border-[#404040] text-white'}`}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium ${activeTab === tab ? 'border-b-2 border-whizpoint-blue text-whizpoint-blue bg-white dark:bg-[#1e1e1e]' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            {tab}
          </button>
        ))}
        <div className="flex-grow"></div>
      </div>

      {/* Temporary sub-ribbon to show actions for active tab */}
      <div className={`h-16 border-b flex items-center px-4 space-x-4 ${theme === 'light' ? 'bg-white border-[#dee2e6]' : 'bg-[#1e1e1e] border-[#404040] text-white'}`}>
        {activeTab === 'FILE' && (
           <>
             <button onClick={handleLoadWzip} disabled={loading} className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
               <span className="text-xl">📂</span>
               <span className="text-xs mt-1">Open</span>
             </button>
             <button onClick={handleSaveWzip} disabled={loading} className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
               <span className="text-xl">💾</span>
               <span className="text-xs mt-1">Save</span>
             </button>
             <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-2" />
             <button onClick={handleExportPDF} disabled={loading} className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
               <span className="text-xl">📄</span>
               <span className="text-xs mt-1">Export PDF</span>
             </button>
             <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-2" />
             <button onClick={() => setShowCalibration(true)} disabled={loading} className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
               <span className="text-xl">🖨️</span>
               <span className="text-xs mt-1">Calibration</span>
             </button>
           </>
        )}
        {activeTab === 'BATCH DATA' && (
           <>
             <button onClick={handleImportExcel} disabled={loading} className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
               <span className="text-xl">📤</span>
               <span className="text-xs mt-1">Import Excel</span>
             </button>
             <button onClick={handleImportPhotos} disabled={loading || records.length === 0} className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50">
               <span className="text-xl">🖼️</span>
               <span className="text-xs mt-1">Import Photos</span>
             </button>
             <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-2" />
             <button onClick={() => setShowBatchReport(true)} disabled={loading || records.length === 0} className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50">
               <span className="text-xl">📋</span>
               <span className="text-xs mt-1">Batch Report</span>
             </button>
           </>
        )}
        {loading && <span className="text-xs text-gray-500">Processing...</span>}
      </div>
      {showCalibration && <CalibrationModal onClose={() => setShowCalibration(false)} />}
      {showBatchReport && <BatchReportModal onClose={() => setShowBatchReport(false)} />}
    </div>
  );
}
