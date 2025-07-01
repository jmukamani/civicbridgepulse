import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-green-50 flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto px-6 py-16">
        {/* Copy */}
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Bridging Citizens and Representatives for Better Governance
          </h1>
          <p className="text-gray-700 mb-8 text-lg">
            CivicBridgePulse Kenya connects citizens with their elected officials, enabling transparent communication, issue reporting, and community development tracking.
          </p>
          <div className="flex gap-4">
            <Link
              to="/register"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-md text-sm font-semibold shadow"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-8 py-3 rounded-md text-sm font-semibold"
            >
              Learn How It Works
            </Link>
          </div>
        </div>

        {/* Illustration */}
        <div className="relative mt-12 lg:mt-0 w-full max-w-md">
          {/* Outer Oval */}
          <div className="relative w-full h-0 pb-[120%]">
            <svg
              viewBox="0 0 300 360"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="absolute inset-0 w-full h-full"
            >
              <ellipse
                cx="150"
                cy="180"
                rx="130"
                ry="160"
                className="stroke-2 stroke-indigo-700/60 fill-transparent"
              />
              <ellipse
                cx="150"
                cy="180"
                rx="80"
                ry="100"
                className="stroke-2 stroke-indigo-700/40 fill-indigo-600/10"
              />
              {/* Center node */}
              <circle cx="150" cy="180" r="12" className="fill-white stroke-indigo-700 stroke-2" />
              {/* Satellite nodes */}
              {[
                [150, 60],
                [230, 120],
                [230, 240],
                [150, 300],
                [70, 240],
                [70, 120],
              ].map(([x, y], idx) => (
                <circle key={idx} cx={x} cy={y} r="8" className="fill-indigo-600" />
              ))}
              {/* Dashed connections */}
              <path
                d="M150 60L230 120L230 240L150 300L70 240L70 120L150 60Z"
                className="stroke-indigo-700/50 stroke-[1.5] fill-none stroke-dasharray-[4_6]"
              />
            </svg>
          </div>

          {/* Floating badges */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white shadow px-4 py-2 rounded-md flex items-center gap-2 text-sm">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700">
              ✓
            </span>
            <div>
              <p className="font-medium text-gray-900">Issue Resolved</p>
              <p className="text-gray-500 text-xs">Water Supply Fixed</p>
            </div>
          </div>
          <div className="absolute bottom-6 left-0 bg-white shadow px-4 py-2 rounded-md flex items-center gap-2 text-sm">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
              ⚠
            </span>
            <div>
              <p className="font-medium text-gray-900">New Issue Reported</p>
              <p className="text-gray-500 text-xs">Street Light Broken</p>
            </div>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-0 bg-white shadow px-4 py-2 rounded-md flex items-center gap-2 text-sm">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              📣
            </span>
            <div>
              <p className="font-medium text-gray-900">New Announcement</p>
              <p className="text-gray-500 text-xs">Road Repair Schedule</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing; 