import { useState } from "react";

function Navbar() {
  const [open, setOpen] = useState(false);
  
  return (
    <nav className="flex items-center gap-6 p-4">
      <a href="#">Home</a>
      
      <div className="relative">
        <button onClick={()=>setOpen(!open)} className="px-3 py-2">Products</button>
        
        {open && (
          <div className="absolute left-0 top-full w-40 rounded border bg-white mt-1">
            <a href="#" className="block px-4 py-2 hover:bg-gray-100">
              Product 1
            </a>
          </div>
        )}
      </div>
      
      
      
    </nav>
  )
}

export default Navbar;