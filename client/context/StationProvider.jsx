import {createContext, useContext, useReducer} from "react";

const StationContext = createContext(null);

const initialState = {
  // User data (partly Admin data too)
  projects: {},
  datasets: {},
  images: {},
  annotations: {},
  jobs: {},
  
  // Admin data
  cluster: {
    workers: {},
    gpus: {},
  }
}

// action: object received from "dispatch({...})"
function reducer(state, action) {
  switch (action.type) {
    case 'CACHE_PROJECT':
      return {
        ...state,
        projects: {
          ...state.projects,
          [action.id]: action.data,
        }
      }
    
    case 'CACHE_GPU':
      return {
        ...state,
        cluster: {
          ...state.cluster,
          gpus: {
            ...state.cluster.gpus,
            [action.id]: action.data,
          }
        }
      }
    
    default:
      return state
  }
}

export function StationProvider({children}) {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  return (
    <StationContext.Provider value={{state, dispatch}}>
      {children}
    </StationContext.Provider>
  )
}

export function useStation() {
  return useContext(StationContext);
}