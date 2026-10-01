import { useEffect, useState } from "react";
import {useNavigate, useParams} from "react-router-dom";
import axiosClient from "../api/axiosConfig";
import { useStation } from "../context/StationProvider";
import Spinner from "../components/Spinner";

const framesPerPage = 56

function DatasetPage() {
  const {projectId, datasetId} = useParams();
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { state, dispatch } = useStation()
  const dataset = state.datasets[datasetId]
  const framesScopeId = `dataset:${datasetId}`
  
  // check if current page is cached yet
  const pageCached = state.framesScopeId === framesScopeId && state.framePages[page] !== undefined;
  const frameIds = pageCached ? state.framePages[page] : [];
  const frames = frameIds.map(frameId => state.frames[frameId]);
  const totalFrames = state.framesScopeId === framesScopeId ? state.framesTotal : 0;
  const totalPages = Math.max(1, Math.ceil(totalFrames / framesPerPage));
  const firstFrame = totalFrames === 0 ? 0 : (page-1) * framesPerPage + 1;
  const lastFrame = Math.min(page * framesPerPage, totalFrames);
  const pageNumbers = Array.from({length: totalPages}, (_, index)=>index+1);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    if (pageCached) {
      return 
    }
    // NEW: when user is fetching Page 1 but clicks Page 2 => abort 1st request
    const controller = new AbortController()
    
    async function fetchFrames() {
      setLoading(true);
      setError("")
      
      
      try {
        const response = await axiosClient.get(
          `/projects/${projectId}/datasets/${datasetId}/frames`,
          { params: {page, limit: framesPerPage}, signal: controller.signal }
        )
        dispatch({
          type: "CACHE_FRAMES",
          id: framesScopeId, 
          data: response.data.frames,
          page: response.data.page,
          total: response.data.total,
          limit: response.data.limit, // 56 images per Page
        })
      } catch(err) {
        if (err.code === "ERR_CANCELED") {
          return 
        }
        setError(err.response?.data?.error ?? "Unable to load frames")
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    } 
    
    fetchFrames()
    
    return () => {
      controller.abort();
    }
  }, [projectId, datasetId, framesScopeId, page, pageCached, dispatch])
  
  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden px-3 py-2">
      <h1 className="text-xl font-bold mb-4">{dataset?.name ?? "Dataset"}</h1>
      
      {error && (
        <div className="mt-4 rounded border border-red-600 bg-red-100 px-3 py-2 text-red-600">
        {error}
        </div>
      )}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <Spinner />
        </div>
      )}
      {!loading && !error && frames.length===0 && (
        <div className="border border-dashed rounded flex-1 justify-center items-center flex">
          No frames found in this dataset.
        </div>
      )}
      {!loading && frames.length > 0 && (
        <>
        <div className="mt-4 gap-2 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 overflow-auto">
          {frames.map(frame => (
            <div key={frame.frame_id}
              onClick={()=>navigate(`/annotate/${datasetId}/${frame.frame_id}`)}
              className="rounded border h-48 w-48 hover:border-blue-700 hover:cursor-pointer px-2 py-1">
              <img src={`${import.meta.env.VITE_API_BASE_URL}${frame.image_url}`}
                crossOrigin="use-credentials"
                alt={`Frame ${frame.frame_number}`}
                loading="lazy"
                className="w-full h-full object-contain"
                />
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-3 items-center border-t text-sm">
          <div className="justify-self-start mt-2">
            <span>Per page: {framesPerPage}</span>
          </div>
          <div className="justify-self-center flex items-center justify-center mt-1 w-64 min-w-0 overflow-hidden">
            <div className="mr-2">{firstFrame} - {lastFrame} of {totalFrames}</div>
            <div className="flex gap-2 items-center">
              <button className="border rounded p-1 hover:cursor-pointer hover:bg-gray-100">
                <i className="fa-solid fa-arrow-left" />
              </button>
              <div className="flex max-w-48 gap-1 overflow-x-auto">
                {pageNumbers.map(pageNumber => (
                  <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)}
                    className={`hover:cursor-pointer hover:bg-gray-100 p-1 rounded ${pageNumber===page ? "text-blue-600" : "text-gray-900"}`}
                  >
                    {pageNumber}
                  </button>
                ))} 
              </div>
              <button className="border rounded p-1 hover:cursor-pointer hover:bg-gray-100">
                <i className="fa-solid fa-arrow-right"/>
              </button>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  )
}

export default DatasetPage;