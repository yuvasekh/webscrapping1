    const express = require('express');
    const multer = require('multer');
    const path = require('path');
    const fs = require('fs');
    const pdfParse = require('pdf-parse');
    const cors = require('cors');
    const mammoth = require('mammoth');
    const axios=require('axios')
    const app = express();
    const PORT = 5000;

    app.use(express.json());
    app.use(cors());
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    const extractTextFromPDF = async (filePath) => {
        const fileBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(fileBuffer);
        return pdfData.text;
    };

    // Function to extract text from a DOCX file
    const extractTextFromDOCX = async (filePath) => {
        const fileBuffer = fs.readFileSync(filePath);
        const docxData = await mammoth.extractRawText({ buffer: fileBuffer });
        return docxData.value;
    };
    // Configure Multer storage
  // Configure Multer storage to keep the original file name
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Use the original filename to save the file
    }
});


    const upload = multer({ storage });

    // Resume Upload API
    app.post('/api/upload-resumes', upload.array('resumes', 10), async (req, res) => {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
    
        try {
            let extractedTexts = [];
    
            for (const file of req.files) {
                const filePath = file.path;
                const pdfData = await pdfParse(fs.readFileSync(filePath));
    
                // Return the file's URL with the correct filename and extracted text
                extractedTexts.push({
                    fileUrl: `http://localhost:${PORT}/uploads/${file.originalname}`, // Use original filename in the URL
                    extractedText: pdfData.text
                });
            }
    
            res.json({
                message: 'Resumes uploaded successfully',
                files: extractedTexts
            });
        } catch (error) {
            console.error('Error processing resumes:', error);
            res.status(500).json({ error: 'Failed to process the resumes' });
        }
    });
    

    // Chat API for resume analysis
    app.post('/api/chat', async (req, res) => {
        const { message, uploadedResumes } = req.body;

        if (!message || !uploadedResumes || uploadedResumes.length === 0) {
            return res.status(400).json({ error: 'Message or uploaded resumes are missing.' });
        }

        try {
            // Process uploaded resumes
            let resumeTexts = [];
            for (let fileUrl of uploadedResumes) {
                const filePath = path.join(__dirname, 'uploads', fileUrl.split('/').pop());

                // Check the file extension and extract the text accordingly
                if (fileUrl.endsWith('.pdf')) {
                    const pdfText = await extractTextFromPDF(filePath);
                    resumeTexts.push(pdfText);
                } else if (fileUrl.endsWith('.docx')) {
                    const docxText = await extractTextFromDOCX(filePath);
                    resumeTexts.push(docxText);
                }
            }

            // Concatenate all extracted texts from resumes
            const resumesContent = resumeTexts.join('\n');

            // Now, process the message with the extracted resume content
            const responseFromModel = await analysis(message, resumesContent);

            res.json({
                message: 'Chat response generated successfully',
                reply: responseFromModel,
            });
        } catch (error) {
            console.error('Error processing chat:', error);
            res.status(500).json({ error: 'Error processing chat message' });
        }
    });


    app.delete('/api/delete-resume', async (req, res) => {
        const fileUrl = req.query.fileUrl;
        if (!fileUrl) {
            return res.status(400).json({ error: 'File URL is required' });
        }

        const filePath = path.join(__dirname, 'uploads', path.basename(fileUrl));

        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                return res.json({ message: 'Resume deleted successfully' });
            } else {
                return res.status(404).json({ error: 'File not found' });
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            return res.status(500).json({ error: 'Failed to delete the resume' });
        }
    });
    // Start server
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });

async function analysis(question,pdfContent) {
    console.log(pdfContent)
    return new Promise((resolve, reject) => {
        let data = JSON.stringify(
            {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {
                              "text": `Resumes List: ${pdfContent} user QUERY:${question}`
                            }]
                    }
                ],
                "systemInstruction": {
                    "role": "user",
                    "parts": [
                      {
                        "text":"You are an ai assistant to analyze resumes list and give the matched resumes  to user  based on user QUERY just give the resume names and why he is matched and his skills  "
                      }
                    ]
                },
                "generationConfig": {
                    "temperature": 1,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 8192,
                    "responseMimeType": "application/json"
                }
            });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyC_yBhja8pLtvI887aE2z32JjA35w4J2Vo',
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        };

        axios.request(config)
            .then((response) => {
                console.log(JSON.stringify(response.data));
                resolve(response.data?.candidates[0]?.content.parts[0]?.text)
            })
            .catch((error) => {
                console.log(error);
                reject(error)
            });
    })





}