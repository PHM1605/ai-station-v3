import { useState, useEffect, useRef } from "react";
import {Stage, Layer, Circle} from "react-konva"

function AnnotationScreen() {
  const videoRef = useRef(null);  
  const videoAreaRef = useRef(null);
  
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoUrl, setVideoUrl] = useState("/test.mp4");
  const [playing, setPlaying] = useState(false);
  const [mousePosition, setMousePosition] = useState(null);
  const [videoRect, setVideoRect] = useState({
    x: 0,
    y: 0, 
    width: 0,
    height: 0,
  })
  const [points, setPoints] = useState([]);
  const [masks, setMasks] = useState([]);
  const [segmenting, setSegmenting] = useState(false);
  
  const loadSAMMasks = async() => {
    setSegmenting(true);
    try {
      const response = await fetch("http://localhost:8080/api/segment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          time: videoRef.current.currentTime, // time in <seconds>
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to segment frame");
      }
      const data = await response.json();
      console.log("SAM masks: ", data.masks)
      setMasks(data.masks)
    } catch(error) {
      console.error(error)
    } finally {
      setSegmenting(false);
    }
  }
  
  // Keep track when the Video changes size
  useEffect(() => {
    const video = videoRef.current 
    const videoArea = videoAreaRef.current 
    if (!video || !videoArea) return 
    
    const update = () => {
      setVideoRect({
        x: video.offsetLeft, // relative to Video's parent element
        y: video.offsetTop, 
        width: video.clientWidth,
        height: video.clientHeight,
      })
    }
    
    const observer = new ResizeObserver(update)
    observer.observe(video)
    observer.observe(videoArea)
    update()
    
    return () => observer.disconnect();
  }, [])
    
  const handlePlay = () => {
    if (playing) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }
  
  const handleMouseMove = (e) => {
    const stage = e.target.getStage()
    const position = stage.getPointerPosition()

    setMousePosition({x: Math.round(position.x), y: Math.round(position.y)})
  }
  
  const handleMouseLeave = () => {
    setMousePosition(null);
  }
  
  const handleTimelineChange = (e) => {
    const time = Number(e.target.value)
    videoRef.current.currentTime = time 
    setCurrentTime(time)
  }
  
  const handleStageClick = (e) => {
    const stage = e.target.getStage()
    const position = stage.getPointerPosition()
    
    setPoints([
      ...points,
      {
        x: position.x,
        y: position.y,
      }
    ])
  }
  
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  
  return (
    // 5rem = h-20 = height of Topbar
    // 4rem = h-16 = height of Timeline bar
    // => subtract 9rem = height of video
    <div className="w-full h-[calc(100vh-5rem)]">
      {/* Video screen */}
      <div ref={videoAreaRef} 
        className="w-full h-[calc(100vh-9rem)] flex items-center justify-center relative">
        {/* Annotation Toolbar */}
        <div className="absolute top-4 left-4 z-10 bg-white border rounded p-2 flex gap-2">
          <button className="p-2 h-9 border rounded hover:bg-gray-100" onClick={loadSAMMasks} disabled={segmenting}>
            {segmenting ? "Segmenting..." : "SAM"}
          </button>
        </div>
          
        {/* can't use "flex-1" here because we need to preserve Aspect Ratio */}
        <video 
          ref={videoRef} 
          src={videoUrl}
          className="max-h-full max-w-full"
          onLoadedMetadata={() => {
            setDuration(videoRef.current.duration)
          }}
          onTimeUpdate={() => setCurrentTime(videoRef.current.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setCurrentTime(videoRef.current.duration)
            setPlaying(false)
          }}
        />
        
        {mousePosition && (
          <div className="absolute bottom-2 left-2 bg-black text-white px-2 py-1 text-sm">
            X: {mousePosition.x}, Y: {mousePosition.y}
          </div>
        )}
        
        {/* to draw */}
        <div className="absolute" 
          style={{left: videoRect.x, top: videoRect.y}}
        >
          <Stage width={videoRect.width} height={videoRect.height}
            onClick={handleStageClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <Layer>
              {points.map((point, index) => (
                <Circle key={index} x={point.x} y={point.y} radius={5} fill="red" />
              ))}
            </Layer>
          </Stage>
        </div>
      </div>      
      
      {/* Timeline bar */}
      <div className="w-full h-16 bg-white border-t flex items-center gap-4 px-4">
        <button 
          className="w-10 h-10 flex items-center justify-center border rounded hover:bg-gray-100"
          onClick={handlePlay}
        >
          <i className={playing ? "fas fa-pause" : "fas fa-play"} />
        </button>
        <input type="range" 
          min="0"
          max={duration}
          step="any"
          value={currentTime} 
          onChange={handleTimelineChange} 
          className="flex-1" 
        />
        <div className="w-24 text-sm">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  )
}

export default AnnotationScreen;