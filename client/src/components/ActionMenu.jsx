import { Menu } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/solid";
import { createPortal } from "react-dom";
import { useRef } from "react";

const ActionMenu = ({ actions, buttonClass = "" }) => {
  const btnRef = useRef(null);
  if (!actions || !actions.length) return null;

  const renderItems = (open) => {
    if (!open || !btnRef.current) return null;
    const rect = btnRef.current.getBoundingClientRect();
    const width = 176;
    let left = rect.right - width;
    if (left < 8) left = 8;
    if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const maxHeight = spaceBelow > 200 ? spaceBelow - 16 : rect.top - 16; 
    const top = spaceBelow > 200 ? rect.bottom + 4 : undefined;
    const bottom = spaceBelow > 200 ? undefined : window.innerHeight - rect.top + 4;

    return createPortal(
      <Menu.Items
        className="fixed z-50 w-44 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
        style={{ left, top, bottom, maxHeight }}
      >
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
      </Menu.Items>,
      document.body
    );
  };

  return (
    <Menu as="div" className="inline-block text-left">
      {({ open }) => (
        <>
          <Menu.Button
            ref={btnRef}
            className={`p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${buttonClass}`}
          >
            <EllipsisVerticalIcon className="h-5 w-5 text-gray-600" />
          </Menu.Button>
          {renderItems(open)}
        </>
      )}
    </Menu>
  );
};

export default ActionMenu; 