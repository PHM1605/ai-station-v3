import { createContext, useContext, useEffect } from "react";
import axiosClient from "../src/axiosConfig";

const AuthContext = createContext(null);

export function AuthProvider({children}) {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await axiosClient.get("/auth/me")
        setAuth(response.data)
      } catch {
        setAuth(null)
      } finally {
        setLoading(false)
      }
    }
    checkAuth();
  }, [])
  
  return (
    <AuthContext.Provider
      value={{auth, setAuth, loading}}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}