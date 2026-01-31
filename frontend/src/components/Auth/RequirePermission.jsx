import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const RequirePermission = ({ permission, children }) => {
  const { permissions, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!permissions || !permissions.includes(permission)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center p-8 bg-zinc-950 border border-zinc-800 rounded-lg max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-zinc-400 text-sm mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-xs text-zinc-600">
            Required permission:{" "}
            <code className="text-cyan-400">{permission}</code>
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default RequirePermission;
