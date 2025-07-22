import { useEffect, useState } from "react";
import axios from "axios";
import { getToken, getUser } from "../utils/auth.js";
import { Link, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import BudgetChart from "../components/BudgetChart.jsx";
import DocumentDownloadManager from "../components/DocumentDownloadManager.jsx";
import OfflineDocumentIndicator from "../components/OfflineDocumentIndicator.jsx";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";
import { API_BASE } from "../utils/network.js";
import documentStorage from "../utils/documentStorage.js";

const PolicyList = () => {
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const user = getUser();

  const fetch = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/policies`, {
        params: { q: search, category },
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setDocs(res.data);
      
      // Cache data and prefetch files
      localStorage.setItem("policies_cache", JSON.stringify(res.data));
      
      // Only prefetch if we're online to avoid unnecessary auth errors
      if (navigator.onLine && res.data.length > 0) {
        prefetchFiles(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch policies from API:', err);
      
      // Offline fallback
      const cached = localStorage.getItem("policies_cache");
      if (cached) {
        const cachedPolicies = JSON.parse(cached);
        setDocs(cachedPolicies);
        toast.info(`Showing ${cachedPolicies.length} cached policies`);
      } else {
        console.error('No cached policies available:', err);
        toast.error('No policies available offline. Please connect to internet.');
      }
    }
  };

  useEffect(() => { fetch(); }, [search, category]);

  // Helper to color tags
  const tagClasses = (type, val) => {
    const map = {
      category: {
        infrastructure: "bg-green-100 text-green-800",
        education: "bg-purple-100 text-purple-800",
        energy: "bg-amber-100 text-amber-800",
        water: "bg-blue-100 text-blue-800",
        environment: "bg-green-100 text-green-800",
        budget: "bg-teal-100 text-teal-800",
        development: "bg-indigo-100 text-indigo-800",
        bylaw: "bg-pink-100 text-pink-800",
        other: "bg-gray-100 text-gray-800",
      },
      status: {
        draft: "bg-yellow-100 text-yellow-800",
        review: "bg-amber-100 text-amber-800",
        published: "bg-green-100 text-green-800",
        approved: "bg-green-100 text-green-800",
        'in progress': "bg-blue-100 text-blue-800",
        delayed: "bg-red-100 text-red-800",
        'under review': "bg-amber-100 text-amber-800",
      },
    };
    return map[type]?.[val] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-2xl font-bold">Policies</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects"
            className="border px-3 py-2 rounded w-full sm:w-auto"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="border px-2 py-2 rounded w-full sm:w-auto">
            <option value="">All</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="education">Education</option>
            <option value="energy">Energy</option>
            <option value="water">Water</option>
            <option value="environment">Environment</option>
            <option value="budget">Budget</option>
            <option value="development">Development Plan</option>
            <option value="bylaw">Bylaw</option>
          </select>
        </div>
      </div>
      
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block">
        {/* Table header */}
        <div className="grid grid-cols-12 text-xs font-semibold text-gray-500 px-4 py-2 border-b">
          <div className="col-span-3">POLICY</div>
          <div className="col-span-2">CATEGORY</div>
          <div className="col-span-2">STATUS</div>
          <div className="col-span-2">OFFLINE STATUS</div>
          <div className="col-span-1">LAST UPDATE</div>
          {user?.role === 'citizen' && <div className="col-span-2 text-center">ACTION</div>}
        </div>
        {docs.map((d) => (
          <div
            key={d.id}
            className="grid grid-cols-12 items-center px-4 py-3 border-b hover:bg-gray-50 text-sm"
          >
            {/* Icon + title */}
            <Link to={`view/${d.id}`} className="col-span-3 flex items-start gap-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xl font-bold">
                {d.title.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-900 leading-none">{d.title}</p>
                <p className="text-xs text-gray-500">{d.subtitle || d.department || d.category}</p>
              </div>
            </Link>
            {/* Category tag */}
            <div className="col-span-2">
              <span className={`text-xs px-2 py-1 rounded-full ${tagClasses('category', d.category)}`}>{d.category}</span>
            </div>
            {/* Status tag */}
            <div className="col-span-2">
              <span className={`text-xs px-2 py-1 rounded-full capitalize ${tagClasses('status', d.status)}`}>{d.status?.replace('_', ' ')}</span>
            </div>
            {/* Offline status */}
            <div className="col-span-2">
              <OfflineDocumentIndicator policyId={d.id} />
            </div>
            {/* Last update */}
            <div className="col-span-1 text-gray-500 text-xs">
              {formatDistanceToNow(new Date(d.updatedAt), { addSuffix: true })}
            </div>
            {user?.role === 'citizen' && (
              <div className="col-span-2 flex justify-center">
                <Link to={`view/${d.id}#comments`} className="text-indigo-600 text-xs hover:underline">Add Feedback</Link>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile Card View - Hidden on desktop */}
      <div className="md:hidden space-y-3">
        {docs.map((d) => (
          <div key={d.id} className="bg-white border rounded-lg p-4 shadow-sm">
            <Link to={`view/${d.id}`} className="block">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-lg font-bold flex-shrink-0">
                  {d.title.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-base leading-tight">{d.title}</p>
                  {(d.subtitle || d.department || d.category) && (
                    <p className="text-sm text-gray-500 mt-1">{d.subtitle || d.department || d.category}</p>
                  )}
                </div>
              </div>
            </Link>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`text-xs px-2 py-1 rounded-full ${tagClasses('category', d.category)}`}>
                {d.category}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full capitalize ${tagClasses('status', d.status)}`}>
                {d.status?.replace('_', ' ')}
              </span>
            </div>

            {/* Mobile offline status */}
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <OfflineDocumentIndicator policyId={d.id} />
              <span>Updated {formatDistanceToNow(new Date(d.updatedAt), { addSuffix: true })}</span>
            </div>
            
            <div className="flex items-center justify-between">
              {user?.role === 'citizen' && (
                <Link to={`view/${d.id}#comments`} className="text-indigo-600 hover:underline font-medium text-sm">
                  Add Feedback
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {docs.length === 0 && <p className="text-gray-500 mt-4 text-sm text-center">No projects found</p>}
    </div>
  );
};

const PolicyViewer = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const id = pathname.split("/").pop();
  const [doc, setDoc] = useState(null);
  const [lang, setLang] = useState('en');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [fileAvailable, setFileAvailable] = useState(false);
  const [documentURL, setDocumentURL] = useState(null);
  const [isFromIndexedDB, setIsFromIndexedDB] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        let documentData = null;
        let hasIndexedDBFile = false;

        // First try to get from IndexedDB
        const cachedMetadata = await documentStorage.getMetadata(id);
        
        if (cachedMetadata) {
          console.log('Found cached metadata:', cachedMetadata);
          // Use cached metadata
          documentData = cachedMetadata;
          hasIndexedDBFile = await checkIndexedDBFile(id);
        }

        // Also try to fetch fresh data if online
        if (isOnline) {
          try {
            const res = await axios.get(`${API_BASE}/api/policies/${id}`, {
              headers: { Authorization: `Bearer ${getToken()}` },
            });
            documentData = res.data;
            
            // Update local storage cache
            const saved = JSON.parse(localStorage.getItem("policies_cache")) || [];
            const updatedSaved = saved.filter(d => d.id !== res.data.id);
            updatedSaved.push(res.data);
            localStorage.setItem("policies_cache", JSON.stringify(updatedSaved));
            
            // Check if file is available (cached or online)
            if (res.data.filePath) {
              await checkFileAvailability(res.data.id);
            }
          } catch (onlineError) {
            console.warn('Online fetch failed, using cached data if available:', onlineError);
            if (!documentData) {
              throw onlineError;
            }
          }
        } else if (!documentData) {
          // Offline and no cached metadata, try localStorage fallback
          const cached = JSON.parse(localStorage.getItem("policies_cache")) || [];
          const found = cached.find((d) => d.id == id);
          if (found) {
            documentData = found;
            if (found.filePath) {
              await checkFileAvailability(found.id);
            }
          } else {
            throw new Error('Policy not found in any cache');
          }
        } else if (!isOnline && hasIndexedDBFile) {
          // We're offline but have both metadata and file in IndexedDB
          console.log('Using offline IndexedDB data');
        }

        // Set the document data
        if (documentData) {
          setDoc(documentData);
          
          // If we haven't checked IndexedDB file yet and we have filePath, do it now
          if (!hasIndexedDBFile && documentData.filePath) {
            await checkFileAvailability(documentData.id || id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch policy:', err);
        toast.error('Policy not available offline. Please check your connection.');
      }
    };
    fetchDoc();
  }, [id, isOnline]);

  const checkIndexedDBFile = async (policyId) => {
    try {
      console.log('Checking IndexedDB for policy:', policyId);
      const cachedDoc = await documentStorage.getDocument(policyId);
      console.log('Cached document found:', !!cachedDoc);
      
      if (cachedDoc) {
        console.log('Creating document URL from blob...');
        const url = await documentStorage.createDocumentURL(policyId);
        console.log('Document URL created:', !!url);
        
        if (url) {
          setDocumentURL(url);
          setFileAvailable(true);
          setIsFromIndexedDB(true);
          console.log('IndexedDB document is ready for viewing');
          return true;
        } else {
          console.warn('Failed to create URL from cached document');
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to check IndexedDB:', error);
      return false;
    }
  };

  const checkFileAvailability = async (policyId) => {
    try {
      // First check IndexedDB
      const fromIndexedDB = await checkIndexedDBFile(policyId);
      if (fromIndexedDB) return;

      // Then check Cache API (legacy)
      const token = getToken();
      const absoluteUrl = `${API_BASE}/api/policies/${policyId}/file?token=${token}`;
      const relativeUrl = `/api/policies/${policyId}/file?token=${token}`;

      if ('caches' in window) {
        let cachedResponse = await caches.match(absoluteUrl);
        if (!cachedResponse) {
          cachedResponse = await caches.match(relativeUrl);
        }
        if (cachedResponse) {
          setFileAvailable(true);
          setIsFromIndexedDB(false);
          return;
        }
      }

      // If not cached but we're online, try to fetch directly to verify availability
      if (isOnline) {
        try {
          const response = await fetch(absoluteUrl, { method: 'HEAD' });
          setFileAvailable(response.ok);
          setIsFromIndexedDB(false);
        } catch (fetchError) {
          console.warn('File fetch test failed:', fetchError);
          setFileAvailable(false);
        }
      } else {
        setFileAvailable(false);
      }
    } catch (error) {
      console.warn('Error checking file availability:', error);
      setFileAvailable(isOnline);
    }
  };

  // Cleanup blob URL when component unmounts or doc changes
  useEffect(() => {
    return () => {
      if (documentURL) {
        URL.revokeObjectURL(documentURL);
      }
    };
  }, [documentURL]);

  const handleDownloadComplete = () => {
    // Refresh file availability after download
    if (doc?.filePath) {
      checkFileAvailability(doc.id);
    }
  };

  if (!doc) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="text-indigo-600">← Back</button>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600">Loading policy...</p>
        </div>
      </div>
    );
  }

  if (!doc.filePath) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="text-indigo-600">← Back</button>
        <p className="text-gray-600">Document file not available.</p>
      </div>
    );
  }

  const getDocumentDisplayURL = () => {
    if (isFromIndexedDB && documentURL) {
      return documentURL;
    }
    // If filePath is an Azure URL, use it directly
    if (isOnline && doc.filePath && doc.filePath.startsWith("http")) {
      return doc.filePath;
    }
    if (isOnline) {
      return `${API_BASE}/api/policies/${doc.id}/file?token=${getToken()}`;
    }
    return `/api/policies/${doc.id}/file?token=${getToken()}`;
  };

  // Detect if user is on mobile device
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768;
  };

  const openDocumentInNewTab = () => {
    const url = getDocumentDisplayURL();
    window.open(url, '_blank');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="text-indigo-600">← Back</button>
        
        {/* Download Manager */}
        <DocumentDownloadManager 
          policyId={doc.id || doc.policyId} 
          policyData={doc} 
          onDownloadComplete={handleDownloadComplete}
        />
      </div>

      <h2 className="text-2xl font-bold mb-2">{doc.title}</h2>
      <div className="mb-4 text-sm text-gray-600">{doc.category} · {new Date(doc.createdAt).toLocaleDateString()}</div>
      
      {/* Remove the language switcher UI from the PolicyViewer component */}
      {/* <div className="mb-4">
        <button onClick={()=>setLang('en')} className={`mr-2 ${lang==='en'?'font-bold':''}`}>EN</button>
        <button onClick={()=>setLang('sw')} className={lang==='sw'?'font-bold':''}>SW</button>
      </div> */}
      
      {/* And always show the English summary */}
      <p className="mb-4">{doc.summary_en}</p>
      
      {doc.budget && (
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Budget Breakdown</h4>
          <BudgetChart data={typeof doc.budget=== 'string'? JSON.parse(doc.budget): doc.budget} />
        </div>
      )}
      
      {/* Offline status indicator */}
      {!isOnline && (
        <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p>You're offline. {fileAvailable ? 
              (isFromIndexedDB ? 'Showing document from offline storage.' : 'Showing cached document.') : 
              'Document may not display properly.'}</p>
          </div>
        </div>
      )}

      {/* Document display */}
      {(isOnline || fileAvailable) ? (
        isMobile() ? (
          // Mobile-optimized document viewing
          <div className="w-full border rounded-lg bg-white shadow-sm">
            <div className="p-6 text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {doc.title}
              </h3>
              <p className="text-gray-600 mb-6">
                {isFromIndexedDB 
                  ? "This document is available offline and ready to view."
                  : "Tap below to open the document in your device's viewer."
                }
              </p>
              
              <div className="space-y-3">
                {/* Primary action - Open document */}
                <button
                  onClick={openDocumentInNewTab}
                  className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  📄 Open Document
                </button>
                
                {/* Secondary action - Download if from IndexedDB */}
                {isFromIndexedDB && documentURL && (
                  <a
                    href={documentURL}
                    download={`${doc.title}.${documentStorage.getFileExtension(doc.mimeType || 'application/pdf')}`}
                    className="block w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    💾 Download to Device
                  </a>
                )}
                
                {/* Info about file */}
                <div className="text-sm text-gray-500 pt-2">
                  <p>
                    📱 Mobile tip: Documents open in your device's default viewer
                  </p>
                  {isFromIndexedDB && (
                    <p className="mt-1">
                      ✅ Available offline
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Desktop iframe viewing (existing logic)
          doc.filePath.toLowerCase().endsWith(".pdf") ? (
            <iframe
              src={getDocumentDisplayURL()}
              className="w-full h-[80vh] border"
              title="policy-pdf"
              onError={(e) => {
                console.error('PDF viewer error:', e);
                if (!isOnline) {
                  toast.error('PDF not available offline. Please download it first.');
                }
              }}
            />
          ) : (
            isFromIndexedDB ? (
              <div className="w-full h-[80vh] border border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                <div className="text-center p-6">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Document Available Offline</h3>
                  <p className="text-gray-500 mb-4">This document is stored locally, but cannot be previewed. You can download it to view with other applications.</p>
                  <div className="space-y-2">
                    <button
                      onClick={openDocumentInNewTab}
                      className="block w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium mb-2"
                    >
                      Open in New Tab
                    </button>
                    <a 
                      href={documentURL} 
                      download={`${doc.title}.${documentStorage.getFileExtension(doc.mimeType || 'application/pdf')}`}
                      className="block w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 font-medium"
                    >
                      Download to Computer
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <iframe
                title="doc-viewer"
                className="w-full h-[80vh] border"
                src={getDocumentDisplayURL()}
                onError={(e) => {
                  console.error('Document viewer error:', e);
                  if (!isOnline) {
                    toast.error('Document viewer not available offline.');
                  }
                }}
              />
            )
          )
        )
      ) : (
        <div className="w-full h-[80vh] border border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
          <div className="text-center p-6">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Document Unavailable Offline</h3>
            <p className="text-gray-500 mb-4">This document isn't downloaded for offline viewing.</p>
            {!isOnline && (
              <p className="text-sm text-gray-400">Connect to internet to download or view the document.</p>
            )}
            {isOnline && (
              <button 
                onClick={() => window.location.reload()} 
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Try to reload document
              </button>
            )}
          </div>
        </div>
      )}

      <Comments policyId={id} />
    </div>
  );
};

