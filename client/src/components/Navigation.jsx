import { Link, useLocation } from "react-router-dom";
import { getUser } from "../utils/auth.js";
import { XMarkIcon } from "@heroicons/react/24/outline";
import useOnlineStatus from "../hooks/useOnlineStatus.js";
import useNotifications from "../hooks/useNotifications.js";
import { useTranslation } from "react-i18next";


const baseLinks = [
  { to: "", label: "Dashboard" },
];

const citizenLinks = [
  { to: "messages", label: "My Messages" },
  { to: "policies", label: "Policies" },
  { to: "issues", label: "Issues" },
  { to: "settings", label: "Settings" },
  { to: "polls", label: "Polls" },
  { to: "forums", label: "Forums" },
  { to: "resources", label: "Resources" },
  { to: "my-analytics", label: "My Analytics" },
  { to: "events", label: "Events" },
];

const representativeLinks = [
  { to: "messages", label: "Citizen Messages" },
  { to: "policy-management", label: "Policy Management" },
  { to: "issues", label: "Issues" },
  { to: "polls", label: "Polls" },
  { to: "forums", label: "Forums" },
  { to: "resources", label: "Resources" },
  { to: "analytics", label: "Analytics" },
  { to: "events", label: "Events" },
  { to: "settings", label: "Settings" },
  { to: "performance", label: "Performance" },
];

const adminLinks = [
  { to: "admin-dashboard", label: "Admin Dashboard" },
  { to: "admin-leaderboard", label: "Leaderboard" },
  { to: "user-management", label: "User Management" },
  { to: "verification-queue", label: "Verification Queue" },
  { to: "messages", label: "Messages" },
  { to: "issues", label: "Issues" },
  { to: "polls", label: "Polls" },
  { to: "forums", label: "Forums" },
  { to: "resources", label: "Resources" },
  { to: "analytics", label: "Analytics" },
  { to: "events", label: "Events" },
  { to: "settings", label: "Settings" },
];

const settingsLink = { to: "settings", label: "Settings" };

const Navigation = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const user = getUser();
  const role = user?.role || "citizen";
  const location = useLocation();
  const online = useOnlineStatus();
  const { unreadCount } = useNotifications();

  let links = [...baseLinks];
  if (role === "citizen") {
    links = [...links, ...citizenLinks];
    // TODO: If leaderboard is enabled for citizens, add here
  } else if (role === "representative") {
    links = [...links, ...representativeLinks];
    // TODO: If leaderboard is enabled for reps, add here
  } else if (role === "admin") {
    // Remove the first 'Dashboard' link for admin (since 'Admin Dashboard' is present)
    links = adminLinks;
  }

  const NavLink = ({ to, label, disabled }) => {
    const active = location.pathname === `/dashboard/${to}` || (to === "" && location.pathname === "/dashboard");
    if (disabled) {
      return (
        <span className="block px-4 py-2 rounded text-gray-500 cursor-not-allowed">
          {label}
        </span>
      );
    }
    return (
      <Link
        to={to}
        onClick={onClose}
        className={`block px-4 py-2 rounded hover:bg-indigo-700 flex justify-between items-center ${active ? "bg-indigo-600" : ""}`}
      >
        <span>{t(label)}</span>
        {unreadCount > 0 && (to === "messages" || to === "policy-management" || to === "policies") && (
          <span className="inline-block h-2 w-2 rounded-full bg-red-500"></span>
        )}
      </Link>
    );
  };

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white transform transition-transform duration-200 z-40 overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } md:static md:block`}
      >
        <div className="flex items-center justify-between p-4 md:hidden border-b border-gray-700">
          <span className="text-lg font-bold">{t('Menu')}</span>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded"
            aria-label="Close menu"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-2 md:mt-4 space-y-1 px-2 pb-16"> {/* Add pb-16 for extra bottom padding */}
          {links.map((link, idx) => (
            <NavLink key={`${link.to}-${idx}`} {...link} />
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-4 text-center text-xs bg-gray-900 border-t border-gray-700">
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${online ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span>{online ? t('Online') : t('Offline')}</span>
          </div>
        </div>
      </aside>
      
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default Navigation; 