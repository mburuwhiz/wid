import React, { useState } from 'react';
import useStore from '../../store/useStore';
import { toast } from 'sonner';

export default function CalibrationModal({ onClose }) {
  const { theme, calibration, setCalibration } = useStore();
  const [localCal, setLocalCal] = useState(calibration);

  const handleSave = () => {
    setCalibration(localCal);
    toast.success('Calibration saved successfully');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`w-[500px] rounded shadow-xl ${theme === 'light' ? 'bg-white text-black' : 'bg-[#1e1e1e] text-white'}`}>
        <div className="flex justify-between items-center p-3 border-b border-gray-300 dark:border-gray-600">
          <h2 className="font-semibold flex items-center"><span className="mr-2">🔧</span> PRINTER CALIBRATION</h2>
          <button onClick={onClose} className="hover:text-red-500">✕</button>
        </div>

        <div className="p-4 space-y-4 text-sm">
          <p className="text-orange-500 bg-orange-50 dark:bg-orange-900/20 p-2 rounded text-xs border border-orange-200 dark:border-orange-800">
            ⚠️ <strong>Warning:</strong> Changing these values affects print accuracy. Measure test printouts with a ruler before adjusting.
          </p>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Top Margin (mm):</span>
              <input type="number" step="0.1" value={localCal.top_margin} onChange={(e) => setLocalCal({...localCal, top_margin: parseFloat(e.target.value)})} className="border rounded px-2 py-1 w-24 text-black" />
            </div>
            <div className="flex justify-between items-center">
              <span>Left Margin (mm):</span>
              <input type="number" step="0.1" value={localCal.left_margin} onChange={(e) => setLocalCal({...localCal, left_margin: parseFloat(e.target.value)})} className="border rounded px-2 py-1 w-24 text-black" />
            </div>
            <div className="flex justify-between items-center">
              <span>Space Between (mm):</span>
              <input type="number" step="0.1" value={localCal.space_between} onChange={(e) => setLocalCal({...localCal, space_between: parseFloat(e.target.value)})} className="border rounded px-2 py-1 w-24 text-black" />
            </div>
          </div>

          <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
            <div className="flex justify-between items-center text-gray-500">
              <span>Card Width:</span>
              <span>{calibration.card_width} mm [LOCKED]</span>
            </div>
            <div className="flex justify-between items-center text-gray-500 mt-2">
              <span>Card Height:</span>
              <span>{calibration.card_height} mm [LOCKED]</span>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-gray-300 dark:border-gray-600 flex justify-end space-x-2 bg-gray-50 dark:bg-[#2d2d2d] rounded-b">
          <button onClick={onClose} className="px-4 py-1.5 border rounded hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          <button onClick={handleSave} className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">💾 Save Profile</button>
        </div>
      </div>
    </div>
  );
}
