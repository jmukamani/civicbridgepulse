import { useState, useEffect } from "react";
import { CheckCircleIcon, CloudArrowDownIcon } from "@heroicons/react/24/outline";
import documentStorage from "../utils/documentStorage.js";

const OfflineDocumentIndicator = ({ policyId, size = "sm" }) => {
  const [isCached, setIsCached] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCacheStatus = async () => {
      try {
        const cached = await documentStorage.isDocumentCached(policyId);
        setIsCached(cached);
      } catch (error) {
        console.warn('Failed to check cache status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (policyId) {
      checkCacheStatus();
    }
  }, [policyId]);

  if (loading) {
    return null;
  }

  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className={`flex items-center gap-1 ${textSize}`}>
      {isCached ? (
        <>
          <CheckCircleIcon className={`${iconSize} text-green-600`} />
          <span className="text-green-600">Offline</span>
        </>
      ) : (
        <>
          <CloudArrowDownIcon className={`${iconSize} text-gray-400`} />
          <span className="text-gray-400">Online only</span>
        </>
      )}
    </div>
  );
};

export default OfflineDocumentIndicator; 