import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import AssessmentChat from './pages/AssessmentChat';
import ResultsPage from './pages/ResultsPage';
import RoadmapPage from './pages/RoadmapPage';
import MythBusterPage from './pages/MythBusterPage';
import ParentPortal from './pages/ParentPortal';
import StudentCareerPage from './pages/StudentCareerPage';
import SimulationPage from './pages/SimulationPage';
import AuthPage from './pages/AuthPage';
import ModeSelection from './pages/ModeSelection';
import StudentDashboard from './pages/StudentDashboard';
import ParentLogin from './pages/ParentLogin';
import ParentDashboard from './pages/ParentDashboard';

import { LanguageProvider } from './context/LanguageContext';

const AppContent = () => {
  const location = useLocation();
  const isPlainPage = location.pathname === '/' || location.pathname === '/auth' || location.pathname === '/parent-login';
  
  return (
    <div className={`App min-h-screen bg-core text-white font-sans selection:bg-primary-neon/30 ${isPlainPage ? '' : 'pl-[72px]'}`}>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/mode-selection" element={<ModeSelection />} />
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/assessment" element={<AssessmentChat />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/career" element={<StudentCareerPage />} />
        <Route path="/myths" element={<MythBusterPage />} />
        <Route path="/simulation/:careerId" element={<SimulationPage />} />
        <Route path="/parent/:id" element={<ParentPortal />} />
        <Route path="/parent-login" element={<ParentLogin />} />
        <Route path="/parent-dashboard" element={<ParentDashboard />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <AppContent />
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;

