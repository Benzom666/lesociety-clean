import { Navigate } from "react-router-dom";

const RequireAuth = ({ children }) => {
  const token = localStorage.getItem("accessToken");
  if(!token){
    return <Navigate to="/"/>
  }
  return <>{children}</>;
};

export default RequireAuth;
