import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { FranchiseProvider } from './contexts/FranchiseContext';
import { BranchProvider } from './contexts/BranchContext';
import { BarberProvider } from './contexts/BarberContext';
import { ServiceProvider } from './contexts/ServiceContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <FranchiseProvider>
          <BranchProvider>
            <BarberProvider>
              <ServiceProvider>
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </BrowserRouter>
                <Toaster position="top-right" />
              </ServiceProvider>
            </BarberProvider>
          </BranchProvider>
        </FranchiseProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
