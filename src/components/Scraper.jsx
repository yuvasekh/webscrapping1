import React, { useState } from 'react';
import axios from 'axios';
import PDFViewer from './PDFViewer';
import ChatInterface from './ChatInterface';

const ScraperAndChat = () => {
    const [url, setUrl] = useState('');
    const [pdfUrl, setPdfUrl] = useState('');
    const [error, setError] = useState('');
    const [scrapedUrl, setScrapedUrl] = useState(''); // Store the scraped URL

    const handleScrape = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/scrape', { url });
            if (response.data.success) {
                setPdfUrl(response.data.downloadURL); // Set the PDF URL for preview
                setScrapedUrl(url); // Save the entered URL
                setError('');
            } else {
                setError('Failed to scrape the website.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-100 w-[100vw]">
            {/* Left Side: Scraper and PDF Viewer */}
            <div className="flex-1 p-6 bg-white shadow-lg">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Web Scraper</h1>
                <form onSubmit={handleScrape} className="mb-6">
                    <div className="flex">
                        <input
                            type="url"
                            placeholder="Enter URL"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Scrape
                        </button>
                    </div>
                </form>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                {pdfUrl && (
                    <div className="mt-4 p-4 border rounded-md bg-gray-50">
                        <p className="text-sm text-gray-600">
                            <strong>Scraped URL:</strong> 
                            <a href={scrapedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                {scrapedUrl}
                            </a>
                        </p>
                        <iframe 
                src={pdfUrl} 
                className="w-full h-[500px] border rounded-md"
                title="Scraped PDF"
            />
                    </div>
                )}
            </div>

            {/* Right Side: Chat Interface */}
            <div className="flex-1 bg-gray-50">
          
                <ChatInterface pdfUrl={pdfUrl} />
            </div>
        </div>
    );
};

export default ScraperAndChat;
