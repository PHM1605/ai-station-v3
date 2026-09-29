import { NavLink, Outlet } from "react-router-dom";

function ProjectSidebar() {
  const tabClass = ({isActive}) => `
    rounded px-3 py-2 gap-2 flex items-center ${isActive ? "bg-blue-100 border border-blue-700" : "text-gray-700 hover:bg-gray-100"}
  `
  
  return (
    <div className="flex w-40 flex-col border-r border-gray-400 p-2">
      <div className="border-gray-400 border-y py-2">
        <h2 className="font-semibold text-sm mb-2">DATA</h2>
        <nav className="flex flex-col gap-2">
          <NavLink to="upload" className={tabClass}>
            <i className="fa-solid fa-arrow-up" />
            <span>Upload</span>
          </NavLink>
          <NavLink to="annotate" className={tabClass}>
            <i className="fa-solid fa-pencil" />
            <span>Annotate</span>
          </NavLink>
        </nav>
      </div>
    </div>
  )
}

function ProjectLayout() {
  return (
    <div className="flex min-h-screen">
      <ProjectSidebar />
      <div className="flex-1 flex flex-col px-4 py-2">
        <Outlet />
      </div>
    </div>
  )
}

export default ProjectLayout;