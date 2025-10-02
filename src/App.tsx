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
import FranchisesPage from './pages/FranchisesPage';
import FranchiseFormPage from './pages/FranchiseFormPage';
import BranchesPage from './pages/BranchesPage';
import BranchFormPage from './pages/BranchFormPage';
import BarbersPage from './pages/BarbersPage';
import BarberFormPage from './pages/BarberFormPage';
import ServicesPage from './pages/ServicesPage';
import ServiceFormPage from './pages/ServiceFormPage';

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

                    {/* Franchises */}
                    <Route
                      path="/franchises"
                      element={
                        <ProtectedRoute>
                          <FranchisesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/franchises/new"
                      element={
                        <ProtectedRoute>
                          <FranchiseFormPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/franchises/:id/edit"
                      element={
                        <ProtectedRoute>
                          <FranchiseFormPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Branches */}
                    <Route
                      path="/branches"
                      element={
                        <ProtectedRoute>
                          <BranchesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/branches/new"
                      element={
                        <ProtectedRoute>
                          <BranchFormPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/branches/:id/edit"
                      element={
                        <ProtectedRoute>
                          <BranchFormPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Barbers */}
                    <Route
                      path="/barbers"
                      element={
                        <ProtectedRoute>
                          <BarbersPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/barbers/new"
                      element={
                        <ProtectedRoute>
                          <BarberFormPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/barbers/:id/edit"
                      element={
                        <ProtectedRoute>
                          <BarberFormPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Services */}
                    <Route
                      path="/services"
                      element={
                        <ProtectedRoute>
                          <ServicesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/services/new"
                      element={
                        <ProtectedRoute>
                          <ServiceFormPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/services/:id/edit"
                      element={
                        <ProtectedRoute>
                          <ServiceFormPage />
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
