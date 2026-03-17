import { app, BrowserWindow, ipcMain, dialog, protocol } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import archiver from 'archiver';
import unzipper from 'unzipper';
import * as xlsx from 'xlsx';
import { PDFDocument, rgb } from 'pdf-lib';
import { fileURLToPath } from 'url';
import SystemFonts from 'system-font-families';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Optional: create a temp dir for autosave
const autosaveDir = path.join(os.tmpdir(), 'whizid-autosave');
if (!fs.existsSync(autosaveDir)) {
    fs.mkdirSync(autosaveDir, { recursive: true });
}

const extractBaseDir = path.join(os.tmpdir(), 'whizid-extracts');
if (!fs.existsSync(extractBaseDir)) {
    fs.mkdirSync(extractBaseDir, { recursive: true });
}

// Store a list of user-approved directories for the custom protocol
const allowedDirectories = new Set([extractBaseDir]);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false, // Frameless window
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../logo.png'),
  });

  // Load the React app
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    // Vite dev server URL
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  // Register custom protocol whizid:// for local images
  protocol.registerFileProtocol('whizid', (request, callback) => {
    const url = request.url.replace('whizid://', '');
    try {
      const decodedUrl = decodeURIComponent(url);

      // Security Check: Ensure the path is within one of our allowed directories
      const normalizedPath = path.normalize(decodedUrl);
      const isAllowed = Array.from(allowedDirectories).some(dir => normalizedPath.startsWith(dir));

      if (isAllowed) {
          return callback(normalizedPath);
      } else {
          console.error(`Blocked attempt to access file outside of allowed directory: ${normalizedPath}`);
          return callback({ error: -2 }); // -2 is FILE_NOT_FOUND
      }
    } catch (error) {
      console.error('Failed to handle custom protocol request', error);
      return callback({ error: -2 });
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers for window controls
ipcMain.handle('window-minimize', () => mainWindow.minimize());
ipcMain.handle('window-maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});
ipcMain.handle('window-close', () => mainWindow.close());

// Open Dialog
ipcMain.handle('dialog-open', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// Save Dialog
ipcMain.handle('dialog-save', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

// Autosave Check on Startup
ipcMain.handle('check-autosave', async () => {
    try {
        const files = fs.readdirSync(autosaveDir);
        // Find the most recent autosave
        const wzipFiles = files.filter(f => f.endsWith('.wzid')).sort().reverse();
        if (wzipFiles.length > 0) {
            return path.join(autosaveDir, wzipFiles[0]);
        }
        return null;
    } catch (e) {
        return null;
    }
});

// Get System Fonts
ipcMain.handle('get-system-fonts', async () => {
    try {
        const systemFonts = new SystemFonts.default();
        return systemFonts.getFontsSync();
    } catch (e) {
        console.error("Failed to load system fonts", e);
        return ['Arial', 'Times New Roman', 'Courier New', 'Helvetica']; // Fallback
    }
});

// File System - Read directory
ipcMain.handle('fs-readdir', async (event, dirPath) => {
  try {
    // Add to allowed directories since the user explicitly selected this
    allowedDirectories.add(path.normalize(dirPath));
    return fs.readdirSync(dirPath);
  } catch (error) {
    console.error('Error reading dir:', error);
    throw error;
  }
});

// Also allow opening directory via dialog and adding to allowed
ipcMain.handle('dialog-open-dir', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, { ...options, properties: ['openDirectory'] });
  if (!result.canceled && result.filePaths.length > 0) {
      allowedDirectories.add(path.normalize(result.filePaths[0]));
  }
  return result;
});

// Parse Excel
ipcMain.handle('parse-excel', async (event, filePath) => {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Parse with first row as headers
        const data = xlsx.utils.sheet_to_json(sheet, { raw: false, defval: "" });

        // Normalize headers
        const normalizedData = data.map(row => {
            const newRow = {};
            for (const key in row) {
                const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
                newRow[normalizedKey] = row[key];
            }
            return newRow;
        });

        return normalizedData;
    } catch(err) {
        console.error("Error parsing excel", err);
        throw err;
    }
});

// Generate PDF
ipcMain.handle('generate-pdf', async (event, params) => {
    // params = { records, calibration, layout, outputPath, pageCount, images: [{ id: recordId, dataUrl: base64 }] }
    try {
        const pdfDoc = await PDFDocument.create();
        const { calibration, outputPath, records, images, batchName = "Batch_001" } = params;
        const PT_PER_MM = 2.83465;

        // Apply Document Properties based on specs
        pdfDoc.setTitle(batchName);
        pdfDoc.setAuthor('Whizpoint Solutions');
        pdfDoc.setSubject('institution Id');
        pdfDoc.setKeywords(['id cards', 'printing', 'WhizId']);
        pdfDoc.setCreator('WhizID Pro');
        pdfDoc.setProducer('WhizID Pro');

        // A4 Dimensions
        const pageWidth = 210 * PT_PER_MM;
        const pageHeight = 297 * PT_PER_MM;

        let page = pdfDoc.addPage([pageWidth, pageHeight]);
        let cardsOnPage = 0;

        for (let i = 0; i < records.length; i++) {
            const record = records[i];

            if (cardsOnPage >= 2) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                cardsOnPage = 0;
            }

            const x = calibration.left_margin * PT_PER_MM;
            const yOffset = cardsOnPage === 0
                ? calibration.top_margin
                : calibration.top_margin + calibration.card_height + calibration.space_between;

            // In PDF, Y origin is bottom-left, so we subtract from page height
            const y = pageHeight - (yOffset * PT_PER_MM) - (calibration.card_height * PT_PER_MM);

            // Find the rendered image for this record (passed from frontend as base64 dataUrl)
            const recordImage = images && images.find(img => img.index === i);

            if (recordImage) {
                // Embed the PNG image
                const base64Data = recordImage.dataUrl.split(',')[1];
                const imageBytes = Buffer.from(base64Data, 'base64');
                const embeddedImage = await pdfDoc.embedPng(imageBytes);

                page.drawImage(embeddedImage, {
                    x,
                    y,
                    width: calibration.card_width * PT_PER_MM,
                    height: calibration.card_height * PT_PER_MM,
                });
            } else {
                // Fallback bounding box
                page.drawRectangle({
                    x,
                    y,
                    width: calibration.card_width * PT_PER_MM,
                    height: calibration.card_height * PT_PER_MM,
                    borderColor: rgb(0, 0, 0),
                    borderWidth: 1,
                });
            }

            cardsOnPage++;
        }

        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(outputPath, pdfBytes);
        return true;
    } catch(err) {
        console.error("Error generating pdf", err);
        throw err;
    }
});

// WZIP Archiving
ipcMain.handle('save-wzid', async (event, params) => {
    return new Promise((resolve, reject) => {
        try {
            const output = fs.createWriteStream(params.filePath);
            const archive = archiver('zip', {
                zlib: { level: 9 } // max compression
            });

            output.on('close', function() {
                resolve({ success: true, bytes: archive.pointer() });
            });

            archive.on('error', function(err) {
                console.error('Archiver error:', err);
                reject(err);
            });

            archive.pipe(output);

            // Add JSON files safely ensuring string values
            archive.append(JSON.stringify(params.layout || {}, null, 2), { name: 'layout.json' });
            archive.append(JSON.stringify(params.data || { records: [] }, null, 2), { name: 'data.json' });
            archive.append(JSON.stringify(params.meta || {}, null, 2), { name: 'meta.json' });
            archive.append(JSON.stringify(params.calibration || {}, null, 2), { name: 'calibration.json' });

            archive.finalize();

            // Clean up old autosaves if this is an autosave
            if (params.isAutosave) {
                try {
                    const files = fs.readdirSync(autosaveDir);
                    const wzipFiles = files.filter(f => f.endsWith('.wzid')).sort();
                    if (wzipFiles.length > 5) {
                        for (let i = 0; i < wzipFiles.length - 5; i++) {
                            fs.unlinkSync(path.join(autosaveDir, wzipFiles[i]));
                        }
                    }
                } catch(e) {
                    console.error("Failed to clean up autosaves", e);
                }
            }
        } catch (error) {
            console.error('Save error:', error);
            reject(error);
        }
    });
});

ipcMain.handle('get-autosave-path', async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path.join(autosaveDir, `autosave_${timestamp}.wzid`);
});

ipcMain.handle('discard-autosave', async (event, filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
    } catch(e) {
        console.error("Failed to discard autosave", e);
    }
    return false;
});

ipcMain.handle('load-wzid', async (event, filePath) => {
    try {
        const extractDir = path.join(extractBaseDir, `extract-${Date.now()}`);
        fs.mkdirSync(extractDir, { recursive: true });

        const directory = await unzipper.Open.file(filePath);
        await directory.extract({ path: extractDir });

        const layoutStr = fs.readFileSync(path.join(extractDir, 'layout.json'), 'utf8');
        const dataStr = fs.readFileSync(path.join(extractDir, 'data.json'), 'utf8');
        const metaStr = fs.readFileSync(path.join(extractDir, 'meta.json'), 'utf8');
        const calibrationStr = fs.readFileSync(path.join(extractDir, 'calibration.json'), 'utf8');

        return {
            layout: JSON.parse(layoutStr),
            data: JSON.parse(dataStr),
            meta: JSON.parse(metaStr),
            calibration: JSON.parse(calibrationStr),
            extractDir
        };
    } catch (error) {
        console.error("Error loading wzid:", error);
        throw new Error("Failed to load document. File may be corrupted or missing required wzid files.");
    }
});
