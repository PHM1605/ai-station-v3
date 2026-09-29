import { useAuth } from '../context/AuthProvider';
import NavBar from './NavBar'
import Spinner from './Spinner';
import { Navigate } from 'react-router-dom';

function HomePage() {
  const {auth, loading} = useAuth()
  
  if (loading) {
    return <Spinner />
  }
  
  if (auth) {
    return <Navigate to="/workspace" replace />
  }
  
  return (
    <>
    <NavBar />
    <div>
      <h1>AI Station</h1>
      <p>Build, annotate, and train computer-vision datasets.</p>
    </div>
    </>
  )
}

export default HomePage;
