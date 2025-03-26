const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');
const cors = require("cors");
const pdfParse = require('pdf-parse');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
const PORT = 5000;
const visitedURLs = new Set();
const blockedDomains = ['facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com', 'youtube.com', 't.me', 'whatsapp.com'];
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.use(express.json());
app.use(cors());

const MAX_DEPTH = 2; // Restrict crawling depth

// Function to extract meaningful text from a page
async function scrapeEntirePage(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const contentType = response.headers['content-type'];

        if (contentType && contentType.includes('text')) {
            const decodedContent = response.data.toString('utf8');
            const $ = cheerio.load(decodedContent);
            let content = `\n\n===== ${url} =====\n\n`;

            $('h1, h2, h3, h4, h5, h6, p, li').each((i, elem) => {
                let text = $(elem).text().trim();
                if (text.length > 10) {
                    content += text + '\n\n';
                }
            });

            console.log(`✅ Extracted clean text from: ${url}`);
            return content;
        } else {
            console.warn(`⚠️ Skipping non-text content at ${url}`);
            return '';
        }
    } catch (error) {
        console.error(`❌ Error extracting text from ${url}:`, error.message);
        return '';
    }
}

// Function to extract internal links
async function extractLinks(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        let links = [];

        $('a').each((i, elem) => {
            const link = $(elem).attr('href');
            if (link && !link.startsWith('#')) {
                const absoluteUrl = link.startsWith('http') ? link : new URL(link, url).href;
                if (!blockedDomains.some(domain => absoluteUrl.includes(domain))) {
                    links.push(absoluteUrl);
                }
            }
        });
        return [...new Set(links)];
    } catch (error) {
        console.error(`❌ Error extracting links from ${url}:`, error.message);
        return [];
    }
}

// Function to save text content to a PDF
function saveTextToPDF(content, fileName) {
    const publicDir = path.join(__dirname, 'public');

    // Ensure the 'public' directory exists
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
    }

    const filePath = path.join(publicDir, fileName);
    const doc = new PDFDocument({ margin: 30 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    
    doc.fontSize(18).text('Extracted Website Content', { align: 'center' });
    doc.moveDown(2);

    content.split('\n').forEach(line => {
        if (line.trim()) {
            doc.fontSize(12).text(line, { align: 'left' });
        }
    });

    doc.end();
    return filePath;
}


// Crawl function with depth restriction
async function crawlPage(url, depth = 0) {
    if (visitedURLs.has(url) || depth > MAX_DEPTH) return ''; // Stop if max depth reached
    visitedURLs.add(url);

    console.log(`🔍 Crawling (Depth: ${depth}): ${url}`);

    const pageText = await scrapeEntirePage(url);
    const links = await extractLinks(url);

    if (depth < MAX_DEPTH) {
        const subLinkTexts = await Promise.all(
            links.map(async (link) => {
                await delay(500);
                return await crawlPage(link, depth + 1); // Increase depth
            })
        );
        return pageText + subLinkTexts.join('');
    }

    return pageText;
}

// API Endpoint to scrape and generate PDF
app.post('/api/scrape', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL parameter is required' });

    visitedURLs.clear();
    const textData = await crawlPage(url, 0); // Start at depth 0
    const pdfFileName = `scraped_content_${Date.now()}.pdf`;
    const filePath = saveTextToPDF(textData, pdfFileName);
    res.json({ 
        success: true, 
        downloadURL: `http://localhost:5000/download/${pdfFileName}` // Change URL if deployed
    });
    // res.json({ message: 'Scraping completed', downloadURL: `/download/${pdfFileName}` });
});

// User Authentication (Sample JSON File-Based)
const usersFilePath = path.join(__dirname, "utils/users.json");

// Function to read JSON users
const readJSON = (filePath) => {
    try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
        console.error(`Error reading file: ${filePath}`, error);
        return [];
    }
};

// Login API
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const users = readJSON(usersFilePath);

    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    res.json({ message: "Login successful", role: user.role, userId: user.id, username: user.name, userEmail: user.email });
});

// File Download API
app.get('/download/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'public', filename);

    if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline'); // This allows it to be viewed in iframe
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});
app.post('/api/chat', async (req, res) => {
    const { message, pdfUrl } = req.body;

    if (!pdfUrl) {
        return res.status(400).json({ error: "PDF URL is required" });
    }

    try {
        // Fetch the PDF file from the given URL
        const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });

        // Convert PDF Buffer into text
        const pdfData = await pdfParse(response.data);
        const pdfText = pdfData.text;

// console.log(pdfText)
      var llmresponse=await analysis(message,pdfText)
console.log(JSON.parse(llmresponse))
let final=JSON.parse(llmresponse)
        res.json({reply: final.answer});

    } catch (error) {
        console.error('Error processing PDF:', error.message);
        res.status(500).json({ error: 'Failed to process the PDF.' });
    }
});

// Start Server
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
                              "text": `PDF Content ${pdfContent} user QUERY:${question}`
                            }]
                    }
                ],
                "systemInstruction": {
                    "role": "user",
                    "parts": [
                      {
                        "text":"You are an ai assistant to analyze the given Input PDF Content and answer the user query and your reponse should be in the below format {answer:answer} Note:check the pdf content carefully"
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