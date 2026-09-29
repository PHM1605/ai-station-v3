import { useEffect, useState } from "react";
import { useStation } from "../context/StationProvider";
import {useNavigate} from "react-router-dom";
import axiosClient from "../api/axiosConfig";
import Spinner from "./Spinner";

function Projects() {
  const {state, dispatch} = useStation()
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    if (state.projectsLoaded) {
      return 
    }
    
    async function fetchProjects() {
      setLoading(true)
      setError("")
      try {
        const response = await axiosClient.get("/projects")
        dispatch({
          type: "CACHE_PROJECTS",
          data: response.data.projects,
        })
      } catch {
        setError("Unable to load projects")
      } finally {
        setLoading(false)
      }
    }
    fetchProjects();
  }, [state.projectsLoaded, dispatch])
  
  const projects = Object.values(state.projects);
  
  const handleCreateProject = () => {
    navigate("/create")
  }
  
  const handleOpenProject = (projectId) => {
    navigate(`/workspace/${projectId}`)
  }
  
  const handleDeleteProject = async () => {
    if (!projectToDelete) {
      return 
    }
    setDeleting(true);
    setError("")
    try {
      await axiosClient.delete(`/projects/${projectToDelete.project_id}`);
      dispatch({
        type: "DELETE_PROJECT", 
        id: projectToDelete.project_id 
      })
      setProjectToDelete(null)
    } catch(requestError) {
      setError(
        requestError.response?.data?.error ?? "Unable to delete project"
      )
    } finally {
      setDeleting(false);
    }
  }
  
  return (
    <>
    <div className="flex justify-end mx-4 my-2">
      <button 
        onClick={handleCreateProject}
        className="px-4 py-2 rounded border hover:cursor-pointer hover:bg-blue-200 bg-blue-500 text-white font-semibold">
        New Project
      </button>
    </div>
    
    <div className="flex flex-wrap gap-4 mx-4 my-2">
      {projects.map(project => (
        <div key={project.project_id} 
          onClick={() => handleOpenProject(project.project_id)}
          className="flex items-center gap-4 px-3 py-2 border rounded hover:cursor-pointer hover:scale-101">
          <div className="border border-gray-500 w-16 h-16 flex justify-center items-center">
            <i className="fa-regular fa-image text-2xl" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold">{project.name}</h1>
            <div className="text-gray-500 text-sm">{project.type}</div>
          </div>
          <button onClick={e => {
            e.stopPropagation()
            setProjectToDelete(project)
          }} 
            className="rounded-full w-6 h-6 flex justify-center items-center p-2 hover:bg-gray-100 hover:cursor-pointer p-4">
            <i className="fa-solid fa-trash text-red-500" />
          </button>
        </div>
      ))}
    </div>
    
    {projectToDelete && (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40">
        <div className="max-w-sm w-full rounded bg-white px-4 py-2">
          <h2 className="text-xl font-bold">Delete Project</h2>
          <div className="mt-4">Delete project <strong>{projectToDelete.name}</strong>?</div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" disabled={deleting} onClick={() => setProjectToDelete(null)} className="rounded border px-4 py-2 hover:bg-gray-100 hover:cursor-pointer">
              Cancel
            </button>
            <button type="button" disabled={deleting} onClick={handleDeleteProject} className="rounded bg-red-700 hover:cursor-pointer hover:bg-red-800 px-4 py-2 text-white">
              {deleting ? <Spinner /> : "Delete"}
            </button>
            
            {error && (
              <p className="mt-4 text-red-700">{error}</p>
            )}
          </div>
        </div>
      </div>
    )}
    </>
    
  )
}

export default Projects;