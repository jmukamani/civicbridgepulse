import { useState } from "react";
import { getUser, removeToken } from "../utils/auth.js";
import { useNavigate } from "react-router-dom";
import { Bars3Icon } from "@heroicons/react/24/outline";
import NotificationBell from "./NotificationBell.jsx";

const Header = ({ onToggleSidebar }) => {
  const user = getUser();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = () => {
    removeToken();
    navigate("/login");
  };

  return (
    <header className="flex items-center justify-between p-4 bg-white shadow md:sticky top-0 z-30">
      <div className="flex items-center">
        <button className="md:hidden mr-4" onClick={onToggleSidebar}>
          <Bars3Icon className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold">CivicBridgePulse</h1>
      </div>
      <div className="relative flex items-center gap-4">
        <NotificationBell />
        <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center space-x-2">
          <span className="font-medium">{user?.email}</span>
          <img
            src={`https://www.gravatar.com/avatar/${user?.email}?d=identicon`}
            alt="avatar"
            className="w-8 h-8 rounded-full"
          />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow">
            <button
              onClick={logout}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
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