import { getUser } from "../utils/auth.js";
import PolicyManagement from "./PolicyManagement.jsx";

const PolicyAnalysis = () => {
  const user = getUser();
  if (user?.role === "representative") {
    return <PolicyManagement />;
  }
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Policy Analysis</h2>
      <p>This section will contain policy analysis features.</p>
    </div>
  );
};

export default PolicyAnalysis; 