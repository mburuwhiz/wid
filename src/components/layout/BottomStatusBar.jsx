import React, { useEffect, useRef } from 'react';
import useStore from '../../store/useStore';

export default function BottomStatusBar() {
  const { theme, zoomLevel, setZoomLevel, hasUnsavedChanges, isLivePreviewMode, setLivePreviewMode, currentRecordIndex, setCurrentRecordIndex, records } = useStore();
  const originalCanvasState = useRef(null);

  useEffect(() => {
    if (!window.fabricCanvas) return;

    if (isLivePreviewMode) {
      // 1. Save current state
      originalCanvasState.current = JSON.stringify(window.fabricCanvas.toJSON(['isPhotoPlaceholder', 'isBarcode']));

      // 2. Lock objects
      window.fabricCanvas.getObjects().forEach(obj => {
        obj.set({ selectable: false, evented: false });
      });
      window.fabricCanvas.discardActiveObject();

      // 3. Apply variables
      applyRecordToCanvas(records[currentRecordIndex]);
    } else {
      // Restore state
      if (originalCanvasState.current) {
        window.fabricCanvas.loadFromJSON(originalCanvasState.current, () => {
          window.fabricCanvas.renderAll();
          // Unlock objects
          window.fabricCanvas.getObjects().forEach(obj => {
            obj.set({ selectable: true, evented: true });
          });
        });
      }
    }
  }, [isLivePreviewMode]);

  useEffect(() => {
    if (isLivePreviewMode && records.length > 0) {
        applyRecordToCanvas(records[currentRecordIndex]);
    }
  }, [currentRecordIndex]);

  useEffect(() => {
    // Autosave interval (every 2 minutes)
    const autosaveInterval = setInterval(async () => {
        const state = useStore.getState();
        // Only autosave if there are unsaved changes
        if (state.hasUnsavedChanges && window.fabricCanvas && !state.isLivePreviewMode) {
            try {
                const autoPath = await window.electronAPI.getAutosavePath();
                await window.electronAPI.saveWzip({
                    filePath: autoPath,
                    layout: window.fabricCanvas.toJSON(['isPhotoPlaceholder', 'isBarcode']),
                    data: { records: state.records },
                    meta: { application: "WhizID Pro", version: "1.0.0", is_autosave: true },
                    calibration: state.calibration,
                    isAutosave: true
                });
                toast('💾 All changes saved automatically', {
                    duration: 3000,
                    position: 'bottom-right'
                });
            } catch(e) {
                console.error("Autosave failed", e);
            }
        }
    }, 120000);

    return () => clearInterval(autosaveInterval);
  }, []);

  const applyRecordToCanvas = (record) => {
    if (!record || !window.fabricCanvas || !originalCanvasState.current) return;
    // Always start fresh from the base template for the new record
    window.fabricCanvas.loadFromJSON(originalCanvasState.current, () => {
      window.fabricCanvas.getObjects().forEach(obj => {
        obj.set({ selectable: false, evented: false }); // ensure they stay locked

        if (obj.type === 'i-text' && obj.text) {
          let newText = obj.text;
          // Find all {{placeholders}}
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

        // Handle photo placeholder replacement
        if (obj.isPhotoPlaceholder && record._photoPath) {
             window.fabric.Image.fromURL(record._photoPath, (img) => {
                 // Calculate scaling to fill the placeholder
                 const scaleX = obj.width / img.width;
                 const scaleY = obj.height / img.height;
                 const scale = Math.max(scaleX, scaleY); // Cover

                 img.set({
                     left: obj.left,
                     top: obj.top,
                     scaleX: scale,
                     scaleY: scale,
                     originX: obj.originX,
                     originY: obj.originY,
                     clipPath: new window.fabric.Rect({
                         width: obj.width,
                         height: obj.height,
                         originX: 'center',
                         originY: 'center',
                         rx: obj.rx,
                         ry: obj.ry,
                     }),
                     selectable: false,
                     evented: false,
                 });

                 // Remove placeholder and add image
                 window.fabricCanvas.remove(obj);
                 window.fabricCanvas.add(img);
                 window.fabricCanvas.renderAll();
             });
        }
      });
      window.fabricCanvas.renderAll();
    });
  };

  const nextRecord = () => {
    if (currentRecordIndex < records.length - 1) {
      setCurrentRecordIndex(currentRecordIndex + 1);
    }
  };

  const prevRecord = () => {
    if (currentRecordIndex > 0) {
      setCurrentRecordIndex(currentRecordIndex - 1);
    }
  };

  return (
    <div className={`h-7 border-t flex items-center justify-between px-3 select-none text-xs ${theme === 'light' ? 'bg-[#f8f9fa] border-[#dee2e6] text-[#495057]' : 'bg-[#2d2d2d] border-[#404040] text-gray-300'}`}>

      {/* Left Section: Zoom Controls */}
      <div className="flex items-center space-x-2">
        <button className="px-1 hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => setZoomLevel(Math.max(0.25, zoomLevel - 0.25))}>−</button>
        <div className="w-24 h-1 bg-gray-300 dark:bg-gray-600 rounded">
          <div className="h-full bg-whizpoint-blue rounded" style={{ width: `${Math.min(100, zoomLevel * 100)}%` }} />
        </div>
        <button className="px-1 hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => setZoomLevel(Math.min(2.0, zoomLevel + 0.25))}>+</button>
        <span className="w-10 text-right">{Math.round(zoomLevel * 100)}% ▼</span>
      </div>

      {/* Center Section: Status */}
      <div className="flex items-center space-x-1">
        {hasUnsavedChanges ? (
          <><span className="text-orange-500 text-lg leading-none">●</span> <span>Unsaved changes</span></>
        ) : (
          <><span className="text-green-500 text-lg leading-none">●</span> <span>All changes saved</span></>
        )}
      </div>

      {/* Right Section: Batch Toggle */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-700 rounded-full p-1 cursor-pointer" onClick={() => setLivePreviewMode(!isLivePreviewMode)}>
          <div className={`px-2 py-0.5 rounded-full ${!isLivePreviewMode ? 'bg-white shadow dark:bg-gray-600 text-black dark:text-white' : 'text-gray-500'}`}>Design</div>
          <div className={`px-2 py-0.5 rounded-full ${isLivePreviewMode ? 'bg-white shadow dark:bg-gray-600 text-black dark:text-white' : 'text-gray-500'}`}>Live Preview</div>
        </div>

        {isLivePreviewMode && (
          <div className="flex items-center space-x-2">
            <button className="px-1 hover:bg-gray-300 dark:hover:bg-gray-600" onClick={prevRecord} disabled={currentRecordIndex === 0}>←</button>
            <span>Record {currentRecordIndex + 1} of {records.length || 0}</span>
            <button className="px-1 hover:bg-gray-300 dark:hover:bg-gray-600" onClick={nextRecord} disabled={currentRecordIndex >= records.length - 1}>→</button>
            <input type="text" placeholder="🔍 Search..." className="w-24 border rounded px-1 ml-2 text-black" disabled />
          </div>
        )}
      </div>
    </div>
  );
}
