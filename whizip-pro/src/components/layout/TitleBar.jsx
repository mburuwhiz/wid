import React from 'react';
import useStore from '../../store/useStore';

export default function TitleBar() {
  const theme = useStore((state) => state.theme);
  const fileName = useStore((state) => state.fileName);

  const handleMinimize = () => window.electronAPI.windowMinimize();
  const handleMaximize = () => window.electronAPI.windowMaximize();
  const handleClose = () => window.electronAPI.windowClose();

  return (
    <div
      className={`flex justify-between items-center h-8 select-none ${theme === 'light' ? 'bg-white text-black' : 'bg-[#1e1e1e] text-white'}`}
      style={{ WebkitAppRegion: 'drag' }}
      onDoubleClick={handleMaximize}
    >
      <div className="flex items-center pl-2 space-x-2">
        <img src="../logo.png" alt="logo" className="w-4 h-4 object-contain" />
        <span className="text-xs font-semibold">WhizIP Pro - {fileName} - Whizpoint Solutions</span>
      </div>

      <div className="flex" style={{ WebkitAppRegion: 'no-drag' }}>
        <button className="h-8 w-11 hover:bg-gray-200 dark:hover:bg-gray-700 flex justify-center items-center text-xs" onClick={handleMinimize}>
          —
        </button>
        <button className="h-8 w-11 hover:bg-gray-200 dark:hover:bg-gray-700 flex justify-center items-center text-xs" onClick={handleMaximize}>
          □
        </button>
        <button className="h-8 w-11 hover:bg-red-500 hover:text-white flex justify-center items-center text-xs" onClick={handleClose}>
          ✕
        </button>
      </div>
    </div>
  );
}
