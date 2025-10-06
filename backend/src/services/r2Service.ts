import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "dotenv";

config();

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET_NAME || !PUBLIC_URL) {
    throw new Error("Missing required R2 configuration");
}

const S3 = new S3Client({
    region: "auto",
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
    },
});

export interface UploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

export const uploadFile = async (
    file: Express.Multer.File,
    folder: string = "uploads"
): Promise<UploadResult> => {
    try {
        const key = `${folder}/${Date.now()}-${file.originalname}`;
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        });

        await S3.send(command);
        const fileUrl = `${PUBLIC_URL}/${key}`;

        return {
            success: true,
            url: fileUrl,
        };
    } catch (error) {
        console.error("Error uploading file to R2:", error);
        return {
            success: false,
            error: "Failed to upload file",
        };
    }
};

export const deleteFile = async (fileUrl: string): Promise<boolean> => {
    try {
        const key = fileUrl.replace(`${PUBLIC_URL}/`, "");
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        await S3.send(command);
        return true;
    } catch (error) {
        console.error("Error deleting file from R2:", error);
        return false;
    }
};

export const getPresignedUrl = async (
    key: string,
    expiresIn: number = 3600
): Promise<string | null> => {
    try {
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        const presignedUrl = await getSignedUrl(S3, command, { expiresIn });
        return presignedUrl;
    } catch (error) {
        console.error("Error generating presigned URL:", error);
        return null;
    }
};