import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getToken } from "../utils/auth.js";
import documentStorage from "../utils/documentStorage.js";
import { Dialog } from "@headlessui/react";
import { 
  CloudArrowDownIcon, 
  DocumentIcon, 
  TrashIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";

const DocumentDownloadManager = ({ policyId, policyData, onDownloadComplete }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [storageStats, setStorageStats] = useState(null);

  useEffect(() => {
    checkCacheStatus();
  }, [policyId]);

  const checkCacheStatus = async () => {
    try {
      const cached = await documentStorage.isDocumentCached(policyId);
      setIsCached(cached);
    } catch (error) {
      console.warn('Failed to check cache status:', error);
    }
  };

  const downloadDocument = async () => {
    if (!policyData || isDownloading) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const token = getToken();
      const result = await documentStorage.downloadDocument(
        policyId, 
        policyData, 
        token,
        (progress) => setDownloadProgress(progress)
      );

      setIsCached(true);
      toast.success(`Document downloaded for offline access! (${(result.size / 1024 / 1024).toFixed(1)} MB)`);
      
      if (onDownloadComplete) {
        onDownloadComplete(result);
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download document for offline access');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const removeDocument = async () => {
    if (!window.confirm('Remove this document from offline storage?')) return;

    try {
      await documentStorage.deleteDocument(policyId);
      setIsCached(false);
      toast.success('Document removed from offline storage');
    } catch (error) {
      console.error('Failed to remove document:', error);
      toast.error('Failed to remove document');
    }
  };

  const loadStorageStats = async () => {
    try {
      const stats = await documentStorage.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to load storage stats:', error);
    }
  };

  const openStorageModal = () => {
    setShowStorageModal(true);
    loadStorageStats();
  };

  const cleanupOldDocuments = async () => {
    try {
      const result = await documentStorage.cleanupOldDocuments(30);
      toast.success(`Cleaned up ${result.deletedCount} old documents`);
      loadStorageStats();
    } catch (error) {
      console.error('Cleanup failed:', error);
      toast.error('Failed to cleanup old documents');
    }
  };

  const clearAllDocuments = async () => {
    if (!window.confirm('Remove ALL downloaded documents? This cannot be undone.')) return;

    try {
      await documentStorage.clearAll();
      setIsCached(false);
      setStorageStats({ count: 0, totalSizeMB: 0, documents: [] });
      toast.success('All offline documents cleared');
    } catch (error) {
      console.error('Clear all failed:', error);
      toast.error('Failed to clear documents');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Download/Remove Button */}
      {isCached ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <CheckCircleIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Available offline</span>
          </div>
          <button
            onClick={removeDocument}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
            title="Remove from offline storage"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={downloadDocument}
          disabled={isDownloading}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <CloudArrowDownIcon className="h-4 w-4" />
          <span className="hidden sm:inline">
            {isDownloading ? `${downloadProgress}%` : 'Download for offline'}
          </span>
          <span className="sm:hidden">
            {isDownloading ? `${downloadProgress}%` : 'Download'}
          </span>
        </button>
      )}

      {/* Storage Management Button */}
      <button
        onClick={openStorageModal}
        className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
        title="Manage offline storage"
      >
        <DocumentIcon className="h-4 w-4" />
      </button>

      {/* Storage Management Modal */}
      {showStorageModal && (
        <Dialog open={true} onClose={() => setShowStorageModal(false)} className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-50" />
            <div className="bg-white w-full max-w-2xl p-6 rounded-lg shadow-lg relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Offline Document Storage</h3>
                <button
                  onClick={() => setShowStorageModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {storageStats && (
                <div className="space-y-4">
                  {/* Storage Stats */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Storage Usage</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Documents:</span>
                        <span className="ml-2 font-medium">{storageStats.count}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Size:</span>
                        <span className="ml-2 font-medium">{storageStats.totalSizeMB} MB</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={cleanupOldDocuments}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
                    >
                      Keep Recent 30
                    </button>
                    <button
                      onClick={clearAllDocuments}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Document List */}
                  {storageStats.documents.length > 0 && (
                    <div className="max-h-60 overflow-y-auto">
                      <h4 className="font-medium mb-2">Downloaded Documents</h4>
                      <div className="space-y-2">
                        {storageStats.documents.map((doc) => (
                          <div key={doc.policyId} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{doc.title}</p>
                              <p className="text-gray-500 text-xs">
                                {(doc.size / 1024 / 1024).toFixed(1)} MB • 
                                {new Date(doc.downloadDate).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => documentStorage.deleteDocument(doc.policyId).then(loadStorageStats)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-blue-800">
                      <p className="font-medium">About Offline Storage</p>
                      <p className="mt-1">Documents are stored locally in your browser for offline access. They don't count against your device storage quota and are automatically managed by the browser.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default DocumentDownloadManager; 