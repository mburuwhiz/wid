import { create } from 'zustand';

const useStore = create((set, get) => ({
  // --- UI State ---
  theme: 'light', // 'light' | 'dark'
  toggleTheme: () => set(state => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

  activeTab: 'HOME', // 'FILE' | 'HOME' | 'INSERT' | 'BATCH DATA' | etc.
  setActiveTab: (tab) => set({ activeTab: tab }),

  zoomLevel: 1.0,
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),

  isLivePreviewMode: false,
  setLivePreviewMode: (isLive) => set({ isLivePreviewMode: isLive }),

  selectedObject: null,
  setSelectedObject: (obj) => set({ selectedObject: obj }),

  // --- Document Data (wzip) ---
  fileName: 'Untitled.wzip',
  setFileName: (name) => set({ fileName: name }),

  records: [], // from data.json
  setRecords: (records) => set({ records }),

  failedRecords: [],
  setFailedRecords: (failed) => set({ failedRecords: failed }),

  currentRecordIndex: 0,
  setCurrentRecordIndex: (idx) => set({ currentRecordIndex: idx }),

  // Canvas JSON
  canvasJSON: null,
  setCanvasJSON: (json) => set({ canvasJSON: json }),

  // Print Calibration
  calibration: {
    top_margin: 30.0,
    left_margin: 31.2,
    space_between: 25.4,
    card_width: 85.6,
    card_height: 54.0,
  },
  setCalibration: (newCalibration) => set({ calibration: { ...get().calibration, ...newCalibration } }),

  // Undo/Redo tracking (simplified)
  hasUnsavedChanges: false,
  setHasUnsavedChanges: (val) => set({ hasUnsavedChanges: val }),
}));

export default useStore;
