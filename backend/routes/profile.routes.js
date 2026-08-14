import express from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import {
  uploadProfilePicture,
  updateProfileInfo,
} from "../controllers/profile.controller.js";

const router = express.Router();

// Configure multer for memory storage (not disk)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Upload profile picture to S3
router.post(
  "/picture",
  protect,
  upload.single("profilePicture"),
  uploadProfilePicture,
);

// Update other profile info
router.put("/info", protect, updateProfileInfo);

export default router;
