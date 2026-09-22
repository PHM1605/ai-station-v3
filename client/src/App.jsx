import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import SideBar from './components/SideBar'
import TopBar from './components/TopBar'
import AnnotationScreen from './components/AnnotationScreen'
import NavBar from './components/NavBar'

function App() {
 
  return (
    <>
    <div className="flex flex-col relative bg-green-100">
      <NavBar />
      <div>fjdskjfksdjf</div>
      <div>fjdskjfksdjf</div>
      <div>fjdskjfksdjf</div>
      <div>fjdskjfksdjf</div>
      <div>fjdskjfksdjf</div>
      <div>fjdskjfksdjf</div>
    </div>
    
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
