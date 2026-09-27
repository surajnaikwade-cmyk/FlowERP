import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="center-screen">
        <h2>Please login to continue</h2>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;