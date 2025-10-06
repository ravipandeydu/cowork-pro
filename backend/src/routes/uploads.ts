import { Router } from "express";
import multer from "multer";
import { uploadFile, deleteFile } from "../services/r2Service";
import { authenticate } from "../middleware/auth";

const router = Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

// Upload single file
router.post("/upload", authenticate, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file provided" });
        }

        const folder = req.body.folder || "uploads";
        const result = await uploadFile(req.file, folder);

        if (!result.success) {
            return res.status(500).json({ error: result.error });
        }

        return res.json({
            success: true,
            url: result.url,
        });
    } catch (error) {
        console.error("Error in file upload:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Delete file
router.delete("/delete", authenticate, async (req, res) => {
    try {
        const { fileUrl } = req.body;

        if (!fileUrl) {
            return res.status(400).json({ error: "File URL is required" });
        }

        const success = await deleteFile(fileUrl);

        if (!success) {
            return res.status(500).json({ error: "Failed to delete file" });
        }

        return res.json({
            success: true,
            message: "File deleted successfully",
        });
    } catch (error) {
        console.error("Error in file deletion:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;