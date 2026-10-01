import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useStation } from "../context/StationProvider";
import { useState } from "react";
import axiosClient from "../api/axiosConfig";
import { useAuth } from "../context/AuthProvider";

function WorkspaceSidebar() {
  const tabClass = ({isActive}) => `
    rounded px-3 py-2 ${isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-blue-200"}
  `
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const {auth, setAuth} = useAuth()
  
  async function handleLogout() {
    await axiosClient.post("/logout", {
      user_id: auth.user_id
    })
    setAuth(null)
    window.location.replace("/")
  }
  
  return (
    <aside className="flex w-40 flex-col border-r bg-blue-100 p-4 justify-between">
      <div>
        <h1 className="font-semibold">AI Station</h1>
        <nav className="mt-8 flex-1 space-y-1 flex flex-col">
          <NavLink end to="/workspace" className={tabClass}>
            <i className="fa fa-clipboard mr-2" />
            <span>Projects</span>
          </NavLink>
          <NavLink to="/workspace/models" className={tabClass}>
            <i className="fa-brands fa-superpowers mr-2" arial-hidden="true"/>
            <span>Models</span>
          </NavLink>
        </nav>
      </div>
      
      <div className="relative border-t">
        {showUserMenu && (
          <div className="absolute bottom-0 left-full ml-6 rounded border bg-white px-2 py-1 shadow">
            <button type="button" onClick={handleLogout} className="hover:bg-gray-100 w-48 hover:cursor-pointer flex px-2">
              Sign out
            </button>
          </div>
        )}
        
        <button type="button" onClick={() => setShowUserMenu(open => !open)}
          className="hover:bg-blue-200 px-3 py-2 w-full flex rounded hover:cursor-pointer items-center">
          <div className="rounded w-6 h-6 rounded-full bg-gray-600 text-white font-bold me-2">
            {auth.first_name.charAt(0)}
          </div>
          <div>{auth.first_name} {auth.last_name}</div>    
        </button>
      </div>
      
    </aside>
  )
}

function WorkspaceLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <WorkspaceSidebar />
      <main className="flex flex-1 min-w-0 min-h-0 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}

export default WorkspaceLayout;