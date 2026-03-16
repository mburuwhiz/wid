import React, { useEffect, useState } from 'react';
import useStore from '../../store/useStore';

export default function RightSidebar() {
  const { theme, selectedObject, setHasUnsavedChanges } = useStore();
  const [props, setProps] = useState({ x: 0, y: 0, w: 0, h: 0, angle: 0, opacity: 1 });
  const [colorProps, setColorProps] = useState({ fill: '#000000', stroke: '#000000', strokeWidth: 0 });
  const [fontProps, setFontProps] = useState({ fontFamily: 'Arial', fontSize: 30, fontWeight: 'normal', fontStyle: 'normal' });
  const [systemFonts, setSystemFonts] = useState(['Arial', 'Times New Roman', 'Courier New', 'Helvetica']);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        if (window.electronAPI && window.electronAPI.getSystemFonts) {
          const fonts = await window.electronAPI.getSystemFonts();
          if (fonts && fonts.length > 0) {
            setSystemFonts(fonts);
          }
        }
      } catch (err) {
        console.error("Failed to load system fonts:", err);
      }
    };
    loadFonts();
  }, []);

  useEffect(() => {
    if (selectedObject) {
      // 1009 / 85.6 is our pixel to mm ratio
      const ratio = 85.6 / 1009;
      setProps({
        x: ((selectedObject.left || 0) * ratio).toFixed(1),
        y: ((selectedObject.top || 0) * ratio).toFixed(1),
        w: (((selectedObject.width || 0) * (selectedObject.scaleX || 1)) * ratio).toFixed(1),
        h: (((selectedObject.height || 0) * (selectedObject.scaleY || 1)) * ratio).toFixed(1),
        angle: Math.round(selectedObject.angle || 0),
        opacity: selectedObject.opacity || 1
      });

      setColorProps({
          fill: selectedObject.fill || '#000000',
          stroke: selectedObject.stroke || '#000000',
          strokeWidth: selectedObject.strokeWidth || 0
      });

      if (selectedObject.type === 'i-text') {
          setFontProps({
              fontFamily: selectedObject.fontFamily || 'Arial',
              fontSize: selectedObject.fontSize || 30,
              fontWeight: selectedObject.fontWeight || 'normal',
              fontStyle: selectedObject.fontStyle || 'normal',
          });
      }
    }
  }, [selectedObject]);

  const updateObjectProp = (key, value) => {
      if (selectedObject && window.fabricCanvas) {
          selectedObject.set(key, value);
          window.fabricCanvas.renderAll();
          setHasUnsavedChanges(true);
      }
  };

  return (
    <div className={`w-[280px] h-full flex flex-col border-l select-none overflow-y-auto ${theme === 'light' ? 'bg-[#ffffff] border-[#dee2e6] text-black' : 'bg-[#1e1e1e] border-[#404040] text-white'}`}>
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold mb-2">PROPERTIES</h3>
        {selectedObject ? (
          <div className="text-xs space-y-2">
             <div className="flex justify-between items-center"><span>X (mm):</span> <input readOnly className="border px-1 w-16 bg-gray-50 dark:bg-gray-800" value={props.x} /></div>
             <div className="flex justify-between items-center"><span>Y (mm):</span> <input readOnly className="border px-1 w-16 bg-gray-50 dark:bg-gray-800" value={props.y} /></div>
             <div className="flex justify-between items-center"><span>W (mm):</span> <input readOnly className="border px-1 w-16 bg-gray-50 dark:bg-gray-800" value={props.w} /></div>
             <div className="flex justify-between items-center"><span>H (mm):</span> <input readOnly className="border px-1 w-16 bg-gray-50 dark:bg-gray-800" value={props.h} /></div>
             <div className="flex justify-between items-center"><span>Rotation:</span> <input readOnly className="border px-1 w-16 bg-gray-50 dark:bg-gray-800" value={props.angle} /></div>
             <div className="flex justify-between items-center"><span>Opacity:</span>
                <input
                    type="range" min="0" max="1" step="0.05"
                    value={props.opacity}
                    onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setProps({...props, opacity: val});
                        updateObjectProp('opacity', val);
                    }}
                    className="w-16"
                />
             </div>

             {/* General Styling for shapes and text */}
             {(selectedObject.type === 'rect' || selectedObject.type === 'circle' || selectedObject.type === 'ellipse' || selectedObject.type === 'i-text') && !selectedObject.isPhotoPlaceholder && !selectedObject.isBarcode && (
                <div className="mt-4 pt-4 border-t space-y-2">
                    <h4 className="font-semibold mb-2 text-xs">STYLE</h4>
                    <div className="flex justify-between items-center">
                        <span>Fill:</span>
                        <input type="color" value={colorProps.fill} onChange={(e) => {
                            setColorProps({...colorProps, fill: e.target.value});
                            updateObjectProp('fill', e.target.value);
                        }} className="border p-0 w-8 h-6" />
                    </div>
                    {selectedObject.type !== 'i-text' && (
                        <div className="flex justify-between items-center">
                            <span>Stroke:</span>
                            <input type="color" value={colorProps.stroke} onChange={(e) => {
                                setColorProps({...colorProps, stroke: e.target.value});
                                updateObjectProp('stroke', e.target.value);
                            }} className="border p-0 w-8 h-6" />
                        </div>
                    )}
                </div>
             )}

             {/* Text Formatting Tools */}
             {selectedObject.type === 'i-text' && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  <h4 className="font-semibold mb-2 text-xs">TYPOGRAPHY</h4>
                  <div className="flex justify-between items-center">
                      <span>Font:</span>
                      <select
                          className="border px-1 w-32 text-xs dark:bg-gray-800 max-h-48"
                          value={fontProps.fontFamily}
                          onChange={(e) => {
                              setFontProps({...fontProps, fontFamily: e.target.value});
                              updateObjectProp('fontFamily', e.target.value);
                          }}
                      >
                          {systemFonts.map(font => (
                            <option key={font} value={font} style={{ fontFamily: font }}>
                              {font}
                            </option>
                          ))}
                      </select>
                  </div>
                  <div className="flex space-x-2 mt-2">
                      <button
                          className={`flex-1 border p-1 rounded ${fontProps.fontWeight === 'bold' ? 'bg-blue-100 dark:bg-blue-900 border-blue-400' : ''}`}
                          onClick={() => {
                              const newWeight = fontProps.fontWeight === 'bold' ? 'normal' : 'bold';
                              setFontProps({...fontProps, fontWeight: newWeight});
                              updateObjectProp('fontWeight', newWeight);
                          }}
                      >
                          <span className="font-bold">B</span>
                      </button>
                      <button
                          className={`flex-1 border p-1 rounded italic ${fontProps.fontStyle === 'italic' ? 'bg-blue-100 dark:bg-blue-900 border-blue-400' : ''}`}
                          onClick={() => {
                              const newStyle = fontProps.fontStyle === 'italic' ? 'normal' : 'italic';
                              setFontProps({...fontProps, fontStyle: newStyle});
                              updateObjectProp('fontStyle', newStyle);
                          }}
                      >
                          I
                      </button>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold mb-2">Text Content</h4>
                    <p className="text-gray-500 text-[10px] mb-1">Use {'{{column_name}}'} for dynamic Excel data</p>
                    <input
                      className="border p-1 w-full dark:bg-gray-800"
                      value={selectedObject.text}
                      onChange={(e) => {
                        selectedObject.set('text', e.target.value);
                        window.fabricCanvas.renderAll();
                        setHasUnsavedChanges(true);
                        setProps({...props}); // Force update
                      }}
                    />
                  </div>
                </div>
             )}
          </div>
        ) : (
          <div className="text-xs text-gray-500 italic">No object selected</div>
        )}
      </div>

      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold mb-2">LAYERS</h3>
        <ul className="text-xs space-y-1">
          <li className="flex justify-between items-center p-1 bg-gray-100 dark:bg-gray-800 rounded"><span>Layer 3: Dynamic</span> <span>👁️ 🔓</span></li>
          <li className="flex justify-between items-center p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"><span>Layer 2: Static</span> <span>👁️ 🔓</span></li>
          <li className="flex justify-between items-center p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"><span>Layer 1: Background</span> <span>👁️ 🔒</span></li>
        </ul>
        <button className="text-xs text-blue-500 mt-2 hover:underline">+ Add Layer</button>
      </div>
    </div>
  );
}
