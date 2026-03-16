import React, { useEffect } from 'react';
import { MousePointer2, Hand, ZoomIn, Type, Image as ImageIcon, ImagePlus, Square, Circle, Barcode, AlignCenterHorizontal, Settings, Trash2 } from 'lucide-react';
import useStore from '../../store/useStore';
import { toast } from 'sonner';

export default function LeftToolbar() {
  const { theme, setHasUnsavedChanges } = useStore();

  const handleAddText = () => {
    if (window.fabricCanvas) {
      const text = new window.fabric.IText('New Text', {
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

  const handleAddRect = () => {
    if (window.fabricCanvas) {
      const rect = new window.fabric.Rect({
        left: window.fabricCanvas.width / 2,
        top: window.fabricCanvas.height / 2,
        fill: '#cccccc',
        width: 100,
        height: 100,
        originX: 'center',
        originY: 'center',
      });
      window.fabricCanvas.add(rect);
      window.fabricCanvas.setActiveObject(rect);
      setHasUnsavedChanges(true);
    }
  };

  const handleAddPhotoPlaceholder = () => {
    if (window.fabricCanvas) {
      // Create a rect that acts as a placeholder
      const rect = new window.fabric.Rect({
        left: window.fabricCanvas.width / 2,
        top: window.fabricCanvas.height / 2,
        fill: '#e0e0e0',
        stroke: '#999999',
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        width: 150,
        height: 200,
        originX: 'center',
        originY: 'center',
        rx: 20, // default rounded corner
        ry: 20,
      });

      // Give it a special property so we know it's a photo placeholder
      rect.set('isPhotoPlaceholder', true);

      window.fabricCanvas.add(rect);
      window.fabricCanvas.setActiveObject(rect);
      setHasUnsavedChanges(true);
      toast.info('Added Photo Placeholder. In Live Mode, this will show the matched photo.');
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

        // Ensure path is allowed by doing a dummy readdir on its directory
        const dirPath = filePath.substring(0, Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\')));
        await window.electronAPI.readDirectory(dirPath);

        const imgUrl = `whizip://${filePath}`;

        window.fabric.Image.fromURL(imgUrl, (img) => {
           // Scale down if too big
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
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to insert image.');
    }
  };

  const handleDelete = () => {
    if (window.fabricCanvas) {
      const activeObjects = window.fabricCanvas.getActiveObjects();
      if (activeObjects.length) {
        window.fabricCanvas.discardActiveObject();
        activeObjects.forEach(function(object) {
          window.fabricCanvas.remove(object);
        });
        setHasUnsavedChanges(true);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only delete if we are not editing text inside an IText object
        if (window.fabricCanvas) {
          const activeObj = window.fabricCanvas.getActiveObject();
          if (activeObj && activeObj.isEditing) return;
          handleDelete();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const ToolButton = ({ icon: Icon, label, onClick }) => (
    <button
      className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 mx-auto my-1 text-gray-700 dark:text-gray-300 transition-colors"
      title={label}
      onClick={onClick}
    >
      <Icon size={18} />
    </button>
  );

  return (
    <div className={`w-12 h-full flex flex-col border-r select-none ${theme === 'light' ? 'bg-[#f8f9fa] border-[#dee2e6]' : 'bg-[#2d2d2d] border-[#404040]'}`}>
      <div className="py-2 flex flex-col space-y-1">
        <ToolButton icon={MousePointer2} label="Select (V)" />
        <ToolButton icon={Hand} label="Pan (H)" />
        <ToolButton icon={ZoomIn} label="Zoom (Z)" />

        <div className="w-8 h-px bg-gray-300 dark:bg-gray-600 mx-auto my-2" />

        <ToolButton icon={Type} label="Text (T)" onClick={handleAddText} />
        <ToolButton icon={ImagePlus} label="Photo Placeholder (P)" onClick={handleAddPhotoPlaceholder} />
        <ToolButton icon={ImageIcon} label="Image (I)" onClick={handleAddImage} />
        <ToolButton icon={Square} label="Rectangle (R)" onClick={handleAddRect} />
        <ToolButton icon={Circle} label="Ellipse (O)" />
        <ToolButton icon={Barcode} label="Barcode (B)" />

        <div className="w-8 h-px bg-gray-300 dark:bg-gray-600 mx-auto my-2" />

        <ToolButton icon={Trash2} label="Delete Selected (Del)" onClick={handleDelete} />
        <ToolButton icon={AlignCenterHorizontal} label="Align (A)" />
      </div>

      <div className="mt-auto mb-2 flex flex-col items-center">
        <ToolButton icon={Settings} label="Settings" />
      </div>
    </div>
  );
}
