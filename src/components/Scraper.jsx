import React, { useState } from 'react';
import axios from 'axios';
import ChatInterface from './ChatInterface';

const ResumeAnalysis = () => {
    const [resumes, setResumes] = useState([]);
    const [uploadedResumes, setUploadedResumes] = useState([]);

    const handleResumeUpload = async (e) => {
        e.preventDefault();
        if (resumes.length === 0) return;
        
        const formData = new FormData();
        resumes.forEach((resume) => {
            formData.append('resumes', resume);
        });

        try {
            const response = await axios.post('http://localhost:5000/api/upload-resumes', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadedResumes(response.data.files);
            alert(response.data.message);
        } catch (err) {
            alert('Error uploading resumes.');
        }
    };

    const handleDeleteResume = async (fileUrl) => {
        try {
            await axios.delete(`http://localhost:5000/api/delete-resume?fileUrl=${encodeURIComponent(fileUrl)}`);
            setUploadedResumes(uploadedResumes.filter(resume => resume.fileUrl !== fileUrl));
        } catch (err) {
            alert('Error deleting resume.');
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-100 w-[100vw]">
            <div className="flex-1 p-6 bg-white shadow-lg">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Resume Analysis</h1>
                
                {/* Resume Upload Section */}
                <form onSubmit={handleResumeUpload} className="mt-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Resumes</h2>
                    <input 
                        type="file" 
                        accept=".pdf,.doc,.docx" 
                        multiple
                        onChange={(e) => setResumes(Array.from(e.target.files))} 
                        className="border border-gray-300 px-4 py-2 rounded-md w-full mb-4"
                    />
                    <button
                        type="submit"
                        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        Upload Resumes
                    </button>
                </form>

                {/* Uploaded Resumes List */}
                {uploadedResumes.length > 0 && (
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Uploaded Resumes</h2>
                        <ul className="border border-gray-200 rounded-md p-4">
                            {uploadedResumes.map((resume, index) => (
                                <li key={index} className="flex justify-between items-center mb-2 p-2 bg-gray-100 rounded-md">
                                    <a 
                                        href={resume.fileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-600 hover:underline"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleDeleteResume(resume.fileUrl);
                                        }}
                                    >
                                        {resume.fileUrl.split('/').pop()}
                                    </a>
                                    <button 
                                        onClick={() => handleDeleteResume(resume.fileUrl)}
                                        className="ml-4 bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                                    >
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="flex-1 bg-gray-50">
            <ChatInterface uploadedResumes={uploadedResumes.map(resume => resume.fileUrl)} />

            </div>
        </div>
    );
};

export default ResumeAnalysis;
