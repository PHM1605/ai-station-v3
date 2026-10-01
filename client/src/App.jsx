import './App.css'
import HomePage from './components/HomePage'
import RequireAuth from './components/RequireAuth'
import { Navigate, Route, Routes } from 'react-router-dom'
import SignIn from './components/SignIn'
import Register from './components/Register'
import Projects from './components/Projects'
import Models from './components/Models'
import WorkspaceLayout from './components/WorkspaceLayout'
import CreateProject from './components/CreateProject'
import ProjectLayout from './components/ProjectLayout'
import AnnotatePage from "./components/AnnotatePage"
import UploadPage from './components/UploadPage'
import DatasetPage from './components/DatasetPage'
import AnnotationScreen from './components/AnnotationScreen'

function App() {
 
  return (
    <>
    <Routes>
      <Route index element={<HomePage />} />
      {/* <Route path="/register" element={} /> */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/register" element={<Register />} />
      <Route element={<RequireAuth />}>
        <Route path="/workspace" element={<WorkspaceLayout />}>
          <Route index element={<Projects />} />
          <Route path="models" element={<Models />} />
          <Route path=":projectId" element={<ProjectLayout />}>
            {/* Navigate to /upload by default */}
            <Route index element={<Navigate to="upload" replace />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="annotate">
              <Route index element={<AnnotatePage />} />
              <Route path=":datasetId" element={<DatasetPage />} />
            </Route> 
          </Route>
        </Route>
        
        <Route path="/create" element={<CreateProject />} />
        <Route path="/annotate/:datasetId/:frameId" element={<AnnotationScreen />} />
      </Route>
    </Routes>
    
    {/* <div className='h-screen w-screen flex'>
      <SideBar /> */}
      {/* 16 rem is w-64 = SideBar width */}
      {/* <div className='w-[calc(100vw-16rem)] h-screen'>
        <TopBar />
        <AnnotationScreen />
      </div>
    </div> */}
    </>
  )
}

export default App
