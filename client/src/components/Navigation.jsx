import { Link, useLocation } from "react-router-dom";
import { getUser } from "../utils/auth.js";
import { XMarkIcon } from "@heroicons/react/24/outline";
import useOnlineStatus from "../hooks/useOnlineStatus.js";


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
];

const representativeLinks = [
  { to: "messages", label: "Citizen Messages" },
  { to: "policy-management", label: "Policy Management" },
  { to: "issues", label: "Issues" },
  { to: "polls", label: "Polls" },
  { to: "forums", label: "Forums" },
  { to: "resources", label: "Resources" },
  { to: "analytics", label: "Analytics" },
  { to: "settings", label: "Settings" },
  { to: "performance", label: "Performance" },
];

const settingsLink = { to: "settings", label: "Settings" };

const Navigation = ({ isOpen, onClose }) => {
  const user = getUser();
  const role = user?.role || "citizen";
  const location = useLocation();
  const online = useOnlineStatus();

  let links = [...baseLinks];
  if (role === "citizen") {
    links = [...links, ...citizenLinks];
  } else if (role === "representative") {
    links = [...links, ...representativeLinks];
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
        className={`block px-4 py-2 rounded hover:bg-indigo-700 ${active ? "bg-indigo-600" : ""}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white transform transition-transform duration-200 z-40 ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      } md:static md:block`}
    >
      <div className="flex items-center justify-between p-4 md:hidden">
        <span className="text-lg font-bold">Menu</span>
        <button onClick={onClose}>{/* close icon */}<XMarkIcon className="h-6 w-6" /></button>
      </div>
      <nav className="mt-4 space-y-1">
        {links.map((link, idx) => (
          <NavLink key={`${link.to}-${idx}`} {...link} />
        ))}
      </nav>
      <div className="absolute bottom-0 w-full p-4 text-center text-xs bg-gray-900">
        {online ? "Online" : "Offline"}
      </div>
    </aside>
  );
};

export default Navigation; 