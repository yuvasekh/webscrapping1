import React, { useState } from 'react';
import axios from 'axios';

const ChatInterface = ({ uploadedResumes }) => {
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/chat', { message, uploadedResumes });
            setChatHistory([...chatHistory, { user: message, bot: response.data.reply }]);
            setMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
        }
    };

    return (
        <div className="flex flex-col h-screen/85 w-screen/47">
            <div className="flex-1 overflow-y-auto mb-6 p-4 bg-white rounded-lg shadow-inner">
                {chatHistory.map((chat, index) => (
                    <div key={index} className="mb-4">
                        <p className="text-sm text-gray-600"><strong>You:</strong> {chat.user}</p>
                        <p className="text-sm text-gray-800"><strong>Bot:</strong> {chat.bot}</p>
                    </div>
                ))}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                    type="text"
                    placeholder="Type your message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default ChatInterface;
