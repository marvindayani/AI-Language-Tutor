import User from "../models/User.model.js";
import {
  uploadToS3,
  deleteFromS3,
  isValidImageFile,
  getKeyFromUrl,
} from "../utils/s3.js";

/**
 * Upload profile picture to S3
 */
export const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("File uploaded:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // Validate image file
    if (!isValidImageFile(req.file.buffer, req.file.mimetype)) {
      return res.status(400).json({
        error:
          "Invalid image file. Must be JPEG, PNG, GIF, or WebP and under 5MB",
      });
    }

    // Get user to check for existing profile picture
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete old profile picture from S3 if it exists
    if (user.profilePicture) {
      const oldKey = getKeyFromUrl(user.profilePicture);
      if (oldKey) {
        try {
          await deleteFromS3(oldKey);
          console.log("Old profile picture deleted successfully");
        } catch (deleteError) {
          console.warn(
            "Warning: Could not delete old profile picture:",
            deleteError.message,
          );
          // Continue even if deletion fails
        }
      }
    }

    // Upload new picture to S3
    console.log("Uploading to S3...");
    const { url, key } = await uploadToS3(
      req.file.buffer,
      `profile-${userId}`,
      req.file.mimetype,
      "profile-pictures",
    );

    console.log("S3 upload successful:", { url, key });

    // Update user with new S3 URL
    user.profilePicture = url;
    user.profilePictureKey = key; // Store S3 key for potential future deletion
    await user.save();

    res.status(200).json({
      message: "Profile picture uploaded successfully",
      user: user,
    });
  } catch (error) {
    console.error("Profile picture upload error:", error);

    // Check if it's an AWS credentials error
    if (error.message && error.message.includes("AWS")) {
      return res.status(500).json({
        error:
          "AWS S3 not configured. Please add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to .env file",
      });
    }

    res
      .status(500)
      .json({ error: error.message || "Failed to upload profile picture" });
  }
};

/**
 * Update profile information (name, bio, etc.)
 */
export const updateProfileInfo = async (req, res) => {
  try {
    console.log(
      "Update profile request - Body:",
      req.body,
      "User ID:",
      req.user.id,
    );

    const { name, bio } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      console.error("User not found with ID:", req.user.id);
      return res.status(404).json({ error: "User not found" });
    }

    // Update fields if provided (allow empty strings for bio)
    if (name !== undefined && name !== null) {
      user.name = name;
    }
    if (bio !== undefined) {
      user.bio = bio;
    }

    const updatedUser = await user.save();
    console.log("User updated successfully:", updatedUser._id);

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to update profile" });
  }
};
