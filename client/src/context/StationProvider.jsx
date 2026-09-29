import { createContext, useContext, useReducer } from "react";

const StationContext = createContext(null);

const initialState = {
  projects: {}, // {"1": {...}, "2": {xxx}, ...}
  projectsLoaded: false,
  
  datasets: {},
  datasetsLoaded: false,
  datasetsProjectId: null,
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
