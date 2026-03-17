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

  clipboard: null,
  setClipboard: (obj) => set({ clipboard: obj }),

  // --- Document Data (wzid) ---
  fileName: 'Untitled.wzid',
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

  // --- Undo/Redo Engine ---
  history: [],
  historyIndex: -1,
  isHistoryUpdating: false, // Flag to prevent infinite loops when loading history state

  saveHistoryState: () => {
    const state = get();
    if (state.isHistoryUpdating || !window.fabricCanvas) return;

    // Grab the current JSON state of the canvas
    const jsonState = window.fabricCanvas.toJSON(['isPhotoPlaceholder']);
    const historyState = JSON.stringify(jsonState);

    // If the new state is identical to the current history state, do nothing
    if (state.historyIndex >= 0 && state.history[state.historyIndex] === historyState) {
        return;
    }

    // Create new history array by slicing off any "redo" futures
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(historyState);

    // Keep max 50 steps
    if (newHistory.length > 50) {
        newHistory.shift();
    }

    set({
        history: newHistory,
        historyIndex: newHistory.length - 1,
        hasUnsavedChanges: true,
    });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
        set({ isHistoryUpdating: true });
        const prevIndex = state.historyIndex - 1;
        const prevState = state.history[prevIndex];

        window.fabricCanvas.loadFromJSON(prevState, () => {
            window.fabricCanvas.renderAll();
            set({ historyIndex: prevIndex, isHistoryUpdating: false, hasUnsavedChanges: true });
        });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
        set({ isHistoryUpdating: true });
        const nextIndex = state.historyIndex + 1;
        const nextState = state.history[nextIndex];

        window.fabricCanvas.loadFromJSON(nextState, () => {
            window.fabricCanvas.renderAll();
            set({ historyIndex: nextIndex, isHistoryUpdating: false, hasUnsavedChanges: true });
        });
    }
  },
}));

export default useStore;
