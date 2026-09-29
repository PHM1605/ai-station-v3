import { useState } from "react";
import axiosClient from "../api/axiosConfig";
import { useNavigate } from "react-router-dom";
import Spinner from "./Spinner";

function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const defaultRole = "USER"
    setLoading(true);
    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        role: defaultRole,
      };
      const response = await axiosClient.post("/register", payload)
      if (response.data.error) {
        setError(response.data.error)
        return 
      }
      // Redirect if succeed
      navigate("/signin", {replace: true})
    } catch(err) {
      setError("Registration failed. Please try again.")
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="border rounded px-4 py-4 w-full max-w-md flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4">Create you account</h1>
        
        {error && <div className="text-red-900">{error}</div>}
        
        {/* Form */}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* First Name */}
          <div className="flex flex-col gap-1 w-full">
            <label htmlFor="firstName" className="">First Name</label>
            <input type="text" placeholder="First Name" value={firstName} 
            className="border rounded px-2 py-1"
              onChange={(e) => setFirstName(e.target.value)} />
          </div>
          {/* Last Name */}
          <div className="flex flex-col gap-1">
            <label htmlFor="lastName">Last Name</label>
            <input type="text" placeholder="Last Name" value={lastName} 
            className="border rounded px-2 py-1"
              onChange={e=>setLastName(e.target.value)} />
          </div>
          {/* Email */}
          <div className="flex flex-col gap-1">
            <label htmlFor="Email">Email</label>
            <input type="email" placeholder="Email" value={email} className="px-2 py-1" 
              onChange={e=>setEmail(e.target.value)} />
          </div>
          {/* Password */}
          <div className="flex flex-col gap-1">
            <label htmlFor="Password">Password</label>
            <input type="password" placeholder="Enter your password" value={password} 
              className="px-2 py-1 "
              onChange={e=>setPassword(e.target.value)} />
          </div>
          {/* Submit Button */}
          <button type="submit" disabled={loading}
            className="bg-blue-500 text-white rounded cursor-pointer px-3 py-1 hover:bg-blue-600">
            {loading ? <Spinner /> : <span>Register</span>}    
          </button>
        </form>
      </div>
    </div>
  )
}

export default Register;