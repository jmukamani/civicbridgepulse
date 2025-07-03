import { Menu } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/solid";

const ActionMenu = ({ actions, buttonClass = "" }) => {
  if (!actions || !actions.length) return null;
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button
        className={`p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${buttonClass}`}
      >
        <EllipsisVerticalIcon className="h-5 w-5 text-gray-600" />
      </Menu.Button>
      <Menu.Items className="absolute right-0 mt-2 w-44 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none z-40 max-h-60 overflow-y-auto">
        {actions.map((act, idx) => (
          <Menu.Item key={idx}>
            {({ active }) =>
              act.href ? (
                <a
                  href={act.href}
                  className={`${active ? "bg-gray-100" : ""} flex items-center gap-2 px-4 py-2 text-sm text-gray-700`}
                >
                  {act.icon && <span className="text-gray-500">{act.icon}</span>}
                  {act.label}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={act.onClick}
                  className={`${active ? "bg-gray-100" : ""} flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700`}
                >
                  {act.icon && <span className="text-gray-500">{act.icon}</span>}
                  {act.label}
                </button>
              )
            }
          </Menu.Item>
        ))}
      </Menu.Items>
    </Menu>
  );
};

export default ActionMenu; 