// Comments component
const Comments = ({ policyId }) => {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const user = getUser();

  const fetchComments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/policies/${policyId}/comments`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [policyId]);

  const postComment = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_BASE}/api/policies/${policyId}/comments`,
        { content },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <form onSubmit={postComment} className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment"
          className="border flex-1 px-2 py-1"
          required
        />
        <button className="bg-indigo-600 text-white px-4 rounded">Post</button>
      </form>
      <ul className="space-y-2 text-sm">
        {comments.map((c) => (
          <li key={c.id} className="border p-2 rounded">
            {c.content}
          </li>
        ))}
      </ul>
    </div>
  );
};

// helper to cache files
const prefetchFiles = async (docs) => {
  if (!('caches' in window)) return;
  
  try {
    const apiCache = await caches.open('external-api-cache');
    const token = getToken();
    
    if (!token) {
      console.warn('No auth token available for caching');
      return;
    }
    
    // Cache policy files and metadata in parallel
    const cachePromises = docs.map(async (d) => {
      const promises = [];
      
      // Cache the file via the authenticated endpoint (requires token)
      if (d.filePath) {
        promises.push(
          (async () => {
            try {
              const token = getToken();
              if (!token) return;

              const absoluteUrl = `${API_BASE}/api/policies/${d.id}/file?token=${token}`;
              const relativeUrl = `/api/policies/${d.id}/file?token=${token}`;

              const response = await fetch(absoluteUrl);
              if (!response.ok) throw new Error(`Failed to fetch file: ${response.status}`);

              await apiCache.put(absoluteUrl, response.clone());
              // Store relative URL in local-api-cache so same-origin offline requests can fetch it
              const localCache = await caches.open('local-api-cache');
              await localCache.put(relativeUrl, response.clone());
            } catch (err) {
              console.warn(`Failed to cache file for policy ${d.id}:`, err);
            }
          })()
        );
      }
      
      // Cache the metadata endpoint with auth
      promises.push(
        fetch(`${API_BASE}/api/policies/${d.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(response => {
            if (response.ok) {
              return apiCache.put(`${API_BASE}/api/policies/${d.id}`, response);
            }
            throw new Error(`Failed to fetch metadata: ${response.status}`);
          })
          .catch(err => {
            console.warn(`Failed to cache metadata for policy ${d.id}:`, err);
          })
      );
      
      // Cache comments endpoint with auth
      promises.push(
        fetch(`${API_BASE}/api/policies/${d.id}/comments`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(response => {
            if (response.ok) {
              return apiCache.put(`${API_BASE}/api/policies/${d.id}/comments`, response);
            }
            throw new Error(`Failed to fetch comments: ${response.status}`);
          })
          .catch(err => {
            console.warn(`Failed to cache comments for policy ${d.id}:`, err);
          })
      );
      
      return Promise.all(promises);
    });

    await Promise.all(cachePromises);
    console.log(`Successfully cached ${docs.length} policies for offline access`);
  } catch (error) {
    console.error('Error caching policies:', error);
  }
};

// ---- Router wrapper ----
const Policies = () => (
  <Routes>
    <Route index element={<PolicyList />} />
    <Route path="view/:id" element={<PolicyViewer />} />
  </Routes>
);

export default Policies;