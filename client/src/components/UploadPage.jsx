import { useParams } from "react-router-dom";
import { useStation } from "../context/StationProvider";
import { useEffect, useRef, useState } from "react";
import axiosClient from "../api/axiosConfig";
import Spinner from "./Spinner";

function UploadPage() {
  
  const {projectId} = useParams()
  const [datasetName, setDatasetName] = useState("");
  const [videos, setVideos] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showCreateDataset, setShowCreateDataset] = useState(false);
  const {state, dispatch} = useStation();
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [invalidVideos, setInvalidVideos] = useState([]);
  
  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [loadError, setLoadError] = useState("");
  
  // To handle the case that: when Mouse Cursor enters a Child <div> inside the Parent <div> it's another MouseEnter
  const dragDepth = useRef(0);
  
  const datasets = Object.values(state.datasets).filter(
    dataset => dataset.project_id === projectId
  )
  
  const submitDisabled = datasetName.trim() === "" || videos.length === 0;
  
  useEffect(() => {
    if (state.datasetsLoaded && state.datasetsProjectId == projectId) {
      return 
    }
    
    async function fetchDatasets() {
      setLoadingDatasets(true);
      setLoadError("")
      try {
        const response = await axiosClient.get(`/projects/${projectId}/datasets`)
        dispatch(({
          type: "CACHE_DATASETS",
          id: projectId,
          data: response.data.datasets,
        }))
      } catch(error) {
        setLoadError(error.response?.data?.error ?? "Unable to load datasets")
      } finally {
        setLoadingDatasets(false)
      }
    }
    fetchDatasets()
  }, [projectId, state.datasetsLoaded, state.datasetsProjectId, dispatch])
  
  const handleVideos = fileList => {
    const selectedVideos = Array.from(fileList).filter(
      file => file.type.startsWith("video/")
    )
    setVideos(selectedVideos)
  }
  
  const handleDragEnter = e => {
    e.preventDefault();
    dragDepth.current += 1;
    setIsDragging(true);
  }
  
  const handleDragLeave = e => {
    e.preventDefault()
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setIsDragging(false);
    }
  }
  
  const handleDrop = e => {
    e.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    handleVideos(e.dataTransfer.files)
  }
  
  const handleUpload = async e => {
    e.preventDefault();
    
    setUploading(true);
    setUploadProgress(0);
    setError("");
    setInvalidVideos([]);
    
    // Add data to Form
    const formData = new FormData();
    formData.append("name", datasetName.trim());
    for (const video of videos) {
      formData.append("videos", video);
    }
    // Close the form and show Progress Bar
    setShowCreateDataset(false);
    
    
    try {
      const response = await axiosClient.post(`/projects/${projectId}/datasets`, formData, {
        onUploadProgress: e => {
          if (!e.total) {
            return;
          }
          const percentage = Math.round(e.loaded * 100 / e.total);
          setUploadProgress(percentage);
        }
      });
      dispatch({
        type: "ADD_DATASET",
        id: response.data.dataset_id,
        data: response.data
      });
      setDatasetName("");
      setVideos([])
    } catch(error) {
      setError(
        error.response?.data?.error ?? "Unable to upload dataset"
      );
      setInvalidVideos(error.response?.data?.invalid_videos ?? [])
      // Reopening the Form without clearing the selected files
      setShowCreateDataset(true);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }
  
  return (
    <>
    <div className="flex justify-end px-4 py-2">
      <button type="button"
        onClick={() => setShowCreateDataset(true)}
        className="rounded bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600 flex items-center gap-2 hover:cursor-pointer">
          <i className="fa fa-plus" />
          <span>New Dataset</span>
      </button>
    </div>
    
    {/* Progress bar while uploading */}
    {uploading && (
      <div className="flex items-center gap-4 mt-4">
        <div>Upload Progress: </div>
        <div className="rounded h-2 flex-1 bg-gray-100">
          <div className="h-2 bg-blue-500 rounded-full" style={{width: `${uploadProgress}%`}} />
        </div>
        <div>{uploadProgress}%</div>
      </div>
    )}
    
    {/* List of Datasets */}
    {loadError && (
      <div className="mt-4 rounded border border-red-700 bg-red-100 px-3 py-2 text-sm text-red-700">{loadError}</div>
    )}
    {loadingDatasets && (
      <div className="flex justify-center">
        <Spinner />
      </div>
    )}
    {!loadingDatasets && datasets.length == 0 && (
      <div className="border rounded flex justify-center px-4 py-2 ">No datasets created yet</div>
    )}
    {!loadingDatasets && datasets.length > 0 && (
      <div className="flex flex-col gap-4">
        {datasets.map(dataset => (
          <div key={dataset.dataset_id}
            className="flex justify-between px-4 py-2 mt-4 border rounded hover:bg-gray-100 hover:cursor-pointer">
            <div className="flex flex-col gap-2">
              <div className="font-bold">{dataset.name}</div>
              <div className="text-sm text-gray-700">{dataset.video_count} video(s)</div>
              <div className="text-sm italic">{dataset.status}</div>
            </div>
            <div className="flex flex-col justify-center items-center">
              <div className="border border-red-700 rounded-full w-8 h-8 p-1 hover:bg-red-100">
                <i className="fa-solid fa-trash text-red-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
    
    {showCreateDataset && (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40">
        <form onSubmit={handleUpload}
          className="w-full max-w-lg rounded bg-white p-6 flex flex-col">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Create Dataset</h2>
              <button type="button"
                onClick={() => setShowCreateDataset(false)}
                className="rounded p-2 hover:bg-gray-100 hover:cursor-pointer">
                  <i className="fa-solid fa-xmark" />
              </button>    
            </div>
            
            {error && (
              <div className="mt-4 rounded border border-red-700 bg-red-100 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
            
            {invalidVideos.length > 0 && (
              <div className="border rounded overflow-y-auto max-h-48 mt-4 text-sm">
                <table className="">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2">File</th>
                      <th className="px-3 py-2">Problem</th>
                      <th className="px-3 py-2">Duration</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invalidVideos.map(video => (
                      <tr key={video.name} className="border-t">
                        <td className="px-3 py-2">{video.name}</td>
                        <td className="px-3 py-2">{video.error}</td>
                        <td className="px-3 py-2">{video.duration != null ? `${video.duration.toFixed(1)}s` : "-"}</td>
                        <td className="px-3 py-2">
                          <button type="button" 
                            onClick={()=>{
                              setVideos(current => current.filter(file => file.name !== video.name))
                              setInvalidVideos(current => current.filter(item => item.name !== video.name))
                            }}
                            className="text-red-700 hover:cursor-pointer hover:bg-red-100 p-1 rounded"
                          >
                            Remove 
                          </button>
                        </td>
                      </tr>
                    ))}
                    
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="mt-4 flex flex-col gap-2">
              <label htmlFor="dataset-name">Dataset Name</label>
              <input id="dataset-name" type="text" 
                value={datasetName} onChange={e => setDatasetName(e.target.value)}
                className="rounded border px-3 py-2" />
            </div>
            
            <input id="dataset-videos" type="file"
              accept="video/*" multiple hidden onChange={e => handleVideos(e.target.files)}
            />
            <label htmlFor="dataset-videos" 
              onDragEnter={handleDragEnter}
              onDragOver={e => e.preventDefault()}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`rounded border-2 border-dashed flex flex-col px-4 py-4 mt-4 hover:cursor-pointer hover:bg-gray-50 ${isDragging ? "border-blue-600 bg-blue-100" : "border-gray-700 bg-gray-100"}`}>
              <div className="flex justify-center">
                <i className={`fa-solid fa-upload ${isDragging ? "text-blue-600" : ""}`} />
              </div>
              <div className={`flex justify-center font-semibold ${isDragging ? "text-blue-600" : ""}`}>
                Drop videos here
              </div>
            </label>
            <div className="flex justify-center">
              <p className="mt-3 text-sm text-gray-500">{videos.length} video(s) selected</p>
            </div>
            
            <button type="submit"
              disabled={submitDisabled}
              className="mt-4 rounded bg-blue-500 text-white px-3 py-2 hover:bg-blue-600 hover:cursor-pointer disabled:bg-gray-300 disabled:text-gray-500">
              Upload Videos
            </button>
        </form>
      </div>
    )}
    </>
  )
}

export default UploadPage;