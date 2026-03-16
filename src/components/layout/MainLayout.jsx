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
