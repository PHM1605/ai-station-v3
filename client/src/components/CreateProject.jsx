import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosConfig";
import { useState } from "react";
import { useStation } from "../context/StationProvider";

function CreateProject() {
  const {dispatch} = useStation()
  const [name, setName] = useState("")
  const [type, setType] = useState("OBJECT_DETECTION")
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const response = await axiosClient.post("/projects", {name, type});
      dispatch({
        type: "ADD_PROJECT",
        id: response.data.project_id,
        data: response.data,
      })
      navigate("/workspace", {replace: true})
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ?? "Unable to create project"
      )
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="px-8 py-4 flex flex-col gap-4">
      <div className="flex justify-between">
        <h1 className="font-bold text-2xl">Let's create your Project</h1>
        <button onClick={()=>navigate("/workspace")} 
          className=" px-2 py-1 flex justify-center items-center rounded hover:bg-gray-100 hover:cursor-pointer">
          <i className="fa-solid fa-x" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="project-name" className="font-bold text-blue-500">Project Name</label>
          <input type="text" name="projectName" placeholder="E.g. Bottle detection, Fish segmentation etc." 
            onChange={(e) => setName(e.target.value)}
            className="px-2 py-1 border rounded"/>
          {error && (
            <p className="text-red-900">{error}</p>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <label htmlFor="project-type" className="font-bold text-blue-500">Project Type</label>
          <select id="project-type" value={type} onChange={e => setType(e.target.value)}
            className="rounded border px-3 py-2">
            <option value="OBJECT_DETECTION">Object Detection</option>    
            <option value="CLASSIFICATION">Classification</option>
            <option value="SEGMENTATION">Segmentation</option>
          </select>
        </div>
        
        <div className="flex justify-center">
          <button type="submit" disabled={loading} className="rounded bg-blue-500 px-3 py-2 text-white hover:bg-blue-600 hover:cursor-pointer">
            Create Project
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateProject