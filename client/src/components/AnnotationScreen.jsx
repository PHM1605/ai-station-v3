

import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Spinner from "../components/Spinner";
import { Stage, Layer, Image as KonvaImage, Circle } from "react-konva";
import { useStation } from "../context/StationProvider";

function AnnotationScreen() {
  // Area that contains the Frame AND gaps around
  const frameAreaRef = useRef(null);
  const [frameAreaSize, setFrameAreaSize] = useState({width: 0, height: 0});
  
  const { frameId, datasetId } = useParams();
  const [frameImage, setFrameImage] = useState(null);
  const { getFrame, prefetchAdjacentFrames } = useStation();
  
  const navigate = useNavigate()
  
  // Point will be displayed in Original Image Coordinates
  const [testPoint, setTestPoint] = useState(null);
  
  // {frame: {...}, position: 7, total: 10}
  const [frameNavigation, setFrameNavigation] = useState(null);
  // when User clicks "Next" to make URL changes => "frameId" & "datasetId" change but "frameNavigation" change in "showFrame()" not finish running yet
  // => we don't allow drawing on Screen
  const isChangingFrame = frameNavigation?.frame.frame_id !== frameId || frameNavigation?.frame.dataset_id != datasetId;
  
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

  useEffect(() => {
    let active = true;
    
    async function showFrame() {
      try {
        const data = await getFrame(datasetId, frameId);
        if (!active) {
          return;
        }
        setFrameImage(data.image);
        setFrameNavigation(data.navigation);
        setTestPoint(null);
        // NOTE: this "prefetch" will cache adjacent Frames to avoid flickering
        prefetchAdjacentFrames(data)
      } catch(err) {
        if (active) {
          console.error("Unable to load frame", err)
        }
      }
    }
    showFrame();
      return () => active = false;
  }, [datasetId, frameId, getFrame, prefetchAdjacentFrames])
  
  // e.g. Workspace: 1080x780; Image: 1280x720
  // take the dimension ratio that must be resized LESS
  const imageScale = frameImage && frameAreaSize.width > 0 && frameAreaSize.height > 0 ? (
    Math.min(frameAreaSize.width / frameImage.naturalWidth, frameAreaSize.height / frameImage.naturalHeight)
  ) : 0;
  const displayedWidth = frameImage ? frameImage.naturalWidth * imageScale : 0;
  const displayedHeight = frameImage ? frameImage.naturalHeight * imageScale : 0;
  
  const handleFrameClick = e => {
    const stage = e.target.getStage();
    const position = stage.getPointerPosition(); // in Konva's coordinate
    
    if (isChangingFrame || !position || !frameImage || displayedWidth === 0 || displayedHeight === 0) {
      return;
    }
    const originalX = position.x * (frameImage.naturalWidth / displayedWidth)
    const originalY = position.y * (frameImage.naturalHeight / displayedHeight)
    setTestPoint({x: originalX, y: originalY})
  }
  
  const navigateToFrame = nextFrameId => {
    if (!nextFrameId || isChangingFrame) {
      return 
    }
    navigate(`/annotate/${datasetId}/${nextFrameId}`)
  }
  
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left area - classes */}
      <div className="shrink-0 w-48">
      </div>
      {/* Middle area - Konva */}
      <div className="flex flex-1 flex-col min-h-0 min-w-0 bg-blue-100">
        {/* Frame numbers on top */}
        <div className="shrink-0 h-12 bg-green-100 flex justify-center items-center">
          <div className="border rounded px-2 py-1 flex items-center gap-2">
            <button type="button"
              disabled={isChangingFrame || !frameNavigation?.previous_frame_id}
              onClick={() => navigateToFrame(frameNavigation.previous_frame_id)} 
              className="hover:scale-[1.1] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100">
              <i className="text-sm fa-solid fa-arrow-left" />
            </button>
            {frameNavigation ? `${frameNavigation.position}/${frameNavigation.total}` : "..."}
            <button type="button"
              disabled={isChangingFrame || !frameNavigation?.next_frame_id}
              onClick={() => navigateToFrame(frameNavigation.next_frame_id)}
              className="hover:scale-[1.1] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100">
              <i className="fa-solid text-sm fa-arrow-right" />
            </button>
            
          </div>
          {testPoint && (
            <div className="ml-3 text-sm text-gray-700">
              x: {testPoint.x.toFixed(1)}
              y: {testPoint.y.toFixed(1)}
            </div>
          )}
        </div>
        <div ref={frameAreaRef} 
          className="flex flex-1 min-h-0 min-w-0 bg-gray-100 items-center justify-center overflow-hidden">
          {!frameImage || imageScale === 0 ? (
            <Spinner />
          ) : (
            <Stage width={displayedWidth} height={displayedHeight} 
              onClick={handleFrameClick} 
              style={{cursor: isChangingFrame ? "wait" : "crosshair"}}
            >
              <Layer>
                <KonvaImage image={frameImage} x={0} y={0} width={displayedWidth} height={displayedHeight} listening={false} />
                {testPoint && (
                  <Circle 
                    x={testPoint.x*displayedWidth/frameImage.naturalWidth} 
                    y={testPoint.y*displayedHeight/frameImage.naturalHeight}
                    radius={5}
                    fill="#2563eb"
                    stroke="white"
                    strokeWidth={2}
                    listening={false}
                  />
                )}
              </Layer>
            </Stage>
          )}
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