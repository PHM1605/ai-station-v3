import { useState } from "react";
import { useNavigate } from "react-router-dom";

function NavBar() {
  const [open, setOpen] = useState(false);
  
  const navigate = useNavigate();
  
  return (
    <nav className="absolute top-0 left-0 flex justify-between items-center z-10 px-3 py-4 bg-blue-900 w-full h-12 px-8">
      <div className="flex gap-4">
        <i className="fas fa-dragon fa-2x text-yellow-500" />
        <span className="text-2xl font-semibold text-blue-200">Ai Station</span>
      </div>
      
      <ul className="flex font-semibold">
        <li className="mr-4 p-1">
          <a className="text-blue-200" href="#">Products</a>
        </li>
      </ul>
      
      <button onClick={()=>navigate("/signin")} 
        className="text-yellow-500 px-3 py-2 rounded hover:bg-blue-800 hover:cursor-pointer">
        Sign In
      </button>
      
      {/* <div className="relative">
        <button onClick={()=>setOpen(!open)} className="px-3 py-2">Products</button>
        
        {open && (
          <div className="absolute left-0 top-full w-40 rounded border bg-white mt-1">
            <a href="#" className="block px-4 py-2 hover:bg-gray-100">
              Product 1
            </a>
          </div>
        )} */}
      {/* </div> */}
      
      
      
    </nav>
  )
}

export default NavBar;