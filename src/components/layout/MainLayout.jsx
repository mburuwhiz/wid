import React from 'react';
import TitleBar from './TitleBar';
import TopRibbon from './TopRibbon';
import LeftToolbar from './LeftToolbar';
import CenterWorkspace from './CenterWorkspace';
import RightSidebar from './RightSidebar';
import BottomStatusBar from './BottomStatusBar';
import useStore from '../../store/useStore';
import { Toaster } from 'sonner';

export default function MainLayout() {
  const theme = useStore((state) => state.theme);
  const { setRecords, setCalibration, setHasUnsavedChanges } = useStore();

  React.useEffect(() => {
      // Check for autosave on mount
      const checkAutosave = async () => {
          try {
              const autosavePath = await window.electronAPI.checkAutosave();
              if (autosavePath) {
                  // Standard confirm for simplicity in MVP, ideally a custom modal
                  if (window.confirm('An unsaved autosave was found from a previous session. Would you like to restore it?')) {
                      const parsed = await window.electronAPI.loadWzip(autosavePath);
                      if (window.fabricCanvas) {
                           window.fabricCanvas.loadFromJSON(parsed.layout, () => {
                               window.fabricCanvas.renderAll();
                           });
                      }
                      setRecords(parsed.data?.records || []);
                      setCalibration(parsed.calibration);
                      setHasUnsavedChanges(true); // Still unsaved as an official .wzid
                  } else {
                      await window.electronAPI.discardAutosave(autosavePath);
                  }
              }
          } catch(e) {
              console.error("Autosave check failed", e);
          }
      };

      // Delay slightly to ensure fabric is ready
      setTimeout(checkAutosave, 500);
  }, []);

  return (
    <div className={`flex flex-col h-screen w-full overflow-hidden ${theme === 'dark' ? 'dark text-white' : 'text-black'}`}>
      <Toaster position="bottom-right" theme={theme} />
      <TitleBar />
      <TopRibbon />
      <div className="flex flex-1 overflow-hidden">
        <LeftToolbar />
        <CenterWorkspace />
        <RightSidebar />
      </div>
      <BottomStatusBar />
    </div>
  );
}
