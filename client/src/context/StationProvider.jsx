import { createContext, useContext, useReducer } from "react";

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
  
  return <StationContext.Provider value={{state, dispatch}}>
    {children}
  </StationContext.Provider>
}

export function useStation() {
  return useContext(StationContext)
}
