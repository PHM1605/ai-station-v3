

import { useEffect, useRef, useState } from "react";

function AnnotationScreen() {
  // Area that contains the Frame AND gaps around
  const frameAreaRef = useRef(null);
  const [frameAreaSize, setFrameAreaSize] = useState({width: 0, height: 0});
  
  // This "useEffect" will create a "resizeObserver" inside => "resizeObserver" will fire when "frameArea" changes
  useEffect(() => {
    const frameArea = frameAreaRef.current;
    if (!frameArea) {
      return 
    }
    const updateFrameAreaSize = () => { 
      setFrameAreaSize({width: frameArea.clientWidth, height: frameArea.clientHeight})
    }
    // Setup "resizeObserver" will above Callback
    const resizeObserver = new ResizeObserver(updateFrameAreaSize);
    resizeObserver.observe(frameArea);
    updateFrameAreaSize()
    
    return () => resizeObserver.disconnect();
  }, [])
  
  
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left area - classes */}
      <div className="shrink-0 w-48">
      </div>
      {/* Middle area - Konva */}
      <div className="flex flex-1 flex-col min-h-0 min-w-0 bg-blue-100">
        {/* Frame numbers on top */}
        <div className="shrink-0 h-12 bg-green-100 flex justify-center items-center">
          <div className="border rounded px-2 py-1">
            1/10
          </div>
        </div>
        <div ref={frameAreaRef} 
          className="flex flex-1 min-h-0 min-w-0 bg-gray-100">
          <div className="p-2 text-sm text-gray-500">
            Workspace: {frameAreaSize.width} x {frameAreaSize.height}
          </div>
        </div>
      </div>
      {/* Right area - toolbar */}
      <div className="shrink-0 w-12 flex flex-col justify-center p-1">
        <div className="border rounded flex flex-col items-center py-2">
          <div className="w-8 h-8 p-1 flex items-center justify-center rounded hover:bg-blue-100 hover:cursor-pointer">
            <i className="fa-solid fa-wand-magic-sparkles text-sm" />
          </div>
        </div>
      </div>
      {/* Right area - images */}
      <div className="shrink-0 bg-red-100 w-48">
        
      </div>
    </div>
  )
}

export default AnnotationScreen;