import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:8000';
const TEST_FILE_PATH = path.join(__dirname, 'test-upload.txt');

async function testUpload() {
    try {
        // Login
        console.log('🔑 Attempting to login...');
        const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
            email: 'admin@coworkpro.com',
            password: 'Admin123!'
        });
        console.log('Login response:', loginResponse.data);

        const token = loginResponse.data?.data?.token;
        if (!token) {
            throw new Error('No token received from login');
        }
        console.log('✅ Successfully logged in');

        // Create test file
        fs.writeFileSync(TEST_FILE_PATH, 'This is a test file for upload');
        console.log('📝 Created test file:', TEST_FILE_PATH);

        // Create form data
        const formData = new FormData();
        formData.append('file', fs.createReadStream(TEST_FILE_PATH));
        formData.append('folder', 'test-uploads');

        // Upload file
        console.log('📤 Attempting to upload file...');
        try {
            const uploadResponse = await axios.post(
                `${API_URL}/api/uploads/upload`,
                formData,
                {
                    headers: {
                        ...formData.getHeaders(),
                        'Authorization': `Bearer ${token}`
                    },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                }
            );
            console.log('Upload response:', uploadResponse.data);
            
            if (uploadResponse.data.success) {
                console.log('✅ File uploaded successfully');
                console.log('📁 File URL:', uploadResponse.data.url);
            } else {
                console.error('❌ Upload failed:', uploadResponse.data.error);
            }
        } catch (uploadError: any) {
            console.error('❌ Upload error:', {
                message: uploadError.message,
                response: {
                    status: uploadError.response?.status,
                    data: uploadError.response?.data,
                    headers: uploadError.response?.headers
                },
                request: {
                    headers: uploadError.config?.headers,
                    data: uploadError.config?.data
                }
            });
            throw uploadError;
        }
    } catch (error: any) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        }
    } finally {
        // Cleanup
        if (fs.existsSync(TEST_FILE_PATH)) {
            fs.unlinkSync(TEST_FILE_PATH);
            console.log('🧹 Cleaned up test file');
        }
    }
}

testUpload();