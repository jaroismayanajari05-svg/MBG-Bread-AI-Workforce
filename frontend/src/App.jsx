import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';

function App() {
    return (
        <div className="app">
            <Navbar />
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dapur" element={<Leads />} />
                    <Route path="/dapur/:id" element={<LeadDetail />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
