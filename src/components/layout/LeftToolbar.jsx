import React, { useEffect } from 'react';
import { fabric } from 'fabric';
import { MousePointer2, Hand, ZoomIn, Type, Image as ImageIcon, ImagePlus, Square, Circle, Barcode, AlignCenterHorizontal, Settings, Trash2 } from 'lucide-react';
import useStore from '../../store/useStore';
import { toast } from 'sonner';

export default function LeftToolbar() {
  const { theme, setHasUnsavedChanges, clipboard, setClipboard } = useStore();

  const handleAddText = () => {
    if (window.fabricCanvas) {
      const text = new fabric.IText('New Text', {
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
      const rect = new fabric.Rect({
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

  const handleAddEllipse = () => {
    if (window.fabricCanvas) {
      const ellipse = new fabric.Ellipse({
        left: window.fabricCanvas.width / 2,
        top: window.fabricCanvas.height / 2,
        fill: '#cccccc',
        rx: 50,
        ry: 50,
        originX: 'center',
        originY: 'center',
      });
      window.fabricCanvas.add(ellipse);
      window.fabricCanvas.setActiveObject(ellipse);
      setHasUnsavedChanges(true);
    }
  };

  const handleAddLine = () => {
    if (window.fabricCanvas) {
      const line = new fabric.Line([-50, 0, 50, 0], {
        left: window.fabricCanvas.width / 2,
        top: window.fabricCanvas.height / 2,
        stroke: '#000000',
        strokeWidth: 2,
        originX: 'center',
        originY: 'center',
      });
      window.fabricCanvas.add(line);
      window.fabricCanvas.setActiveObject(line);
      setHasUnsavedChanges(true);
    }
  };

  const handleAddBarcode = () => {
    if (window.fabricCanvas) {
      // Placeholder representation for a barcode/QR
      const barcodeGroup = new fabric.Group([
          new fabric.Rect({
              width: 150, height: 50, fill: '#ffffff', stroke: '#000', originX: 'center', originY: 'center'
          }),
          new fabric.Text('|| ||| | |||', {
              fontFamily: 'monospace', fontSize: 30, originX: 'center', originY: 'center', fontWeight: 'bold'
          })
      ], {
          left: window.fabricCanvas.width / 2,
          top: window.fabricCanvas.height / 2,
          originX: 'center',
          originY: 'center',
      });
      barcodeGroup.set('isBarcode', true); // Identify as dynamic later if needed
      window.fabricCanvas.add(barcodeGroup);
      window.fabricCanvas.setActiveObject(barcodeGroup);
      setHasUnsavedChanges(true);
      toast.info('Added Barcode Placeholder. Future logic will bind this to data.');
    }
  };

  const handleAddPhotoPlaceholder = () => {
    if (window.fabricCanvas) {
      // Create a rect that acts as a placeholder
      const rect = new fabric.Rect({
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

        const imgUrl = `whizid://${filePath}`;

        fabric.Image.fromURL(imgUrl, (img) => {
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
    const Copy = () => {
      if (!window.fabricCanvas) return;
      const activeObj = window.fabricCanvas.getActiveObject();
      if (!activeObj || activeObj.isEditing) return;
      activeObj.clone((cloned) => {
        setClipboard(cloned);
      }, ['isPhotoPlaceholder', 'isBarcode']);
    };

    const Paste = () => {
      const currentClipboard = useStore.getState().clipboard;
      if (!window.fabricCanvas || !currentClipboard) return;

      const activeObj = window.fabricCanvas.getActiveObject();
      if (activeObj && activeObj.isEditing) return;

      currentClipboard.clone((clonedObj) => {
        window.fabricCanvas.discardActiveObject();
        clonedObj.set({
          left: clonedObj.left + 10,
          top: clonedObj.top + 10,
          evented: true,
        });
        if (clonedObj.type === 'activeSelection') {
          clonedObj.canvas = window.fabricCanvas;
          clonedObj.forEachObject(function(obj) {
            window.fabricCanvas.add(obj);
          });
          clonedObj.setCoords();
        } else {
          window.fabricCanvas.add(clonedObj);
        }

        // Update clipboard object for consecutive pastes
        currentClipboard.top += 10;
        currentClipboard.left += 10;
        setClipboard(currentClipboard);

        window.fabricCanvas.setActiveObject(clonedObj);
        window.fabricCanvas.requestRenderAll();
        setHasUnsavedChanges(true);
      }, ['isPhotoPlaceholder', 'isBarcode']);
    };

    const handleKeyDown = (e) => {
      if (window.fabricCanvas) {
        const activeObj = window.fabricCanvas.getActiveObject();
        if (activeObj && activeObj.isEditing) return;

        if (e.key === 'Delete' || e.key === 'Backspace') {
          handleDelete();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
          Copy();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
          Paste();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
          Copy();
          handleDelete();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
          e.preventDefault();
          Copy();
          // slight delay for duplicate to ensure clipboard state set
          setTimeout(Paste, 50);
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
        <ToolButton icon={Circle} label="Ellipse (O)" onClick={handleAddEllipse} />
        <button
          className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 mx-auto my-1 text-gray-700 dark:text-gray-300 transition-colors"
          title="Line (L)"
          onClick={handleAddLine}
        >
          <div className="w-5 h-0.5 bg-current transform -rotate-45" />
        </button>
        <ToolButton icon={Barcode} label="Barcode (B)" onClick={handleAddBarcode} />

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
