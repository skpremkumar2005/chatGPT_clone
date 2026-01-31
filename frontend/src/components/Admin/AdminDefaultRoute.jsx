import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const AdminDefaultRoute = () => {
  const { permissions } = useSelector((state) => state.auth);

  // Super admins go to Companies page
  if (permissions?.includes("manage:companies")) {
    return <Navigate to="/admin/companies" replace />;
  }

  // Company admins/managers go to Users page
  if (permissions?.includes("view:users")) {
    return <Navigate to="/admin/users" replace />;
  }

  // Fallback to activity logs if they can view them
  if (permissions?.includes("view:activity_logs")) {
    return <Navigate to="/admin/logs" replace />;
  }

  // Fallback to analytics
  return <Navigate to="/admin/analytics" replace />;
};

export default AdminDefaultRoute;
