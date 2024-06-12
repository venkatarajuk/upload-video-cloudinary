import express from "express";
import multer from "multer";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { Sequelize, DataTypes, where } from "sequelize";

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors());

// Initialize Sequelize
const sequelize = new Sequelize("databasename", "username", "password", {
  host: "localhost",
  dialect: "mysql",
});

// Define the Video model
const Video = sequelize.define(
  "Video",
  {
    cloudinaryUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    public_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: false,
  }
);

cloudinary.config({
  cloud_name: "dgzbpko6w",
  api_key: "753745231722579",
  api_secret: "rahEITQfcHg-ee0tsY-k6L_382Y",
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    // folder: "uploads",
    resource_type: "video",
  },
});
const upload = multer({ storage: storage }).single("file");

// Route to handle video upload
app.post("/upload-video", upload, async (req, res) => {
  if (req.file) {
    try {
      const imageUrl = req.file.path;
      const video = await Video.create({
        cloudinaryUrl: imageUrl,
        public_id: req.file.filename,
      });
      return res.status(200).json({ message: "added successfully" });
    } catch (uploadError) {
      console.error("Error uploading video to Cloudinary:", uploadError);
      return res
        .status(500)
        .json({ error: "Error uploading video to Cloudinary" });
    }
  } else {
    return res.status(400).json({ error: "No file found" });
  }
});

// routes to get videos
app.get("/get-videos", async (req, res) => {
  try {
    const videos = await Video.findAll();
    res.json(videos);
  } catch (error) {
    console.error("Error retrieving videos:", error);
    res.status(500).json({ error: "Error retrieving videos" });
  }
});

// delete perticular video by its id
// app.delete("/delete-video/:id", async (req, res) => {
//   const videoId = req.params.id;
//   try {
//     const video = await Video.findOne({ where: { id: videoId } });
//     if (!video) {
//       return res.status(404).json({ error: "Video not found" });
//     }
//       await video.destroy();
//       return res.status(200).json({ message: "Video deleted successfully" });

//   } catch (error) {
//     console.error("Error deleting video:", error);
//     return res.status(500).json({ error: "Error deleting video" });
//   }
// });

app.delete("/delete-video/:id", async (req, res) => {
  const videoId = req.params.id;
  try {
    const video = await Video.findOne({ where: { id: videoId } });
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }
    const publicId = video.public_id.toLowerCase();
    const cloudinaryResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        { resource_type: "video" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });
    if (cloudinaryResponse.result === "not found") {
      console.error("Video not found on Cloudinary");
      return res.status(404).json({ error: "Video not found on Cloudinary" });
    }
    await video.destroy();
    return res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error);
    return res.status(500).json({ error: "Error deleting video" });
  }
});

//update perticular video by id

app.put("/update-video/:id", upload, async (req, res) => {
  const videoId = req.params.id;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file found" });
    }

    const updatedImageUrl = await cloudinary.uploader
      .upload(req.file.path, {
        resource_type: "video",
      })
      .then((result) => result.secure_url);

    const video = await Video.findOne({ where: { id: videoId } });

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    // Delete the old video from Cloudinary
    const deletionResult = await cloudinary.uploader.destroy(
      video.cloudinaryUrl
    );
    console.log(deletionResult);
    console.log(cloudinary.uploader.destroy(video.cloudinaryUrl));
    if (deletionResult.result !== "ok") {
      console.error("Error deleting old video from Cloudinary");
    }

    video.cloudinaryUrl = updatedImageUrl;
    await video.save();

    // Respond with success message
    return res.status(200).json({ message: "Video updated successfully" });
  } catch (error) {
    console.error("Error updating video:", error);
    return res.status(500).json({ error: "Error updating video" });
  }
});

// Sync the Sequelize model with the database
sequelize
  .sync()
  .then(() => {
    console.log("Database synchronized");
  })
  .catch((error) => {
    console.error("Error synchronizing database:", error);
  });

// Start server
const PORT = process.env.PORT || 8003;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
