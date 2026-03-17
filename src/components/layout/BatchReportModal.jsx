import React, { useState } from 'react';
import useStore from '../../store/useStore';
import { toast } from 'sonner';

export default function BatchReportModal({ onClose }) {
  const { theme, records, fileName } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, complete, failed
  const [exporting, setExporting] = useState(false);

  // Very basic validation: If a record has photoid but no _photoPath, it's failed.
  // We'll also consider empty 'name' failed for demo purposes.
  const processedRecords = records.map(r => {
      const missing = [];
      if (r.photoid && !r._photoPath) missing.push('Photo Missing');
      if (!r.name) missing.push('Name Missing');

      return {
          ...r,
          _status: missing.length > 0 ? 'failed' : 'complete',
          _missingFields: missing
      };
  });

  const completeCount = processedRecords.filter(r => r._status === 'complete').length;
  const failedCount = processedRecords.filter(r => r._status === 'failed').length;

  const handleExportFailed = async () => {
      const failedRecords = processedRecords.filter(r => r._status === 'failed').map(r => {
          const out = { ...r, ErrorReason: r._missingFields.join(', ') };
          delete out._status;
          delete out._missingFields;
          delete out._photoPath;
          return out;
      });

      if (failedRecords.length === 0) {
          toast.info("No failed records to export");
          return;
      }

      try {
          setExporting(true);
          const result = await window.electronAPI.showSaveDialog({
              title: 'Export Failed Records',
              defaultPath: 'Failed_Records.xlsx',
              filters: [{ name: 'Excel Workbook', extensions: ['xlsx'] }]
          });

          if (!result.canceled && result.filePath) {
              await window.electronAPI.exportFailedExcel({
                  filePath: result.filePath,
                  records: failedRecords
              });
              toast.success("Failed records exported successfully");
          }
      } catch (err) {
          console.error(err);
          toast.error("Error exporting failed records");
      } finally {
          setExporting(false);
      }
  };

  const filteredRecords = processedRecords.filter(r => {
      if (filter === 'complete' && r._status !== 'complete') return false;
      if (filter === 'failed' && r._status !== 'failed') return false;
      if (searchTerm) {
          const st = searchTerm.toLowerCase();
          return Object.values(r).some(v => String(v).toLowerCase().includes(st));
      }
      return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black bg-opacity-60 items-center py-10">
      <div className={`w-11/12 max-w-6xl flex-1 flex flex-col rounded shadow-xl overflow-hidden ${theme === 'light' ? 'bg-white text-black' : 'bg-[#1e1e1e] text-white'}`}>
        {/* Header */}
        <div className="flex justify-between items-center p-3 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#2d2d2d]">
          <h2 className="font-semibold text-sm">BATCH REPORT - {fileName}</h2>
          <button onClick={onClose} className="hover:text-red-500 font-bold px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">✕ Close</button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center space-x-4 p-3 border-b border-gray-300 dark:border-gray-600 text-sm">
            <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded ${filter === 'all' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-800'}`}>All ({records.length})</button>
            <button onClick={() => setFilter('complete')} className={`px-3 py-1.5 rounded ${filter === 'complete' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800'}`}>🟢 Completed ({completeCount})</button>
            <button onClick={() => setFilter('failed')} className={`px-3 py-1.5 rounded ${filter === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-800'}`}>🔴 Failed ({failedCount})</button>
            <div className="flex-grow" />
            <input
              type="text"
              placeholder="🔍 Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border px-3 py-1.5 rounded w-64 text-black dark:text-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            />
            <button
                onClick={handleExportFailed}
                disabled={exporting || failedCount === 0}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
                {exporting ? '⏳ Exporting...' : '📥 Export Failed'}
            </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-[#121212] p-4">
            <table className="w-full text-left border-collapse text-sm">
                <thead>
                    <tr className="border-b border-gray-300 dark:border-gray-700">
                        <th className="p-2 font-semibold text-gray-500">Status</th>
                        <th className="p-2 font-semibold text-gray-500">Photo</th>
                        <th className="p-2 font-semibold text-gray-500">Name</th>
                        <th className="p-2 font-semibold text-gray-500">Photoid</th>
                        <th className="p-2 font-semibold text-gray-500">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredRecords.map((record, idx) => (
                        <tr key={idx} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/50">
                            <td className="p-2">{record._status === 'complete' ? '🟢' : '🔴'}</td>
                            <td className="p-2">
                                {record._photoPath ? (
                                    <img src={record._photoPath} alt="Photo" className="w-8 h-8 object-cover rounded" />
                                ) : (
                                    <span className="text-xl">❌</span>
                                )}
                            </td>
                            <td className="p-2">{record.name || <span className="text-red-500 italic">Missing</span>}</td>
                            <td className="p-2">{record.photoid || '-'}</td>
                            <td className="p-2">
                                <button className="text-blue-500 hover:underline mr-3 text-xs flex items-center">
                                  <span className="mr-1">👁️</span> View
                                </button>
                                {record._status === 'failed' && (
                                    <button className="text-red-500 hover:underline text-xs flex items-center">
                                      <span className="mr-1">✏️</span> Edit
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {filteredRecords.length === 0 && (
                        <tr>
                            <td colSpan="5" className="p-8 text-center text-gray-500">No records found matching criteria.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
