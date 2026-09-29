import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import axiosClient from "../api/axiosConfig";
import { useState } from "react";
import Spinner from "./Spinner"

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const {setAuth} = useAuth()
  const navigate = useNavigate();
  
  // When user navigates to e.g. "/dashboard" => "location" will be "/dashboard"
  // "RequiredAuth.jsx" will set "state={from:...}"
  const location = useLocation();
  const from = location.state?.from?.pathname || "/workspace"
  
  const handleSubmit = async(e) => {
    e.preventDefault()
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClient.post("/signin", {email, password})
      if (response.data.error) {
        setError(response.data.error);
        return;
      }
      setAuth(response.data);
      // navigate User to where he was previously
      navigate(from, {replace: true})
    } catch(err) {
      setError("Invalid email or password")
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="border rounded px-4 py-4 w-full max-w-md flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4">Sign in to Platform</h1>
        
        {error && <div className="text-red-900">{error}</div>}
        
        <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="">Email</label>
            <input type="email" id="email" name="email" placeholder="Please enter your email" required
              className="px-3 py-1 border rounded" 
              onChange={(e) => setEmail(e.target.value)}/>
          </div>
          {/* Password */}
          <div className="flex flex-col gap-1">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Please enter your password" required
              className="px-3 py-1 border rounded" 
              onChange={(e) => setPassword(e.target.value)}/>
          </div>
          {/* Remember Me & Forget password? */}
          <div className="flex justify-between">
            <div>Remember me</div>
            <a href="#">Forget Password?</a>
          </div>
          {/* Button */}
          <button type="submit" disabled={loading}
            className="bg-blue-500 text-white rounded cursor-pointer px-3 py-1 hover:bg-blue-600">
            {loading ? <Spinner /> : <span>Sign In</span>}
          </button>
          {/* Don't have and account? */}
          <div className="flex gap-1">
            Don't have an account? 
            <a href="/register" className="text-blue-500">Register</a>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SignIn;
