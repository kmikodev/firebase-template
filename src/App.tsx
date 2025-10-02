import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { FranchiseProvider } from './contexts/FranchiseContext';
import { BranchProvider } from './contexts/BranchContext';
import { BarberProvider } from './contexts/BarberContext';
import { ServiceProvider } from './contexts/ServiceContext';
import { QueueProvider } from './contexts/QueueContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
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
import QueuePage from './pages/QueuePage';
import TakeTicketPage from './pages/TakeTicketPage';
import ClientQueue from './pages/ClientQueue';
import BarberQueue from './pages/BarberQueue';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <FranchiseProvider>
          <BranchProvider>
            <BarberProvider>
              <ServiceProvider>
                <QueueProvider>
                  <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <Dashboard />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* Franchises */}
                    <Route
                      path="/franchises"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <FranchisesPage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/franchises/new"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <FranchiseFormPage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/franchises/:id/edit"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <FranchiseFormPage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* Branches */}
                    <Route
                      path="/branches"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <BranchesPage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/branches/new"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <BranchFormPage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/branches/:id/edit"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <BranchFormPage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* Barbers */}
                    <Route
                      path="/barbers"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <BarbersPage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/barbers/new"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <BarberFormPage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/barbers/:id/edit"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <BarberFormPage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* Services */}
                    <Route
                      path="/services"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <ServicesPage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/services/new"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <ServiceFormPage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/services/:id/edit"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <ServiceFormPage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* Queue */}
                    <Route
                      path="/queue"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <QueuePage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/take-ticket"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <TakeTicketPage />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/client-queue"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <ClientQueue />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/barber-queue"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <BarberQueue />
                          </Layout>
                        </ProtectedRoute>
                      }
                    />

                    {/* 404 Not Found */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </BrowserRouter>
                  <Toaster position="top-right" />
                </QueueProvider>
              </ServiceProvider>
            </BarberProvider>
          </BranchProvider>
        </FranchiseProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
