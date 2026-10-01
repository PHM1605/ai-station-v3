import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import Spinner from "./Spinner";

function RequireAuth() {
  const {auth, loading} = useAuth()
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center">
        <Spinner />
      </div>
    );
  }
  
  return auth ? (
    <Outlet />
  ) : (
    // Before navigating, we store current Page in {from: location}
    <Navigate to="/signin" state={{from: location}} replace />
  )
}

export default RequireAuth;
