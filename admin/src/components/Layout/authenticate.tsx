import React, { useEffect, useState } from "react";

type Props = {
  children: React.ReactNode;
  fallback: React.ReactNode;
  requiredRole?: string;
};

const Authenticated = ({
  children,
  fallback,
  requiredRole = "admin",
}: Props) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("currentUser");
      const user = userStr ? JSON.parse(userStr) : null;

      const hasValidRole =
        !!user &&
        user.roleId &&
        String(user.roleId).trim().toLowerCase() === requiredRole.toLowerCase();

      setIsAuthenticated(hasValidRole);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsChecking(false);
    }
  }, [requiredRole]);

  if (isChecking) {
    return null;
  }

  return <>{isAuthenticated ? children : fallback}</>;
};

export default Authenticated;
