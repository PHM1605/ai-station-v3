import { createContext, useContext, useEffect, useReducer, useRef, useCallback } from "react";
import { useAuth } from "./AuthProvider";
import axiosClient from "../api/axiosConfig";

const StationContext = createContext(null);

const initialState = {
  projects: {}, // {"1": {...}, "2": {xxx}, ...}
  projectsLoaded: false,
  
  datasets: {},
  datasetsLoaded: false,
  datasetsProjectId: null,
  
  frames: {},
  framePages: {}, // {"5": [12,34,67...], "7": [xxx...]} => Page 5 has Frame IDs of [12,34,67...] etc.
  framesScopeId: null, 
  framesTotal: 0,
  framesLimit: 60,
}

function reducer(state, action) {
  // dispatch({ type: "CACHE_PROJECTS", data: xxx })
  
  switch (action.type) {
  case "CACHE_PROJECTS": {
    // projects: {"1": {...}, "2": {xxx}, ...}
    const projects = {}
    for (const project of action.data) {
      projects[project.project_id] = project
    }
    return {
      ...state,
      projects,
      projectsLoaded: true
    }
  }
  case "ADD_PROJECT":
    return {
      ...state,
      projects: {
        ...state.projects,
        [action.id]: action.data
      }
    }
  
  case "DELETE_PROJECT": {
    const projects = {
      ...state.projects
    }
    delete projects[action.id]
    return {
      ...state,
      projects
    }
  }
  
  // dispatch({type: "CACHE_DATASETS", id: projectId, data: response.data.datasets})
  case "CACHE_DATASETS": {
    const datasets = {}
    for (const dataset of action.data) {
      datasets[dataset.dataset_id] = dataset
    }
    return {
      ...state,
      datasets,
      datasetsLoaded: true,
      datasetsProjectId: action.id,
    }
  }
  
  // dispatch({type:"ADD_DATASET", id: response.data.dataset_id, data: response.data})
  case "ADD_DATASET":
    return {
      ...state,
      datasets: {
        ...state.datasets,
        [action.id]: action.data,
      },
    }
  
  // dispatch({type:"DELETE_DATASET", id: dataset.dataset_id})
  case "DELETE_DATASET": {
    const datasets = {
      ...state.datasets 
    }
    delete datasets[action.id]
    return {
      ...state,
      datasets,
    }
  }
  
  // dispatch({
  //   type: "CACHE_FRAMES",
  //   id: datasetId,
  //   data: response.data.frames,
  //   page: response.data.page,
  //   total: response.data.total,
  //   limit: response.data.limit,
  // })
  
  case "CACHE_FRAMES": {
    // check if request to cache & current cache is of same Dataset
    const sameScope = action.id === state.framesScopeId
    // if same Dataset => load current Frames first; else from scratch {}
    const frames = sameScope ? {...state.frames} : {}
    // what Frame IDs are being requested to cache?
    const frameIds = []
    for (const frame of action.data) {
      frames[frame.frame_id] = frame
      frameIds.push(frame.frame_id)
    }
    // Page 5 has Frame IDs of [12,34,67...]
    const framePages = sameScope ? {...state.framePages, [action.page]: frameIds} : {[action.page]: frameIds}
    
    return {
      ...state,
      frames,
      framePages,
      framesScopeId: action.id,
      framesTotal: action.total,
      framesLimit: action.limit,
    }
  }
    
  default:
    return state
  }
}

export function StationProvider({children}) {
  const [state, dispatch] = useReducer(reducer, initialState);
  // to prefetch Images - avoid flickering
  const frameCache = useRef(new Map()); 
  const cachedDatasetId = useRef(null);
  
  const { auth } = useAuth();
  const userId = auth?.user_id ?? null;
  
  // clear cache when User Session ends
  useEffect(() => {
    return () => {
      frameCache.current = new Map();
      cachedDatasetId.current = null;
    }  
  }, [userId]);
  
  // "useCallback" with [] means "doesn't reload when StationProvider changes"
  const getFrame = useCallback((datasetId, frameId) => {
    // We cache only from 1 Dataset (fresh user this field is "null")
    if (cachedDatasetId.current !== datasetId) {
      frameCache.current = new Map();
      cachedDatasetId.current = datasetId;
    }
    const cache = frameCache.current;
    
    // Use cache if this "frameId" exists
    if (cache.has(frameId)) {
      return cache.get(frameId);
    }
    
    const image = new window.Image();
    image.crossOrigin = "use-credentials";
    image.src = `${import.meta.env.VITE_API_BASE_URL}/frames/${frameId}/image`
    // Load image and navigation information concurrently
    const promise = Promise.all([
      image.decode(),
      axiosClient.get(`/frames/${frameId}/navigation`)
      ]).then(([, response]) => {
        // response: navigation information
        // response.data: {"frame","position","total","previous_frame_id","next_frame_id"}
        if (response.data.frame.dataset_id !== datasetId) {
          throw new Error("Frame does not belong to this dataset");
        }      
        return {
          frameId,
          datasetId, 
          image,
          navigation: response.data,
        }
      }).catch(err => {
        // Remove failed cache so that Request can be retried later (because "frameId" not yet exists)
        if (cache.get(frameId) === promise) {
          cache.delete(frameId);
        }
        throw err;
      });
    // NOTE: we store "promise"; which eventually be Frame Data when finish loading
    cache.set(frameId, promise);
    return promise;
  }, [])
  
  // "useCallback" with [getFrame] means: marking "prefetchAdjacentFrames" as "CHANGED" => will trigger "useEffect()" that has [prefetchAdjacentFrames] as dependencies
  // "data": what we receive from "getFrame()"
  const prefetchAdjacentFrames = useCallback(data => {
    // we cache only from 1 Dataset
    if (cachedDatasetId.current !== data.datasetId) {
      return;
    }
    const adjacentIds = [data.navigation.previous_frame_id, data.navigation.next_frame_id].filter(Boolean);
    const keepIds = new Set([data.frameId, ...adjacentIds]);
    
    // Release images outside the current working window
    for (const cachedId of frameCache.current.keys()) {
      if (!keepIds.has(cachedId)) {
        frameCache.current.delete(cachedId);
      }
    }
    // Prepare previous and next without waiting for a click
    for (const adjacentId of adjacentIds) {
      getFrame(data.datasetId, adjacentId).catch(error => {
        console.error("Unable to prefetch frame: ", error)
      });
    }
  }, [getFrame]);
  
  return <StationContext.Provider 
    value={{
      state, 
      dispatch,
      getFrame,
      prefetchAdjacentFrames
    }}
    >
    {children}
  </StationContext.Provider>
}

export function useStation() {
  return useContext(StationContext)
}
