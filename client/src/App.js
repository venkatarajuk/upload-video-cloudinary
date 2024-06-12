import logo from "./logo.svg";
import React, { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";

function App() {
  const [video, setVideo] = useState(null);
  const [videos, setVideos] = useState([]);

  const handleFileChange = (event) => {
    setVideo(event.target.files[0]);
  };

  const getVideos = async () => {
    try {
      const response = await axios.get("http://localhost:8003/get-videos");
      setVideos(response.data);
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  };

  useEffect(() => {
    getVideos();
  }, []);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", video);
    try {
      await axios.post("http://localhost:8003/upload-video", formData);
      // After successful upload, fetch updated video list
      getVideos();
    } catch (error) {
      console.error("Error uploading video:", error);
    }
  };
  const deleteVideo = async (id) => {
    console.log(id)
    try {
     const  res= await axios.delete(`http://localhost:8003/delete-video/${id}`);
   
      getVideos();
    } catch (error) {
      console.error("Error deleting video:", error);
    }
  };
  const updateVideo = async (id) => {
    // Assuming video is already selected for replacement
    if (!video) {
      console.error("Please select a video to replace.");
      return;
    }

    const formData = new FormData();
    formData.append("file", video);
    try {
      await axios.put(`http://localhost:8003/update-video/${id}`, formData);
      // After successful replacement, fetch updated video list
      getVideos();
    } catch (error) {
      console.error("Error replacing video:", error);
    }
  };
console.log(videos)
  return (
    <div className="App">
      <div>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload</button>
        {video && <video controls src={URL.createObjectURL(video)} />}
      </div>
      <ul>
        {videos.map((video) => (
          <li key={video.id}>
            <video controls className="videos">
              <source src={video.cloudinaryUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <button onClick={() => deleteVideo(video.id)}>Delete</button>
            <button onClick={() => updateVideo(video.id)}>Update Video</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
