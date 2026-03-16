# 🪪 WhizIP Pro
**By Whizpoint Solutions**

![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

WhizIP Pro is an advanced, high-precision desktop publishing application engineered specifically for batch ID card generation. It solves the complex problem of designing a single CR80-sized ID card and perfectly mapping hundreds of student/employee records onto mathematically precise A4 print matrices.

Unlike standard web-based ID generators, WhizIP Pro operates locally, utilizing a custom Electron protocol to handle massive batches of high-resolution photos without crashing system memory. 

## ✨ Key Features

* **🎨 Professional Ribbon UI:** A context-sensitive, MS Word-style interface with advanced layer management, OS font integration, and precision alignment tools.
* **📐 The Precision Print Engine:** Designs are locked to a magnified CR80 ratio (85.6mm x 54mm) and mathematically rendered onto A4 PDF sheets using user-calibrated, millimeter-perfect margins (Top: 30.0mm, Left: 31.2mm, Gutter: 25.4mm).
* **⚡ Memory-Optimized Batching:** Merges large `.xlsx`/`.csv` datasets with local image folders. Images are served via local `file://` protocols, allowing the app to process batches of 500+ records lightning fast..
* **📦 Proprietary `.wzip` Format:** Saves projects by packaging the JSON layout, data arrays, and *only* the successfully matched photos into a single, shareable compressed file.
* **🛡️ Smart Data Validation:** Built-in Batch Manager that automatically detects missing photos or text fields, isolates failed records, and exports error reports for manual correction.

## 🛠️ Tech Stack
* **Frontend:** React.js, Tailwind CSS
* **Canvas Engine:** Fabric.js / Konva.js
* **Backend:** Electron.js, Node.js (`fs`, `ipcMain`)
* **Utilities:** `pdf-lib` (Print rendering), `xlsx` (Data parsing), `archiver` (Packaging)
