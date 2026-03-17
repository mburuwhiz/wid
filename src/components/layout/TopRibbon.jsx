import React, { useState, useEffect } from 'react';
import useStore from '../../store/useStore';
import { toast } from 'sonner';
import { fabric } from 'fabric';
import {
  File, FolderOpen, Save, Printer, Download, Undo, Redo,
  Scissors, Copy, ClipboardPaste, Type, Image as ImageIcon,
  Square, Circle, ImagePlus, Database, Table, BarChart
} from 'lucide-react';
import CalibrationModal from './CalibrationModal';
import BatchReportModal from './BatchReportModal';

const TABS = ['FILE', 'HOME', 'INSERT', 'BATCH DATA'];

export default function TopRibbon() {
  const {
    theme, activeTab, setActiveTab, setRecords, records,
    calibration, setHasUnsavedChanges, setFileName, setCalibration,
    undo, redo, history, historyIndex,
    isLivePreviewMode, setLivePreviewMode, currentRecordIndex, setCurrentRecordIndex
  } = useStore();

  const [loading, setLoading] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [showBatchReport, setShowBatchReport] = useState(false);
  const [availableHeaders, setAvailableHeaders] = useState([]);

  useEffect(() => {
    if (records.length > 0) {
      const headers = Object.keys(records[0]).filter(k => !k.startsWith('_'));
      setAvailableHeaders(headers);
    } else {
      setAvailableHeaders([]);
    }
  }, [records]);

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
        const layout = window.fabricCanvas.toJSON(['isPhotoPlaceholder', 'isBarcode']);
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
                 // Fix paths for Windows, replace backslashes with forward slashes
                 const normalizedDir = dirPath.replace(/\\/g, '/');
                 fileMap[baseName] = `whizid://${normalizedDir}/${file}`;
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

        // Ensure accurate filtering of valid records based on actual properties
        const validRecords = records.filter(record => {
            // Re-apply the logic used in BatchReportModal right at export time
            // to ensure no failed states are exported
            const missing = [];
            if (record.photoid && !record._photoPath) missing.push('Photo Missing');
            if (!record.name) missing.push('Name Missing');
            return missing.length === 0;
        });

        if (validRecords.length === 0) {
            toast.error("No valid completed records to export. Please fix missing data in Batch Data tab.");
            setLoading(false);
            return;
        }

        // Render each card to base64
        const images = [];
        const originalState = JSON.stringify(window.fabricCanvas.toJSON(['isPhotoPlaceholder', 'isBarcode']));

        for (let i = 0; i < validRecords.length; i++) {
           const record = validRecords[i];

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
            records: validRecords,
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

  const insertText = (isDynamic = false, header = '') => {
    if (window.fabricCanvas) {
      // The user requested: "the text plaheholder is to be typed as {{name}} with every plaholder being indipedent, soo its not required to have excel imported"
      // So if it's dynamic but no header was selected (or we just want a generic placeholder), we give them a basic one to edit.
      const textVal = isDynamic ? (header ? `{{${header}}}` : '{{placeholder}}') : 'New Text';
      const text = new fabric.IText(textVal, {
        left: window.fabricCanvas.width / 2,
        top: window.fabricCanvas.height / 2,
        fontFamily: 'Arial',
        fontSize: 30,
        fill: '#000000',
        originX: 'center',
        originY: 'center',
      });
      window.fabricCanvas.add(text);
      window.fabricCanvas.setActiveObject(text);
      setHasUnsavedChanges(true);
    }
  };

  const insertShape = (type) => {
    if (!window.fabricCanvas) return;
    let shape;
    const center = { left: window.fabricCanvas.width / 2, top: window.fabricCanvas.height / 2 };

    if (type === 'rect') {
      shape = new fabric.Rect({ ...center, fill: '#cccccc', width: 100, height: 100, originX: 'center', originY: 'center' });
    } else if (type === 'ellipse') {
      shape = new fabric.Ellipse({ ...center, fill: '#cccccc', rx: 50, ry: 50, originX: 'center', originY: 'center' });
    } else if (type === 'line') {
      shape = new fabric.Line([-50, 0, 50, 0], { ...center, stroke: '#000000', strokeWidth: 2, originX: 'center', originY: 'center' });
    } else if (type === 'photo') {
      shape = new fabric.Rect({
        ...center, fill: '#e0e0e0', stroke: '#999999', strokeWidth: 2, strokeDashArray: [5, 5],
        width: 150, height: 200, originX: 'center', originY: 'center', rx: 20, ry: 20, isPhotoPlaceholder: true
      });
    }

    if (shape) {
      window.fabricCanvas.add(shape);
      window.fabricCanvas.setActiveObject(shape);
      setHasUnsavedChanges(true);
    }
  };

  const handleAddImage = async () => {
    try {
      const result = await window.electronAPI.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }]
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];

        // Normalize path for Windows
        const normalizedPath = filePath.replace(/\\/g, '/');
        const dirPath = normalizedPath.substring(0, Math.max(normalizedPath.lastIndexOf('/'), normalizedPath.lastIndexOf('\\')));
        await window.electronAPI.readDirectory(dirPath);

        const imgUrl = `whizid://${normalizedPath}`;

        fabric.Image.fromURL(imgUrl, (img) => {
           if (!img) {
               toast.error('Failed to load image');
               return;
           }
           if (img.width > 500) img.scaleToWidth(500);
           img.set({
              left: window.fabricCanvas.width / 2,
              top: window.fabricCanvas.height / 2,
              originX: 'center',
              originY: 'center',
           });
           window.fabricCanvas.add(img);
           window.fabricCanvas.setActiveObject(img);
           setHasUnsavedChanges(true);
        }, { crossOrigin: 'anonymous' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to insert image.');
    }
  };

  const RibbonButton = ({ icon: Icon, label, onClick, disabled, className = "" }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center p-2 min-w-[64px] rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <Icon size={24} className="mb-1 text-gray-700 dark:text-gray-300" strokeWidth={1.5} />
      <span className="text-[11px] text-gray-600 dark:text-gray-400 font-medium tracking-wide">{label}</span>
    </button>
  );

  const RibbonDivider = () => <div className="w-px h-12 bg-gray-300 dark:bg-gray-600 mx-2" />;
  const RibbonGroup = ({ title, children }) => (
    <div className="flex flex-col h-full justify-between items-center px-2">
      <div className="flex items-center flex-grow space-x-1">
        {children}
      </div>
      <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{title}</span>
    </div>
  );

  return (
    <div className="flex flex-col">
      {/* Tab Headers */}
      <div className={`h-10 border-b flex items-end px-2 select-none ${theme === 'light' ? 'bg-[#f8f9fa] border-[#dee2e6]' : 'bg-[#2d2d2d] border-[#404040] text-white'}`}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-xs font-semibold tracking-wider ${activeTab === tab ? 'border-b-2 border-whizpoint-blue text-whizpoint-blue bg-white dark:bg-[#1e1e1e]' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            {tab}
          </button>
        ))}
        <div className="flex-grow"></div>
      </div>

      {/* Ribbon Body */}
      <div className={`h-24 border-b flex items-start pt-1 pb-0 px-2 select-none ${theme === 'light' ? 'bg-white border-[#dee2e6]' : 'bg-[#1e1e1e] border-[#404040] text-white'}`}>
        {activeTab === 'FILE' && (
           <div className="flex h-full">
             <RibbonGroup title="Project">
               <RibbonButton icon={FolderOpen} label="Open" onClick={handleLoadWzip} disabled={loading} />
               <RibbonButton icon={Save} label="Save" onClick={handleSaveWzip} disabled={loading} />
             </RibbonGroup>
             <RibbonDivider />
             <RibbonGroup title="Export">
               <RibbonButton icon={Download} label="Export PDF" onClick={handleExportPDF} disabled={loading} />
               <RibbonButton icon={Printer} label="Print Setup" onClick={() => setShowCalibration(true)} disabled={loading} />
             </RibbonGroup>
           </div>
        )}

        {activeTab === 'HOME' && (
           <div className="flex h-full">
             <RibbonGroup title="Clipboard">
               <RibbonButton
                 icon={ClipboardPaste}
                 label="Paste"
                 disabled={!clipboard}
                 onClick={() => {
                   if (!window.fabricCanvas || !clipboard) return;
                   const currentClipboard = useStore.getState().clipboard;
                   currentClipboard.clone((clonedObj) => {
                     window.fabricCanvas.discardActiveObject();
                     clonedObj.set({ left: clonedObj.left + 10, top: clonedObj.top + 10, evented: true });
                     if (clonedObj.type === 'activeSelection') {
                       clonedObj.canvas = window.fabricCanvas;
                       clonedObj.forEachObject(function(obj) { window.fabricCanvas.add(obj); });
                       clonedObj.setCoords();
                     } else {
                       window.fabricCanvas.add(clonedObj);
                     }
                     currentClipboard.top += 10;
                     currentClipboard.left += 10;
                     setClipboard(currentClipboard);
                     window.fabricCanvas.setActiveObject(clonedObj);
                     window.fabricCanvas.requestRenderAll();
                     setHasUnsavedChanges(true);
                   }, ['isPhotoPlaceholder', 'isBarcode']);
                 }}
               />
               <RibbonButton
                 icon={Scissors}
                 label="Cut"
                 onClick={() => {
                   if (!window.fabricCanvas) return;
                   const activeObj = window.fabricCanvas.getActiveObject();
                   if (!activeObj || activeObj.isEditing) return;
                   activeObj.clone((cloned) => {
                     setClipboard(cloned);
                   }, ['isPhotoPlaceholder', 'isBarcode']);
                   if (activeObj.type === 'activeSelection') {
                     activeObj.forEachObject(obj => window.fabricCanvas.remove(obj));
                   }
                   window.fabricCanvas.remove(activeObj);
                   window.fabricCanvas.discardActiveObject();
                   window.fabricCanvas.requestRenderAll();
                   setHasUnsavedChanges(true);
                 }}
               />
               <RibbonButton
                 icon={Copy}
                 label="Copy"
                 onClick={() => {
                   if (!window.fabricCanvas) return;
                   const activeObj = window.fabricCanvas.getActiveObject();
                   if (!activeObj || activeObj.isEditing) return;
                   activeObj.clone((cloned) => {
                     setClipboard(cloned);
                     toast.success('Copied to clipboard');
                   }, ['isPhotoPlaceholder', 'isBarcode']);
                 }}
               />
             </RibbonGroup>
             <RibbonDivider />
             <RibbonGroup title="History">
               <RibbonButton icon={Undo} label="Undo" onClick={undo} disabled={historyIndex <= 0} />
               <RibbonButton icon={Redo} label="Redo" onClick={redo} disabled={historyIndex >= history.length - 1} />
             </RibbonGroup>
           </div>
        )}

        {activeTab === 'INSERT' && (
           <div className="flex h-full">
             <RibbonGroup title="Text">
               <RibbonButton icon={Type} label="Static Text" onClick={() => insertText(false)} />
               <div className="flex flex-col justify-center mx-2 space-y-1">
                 <button
                   onClick={() => insertText(true, '')}
                   className="text-[11px] font-medium text-white bg-whizpoint-blue hover:bg-blue-600 rounded px-2 py-1 transition-colors"
                 >
                   + Add Placeholder
                 </button>
                 {availableHeaders.length > 0 && (
                   <select
                     className="text-[10px] border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#2d2d2d] text-gray-700 dark:text-gray-300 px-1 py-0.5 outline-none w-full"
                     onChange={(e) => {
                       if (e.target.value) {
                         insertText(true, e.target.value);
                         e.target.value = '';
                       }
                     }}
                   >
                     <option value="">Map from Data...</option>
                     {availableHeaders.map(h => (
                       <option key={h} value={h}>{h}</option>
                     ))}
                   </select>
                 )}
               </div>
             </RibbonGroup>
             <RibbonDivider />
             <RibbonGroup title="Media">
               <RibbonButton icon={ImageIcon} label="Static Image" onClick={handleAddImage} />
               <RibbonButton icon={ImagePlus} label="Photo Slot" onClick={() => insertShape('photo')} />
             </RibbonGroup>
             <RibbonDivider />
             <RibbonGroup title="Shapes">
               <RibbonButton icon={Square} label="Rectangle" onClick={() => insertShape('rect')} />
               <RibbonButton icon={Circle} label="Ellipse" onClick={() => insertShape('ellipse')} />
               <button
                 onClick={() => insertShape('line')}
                 className="flex flex-col items-center justify-center p-2 min-w-[64px] rounded hover:bg-gray-100 dark:hover:bg-gray-800"
               >
                 <div className="w-6 h-6 flex items-center justify-center mb-1">
                   <div className="w-5 h-0.5 bg-gray-700 dark:bg-gray-300 transform -rotate-45"></div>
                 </div>
                 <span className="text-[11px] text-gray-600 dark:text-gray-400 font-medium tracking-wide">Line</span>
               </button>
             </RibbonGroup>
           </div>
        )}

        {activeTab === 'BATCH DATA' && (
           <div className="flex h-full">
             <RibbonGroup title="Import">
               <RibbonButton icon={Table} label="Excel / CSV" onClick={handleImportExcel} disabled={loading} />
               <RibbonButton icon={FolderOpen} label="Photos Folder" onClick={handleImportPhotos} disabled={loading || records.length === 0} />
             </RibbonGroup>
             <RibbonDivider />
             <RibbonGroup title="Report">
               <RibbonButton icon={BarChart} label="Batch Report" onClick={() => setShowBatchReport(true)} disabled={loading || records.length === 0} />
             </RibbonGroup>
           </div>
        )}

        {/* Right Section: Live Preview UI moved here from BottomStatusBar */}
        <div className="ml-auto flex flex-col justify-center items-end pr-4 space-y-2">
          <div className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-700 rounded-full p-1 cursor-pointer text-[10px]" onClick={() => setLivePreviewMode(!isLivePreviewMode)}>
            <div className={`px-2 py-0.5 rounded-full ${!isLivePreviewMode ? 'bg-white shadow dark:bg-gray-600 text-black dark:text-white' : 'text-gray-500'}`}>Design</div>
            <div className={`px-2 py-0.5 rounded-full ${isLivePreviewMode ? 'bg-white shadow dark:bg-gray-600 text-black dark:text-white' : 'text-gray-500'}`}>Live Preview</div>
          </div>

          {isLivePreviewMode && (
            <div className="flex items-center space-x-1 text-[11px]">
              <button
                className="px-1 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                onClick={() => currentRecordIndex > 0 && setCurrentRecordIndex(currentRecordIndex - 1)}
                disabled={currentRecordIndex === 0}
              >←</button>
              <span>{currentRecordIndex + 1} of {records.length || 0}</span>
              <button
                className="px-1 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                onClick={() => currentRecordIndex < records.length - 1 && setCurrentRecordIndex(currentRecordIndex + 1)}
                disabled={currentRecordIndex >= records.length - 1}
              >→</button>
            </div>
          )}
          {loading && <span className="text-[10px] text-gray-500">Processing...</span>}
        </div>
      </div>
      {showCalibration && <CalibrationModal onClose={() => setShowCalibration(false)} />}
      {showBatchReport && <BatchReportModal onClose={() => setShowBatchReport(false)} />}
    </div>
  );
}
