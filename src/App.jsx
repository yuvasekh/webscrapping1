import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Login from './components/Login';
import ScraperAndChat from './components/Scraper';

const App = () => {
    return (
        <Router>
            <Header />
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/scraper" element={<ScraperAndChat />} />
            </Routes>
        </Router>
    );
};

export default App;