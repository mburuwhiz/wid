import React, { useEffect, useRef } from 'react';
import useStore from '../../store/useStore';
import { fabric } from 'fabric';

export default function CenterWorkspace() {
  const { theme, zoomLevel, setZoomLevel, setSelectedObject } = useStore();
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);

  useEffect(() => {
    // Initialize Fabric.js Canvas
    fabricRef.current = new fabric.Canvas('fabric-canvas', {
      width: 1009, // 85.6mm at 300dpi roughly
      height: 638, // 54.0mm at 300dpi roughly
      backgroundColor: theme === 'light' ? '#ffffff' : '#e0e0e0', // Base white
      selection: true,
    });

    // Store canvas globally for tools to access (since we are not lifting state up for the POC)
    window.fabricCanvas = fabricRef.current;

    const fCanvas = fabricRef.current;

    // Add a basic grid (optional visualization) or initial text to test
    const text = new fabric.Text('WhizIP Pro Canvas', {
      left: 300,
      top: 300,
      fontSize: 40,
      fontFamily: 'Arial',
      fill: theme === 'light' ? '#000000' : '#1e1e1e',
    });
    fCanvas.add(text);

    // Event Listeners for Object Selection
    fCanvas.on('selection:created', (e) => setSelectedObject(e.selected[0]));
    fCanvas.on('selection:updated', (e) => setSelectedObject(e.selected[0]));
    fCanvas.on('selection:cleared', () => setSelectedObject(null));

    // Simple Panning (Middle Mouse or Space+Drag implementation later)
    fCanvas.on('mouse:down', function(opt) {
      var evt = opt.e;
      if (evt.altKey === true) {
        this.isDragging = true;
        this.selection = false;
        this.lastPosX = evt.clientX;
        this.lastPosY = evt.clientY;
      }
    });
    fCanvas.on('mouse:move', function(opt) {
      if (this.isDragging) {
        var e = opt.e;
        var vpt = this.viewportTransform;
        vpt[4] += e.clientX - this.lastPosX;
        vpt[5] += e.clientY - this.lastPosY;
        this.requestRenderAll();
        this.lastPosX = e.clientX;
        this.lastPosY = e.clientY;
      }
    });
    fCanvas.on('mouse:up', function(opt) {
      this.setViewportTransform(this.viewportTransform);
      this.isDragging = false;
      this.selection = true;
    });

    // Cleanup
    return () => {
      fCanvas.dispose();
    };
  }, []); // Run once on mount

  // Update background when theme changes (if we want the card background to change, usually it stays white)
  useEffect(() => {
    if (fabricRef.current) {
      fabricRef.current.setBackgroundColor(theme === 'light' ? '#ffffff' : '#ffffff', fabricRef.current.renderAll.bind(fabricRef.current));
    }
  }, [theme]);

  // Handle CSS zoom visually instead of redrawing fabric canvas scaling to keep resolution high
  const workspaceScaleStyle = {
    transform: `scale(${zoomLevel})`,
    transformOrigin: 'top left', // Or center, depends on panning logic
    width: '1009px',
    height: '638px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'transform 0.1s ease-out'
  };

  return (
    <div className={`flex-grow h-full overflow-auto relative ${theme === 'light' ? 'bg-[#e9ecef]' : 'bg-[#121212]'}`}>

      {/* Rulers Placeholder */}
      <div className="absolute top-0 left-6 right-0 h-6 border-b z-10 select-none overflow-hidden" style={{ backgroundColor: theme === 'light' ? '#ffffff' : '#2d2d2d', borderColor: theme === 'light' ? '#dee2e6' : '#404040' }}>
        <span className="text-[10px] pl-2 text-gray-500">0 10 20 30 40 50 60 70 80 (mm)</span>
      </div>
      <div className="absolute top-6 left-0 bottom-0 w-6 border-r z-10 select-none overflow-hidden" style={{ backgroundColor: theme === 'light' ? '#ffffff' : '#2d2d2d', borderColor: theme === 'light' ? '#dee2e6' : '#404040' }}>
         <span className="text-[10px] transform -rotate-90 origin-left mt-8 block whitespace-nowrap text-gray-500">0 10 20 30 40 50 (mm)</span>
      </div>

      {/* Canvas Container Wrapper for visual scrolling and panning */}
      <div className="absolute top-6 left-6 right-0 bottom-0 overflow-auto flex items-center justify-center p-10">

        {/* The visual scaled wrapper */}
        <div style={workspaceScaleStyle} className="bg-white shrink-0 relative">
          <canvas id="fabric-canvas" ref={canvasRef}></canvas>
        </div>

      </div>
    </div>
  );
}
