import React, { useEffect, useState } from 'react';
import useStore from '../../store/useStore';

export default function RightSidebar() {
  const { theme, selectedObject } = useStore();
  const [props, setProps] = useState({ x: 0, y: 0, w: 0, h: 0, angle: 0 });

  useEffect(() => {
    if (selectedObject) {
      // 1009 / 85.6 is our pixel to mm ratio
      const ratio = 85.6 / 1009;
      setProps({
        x: ((selectedObject.left || 0) * ratio).toFixed(1),
        y: ((selectedObject.top || 0) * ratio).toFixed(1),
        w: (((selectedObject.width || 0) * (selectedObject.scaleX || 1)) * ratio).toFixed(1),
        h: (((selectedObject.height || 0) * (selectedObject.scaleY || 1)) * ratio).toFixed(1),
        angle: Math.round(selectedObject.angle || 0)
      });
    }
  }, [selectedObject]);

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

             {selectedObject.type === 'i-text' && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-semibold mb-2">Text Content</h4>
                  <p className="text-gray-500 text-[10px] mb-1">Use {'{{column_name}}'} for dynamic Excel data</p>
                  <input
                    className="border p-1 w-full dark:bg-gray-800"
                    value={selectedObject.text}
                    onChange={(e) => {
                      selectedObject.set('text', e.target.value);
                      window.fabricCanvas.renderAll();
                      setProps({...props}); // Force update
                    }}
                  />
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
