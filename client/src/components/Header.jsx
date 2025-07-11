import { useState } from "react";
import { getUser, removeToken } from "../utils/auth.js";
import { useNavigate } from "react-router-dom";
import { Bars3Icon, WifiIcon } from "@heroicons/react/24/outline";
import NotificationBell from "./NotificationBell.jsx";
import useOnlineStatus from "../hooks/useOnlineStatus.js";

const Header = ({ onToggleSidebar }) => {
  const user = getUser();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isOnline = useOnlineStatus();

  const logout = () => {
    removeToken();
    navigate("/login");
  };

  return (
    <header className="flex items-center justify-between p-3 md:p-4 bg-white shadow md:sticky top-0 z-30">
      <div className="flex items-center min-w-0 flex-1">
        <button className="md:hidden mr-3 flex-shrink-0" onClick={onToggleSidebar}>
          <Bars3Icon className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="text-lg md:text-xl font-bold truncate">CivicBridgePulse</h1>
        
        {/* Offline indicator */}
        {!isOnline && (
          <div className="ml-2 md:ml-4 flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs md:text-sm flex-shrink-0">
            <WifiIcon className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Offline</span>
          </div>
        )}
      </div>
      <div className="relative flex items-center gap-2 md:gap-4 flex-shrink-0">
        <NotificationBell />
        <button 
          onClick={() => setMenuOpen((v) => !v)} 
          className="flex items-center space-x-1 md:space-x-2 min-w-0"
        >
          <span className="font-medium text-sm md:text-base truncate max-w-[120px] md:max-w-none">
            {user?.email}
          </span>
          <img
            src={`https://www.gravatar.com/avatar/${user?.email}?d=identicon`}
            alt="avatar"
            className="w-7 h-7 md:w-8 md:h-8 rounded-full flex-shrink-0"
          />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-36 md:w-40 bg-white border rounded shadow-lg z-50">
            <button
              onClick={logout}
              className="block w-full text-left px-3 md:px-4 py-2 hover:bg-gray-100 text-sm md:text-base"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 