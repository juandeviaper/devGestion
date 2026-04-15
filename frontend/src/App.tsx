import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import { Toaster } from 'react-hot-toast';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';

import ProjectFormPage from './pages/ProjectFormPage';
import StoryFormPage from './pages/StoryFormPage';
import UserStoryDetailPage from './pages/UserStoryDetailPage';
import SearchUsersPage from './pages/SearchUsersPage';
import PublicProfilePage from './pages/PublicProfilePage';
import AdminUsersPage from './pages/AdminUsersPage';


// Project specific pages
import ProjectOverview from './pages/ProjectOverview';
import BacklogPage from './pages/BacklogPage';
import KanbanPage from './pages/KanbanPage';
import SprintsPage from './pages/SprintsPage';
import CalendarPage from './pages/CalendarPage';
import MembersPage from './pages/MembersPage';
import WorkItemsPage from './pages/WorkItemsPage';
import EpicFormPage from './pages/EpicFormPage';
import TaskFormPage from './pages/TaskFormPage';
import BugFormPage from './pages/BugFormPage';
import InvitationsPage from './pages/InvitationsPage';
import SprintFormPage from './pages/SprintFormPage';
import SprintDetailPage from './pages/SprintDetailPage';
import ProjectReportPage from './pages/ProjectReportPage';


const App: React.FC = () => {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Public-only routes */}
        <Route path="/login" element={
          <ProtectedRoute requireAuth={false}>
            <LoginPage />
          </ProtectedRoute>
        } />
        <Route path="/register" element={
          <ProtectedRoute requireAuth={false}>
            <RegisterPage />
          </ProtectedRoute>
        } />

        {/* Private Global routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/project/new" element={
          <ProtectedRoute>
            <ProjectFormPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/search/users" element={
          <ProtectedRoute>
            <SearchUsersPage />
          </ProtectedRoute>
        } />
        <Route path="/profile/:username" element={
          <ProtectedRoute>
            <PublicProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/invitations" element={
          <ProtectedRoute>
            <InvitationsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute>
            <AdminUsersPage />
          </ProtectedRoute>
        } />



        {/* Project Specific routes */}
        <Route path="/project/:projectId" element={
          <ProtectedRoute>
            <ProjectOverview />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId/settings" element={
          <ProtectedRoute>
            <ProjectFormPage />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId/backlog" element={
          <ProtectedRoute>
            <BacklogPage />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId/work-items" element={
          <ProtectedRoute>
            <WorkItemsPage />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId/epics/new" element={
          <ProtectedRoute>
            <EpicFormPage />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId/epics/:epicId/edit" element={
          <ProtectedRoute>
            <EpicFormPage />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId/tasks/new" element={
          <ProtectedRoute>
            <TaskFormPage />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId/tasks/:taskId/edit" element={
          <ProtectedRoute>
            <TaskFormPage />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId/bugs/new" element={
          <ProtectedRoute>
            <BugFormPage />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId/bugs/:bugId/edit" element={
          <ProtectedRoute>
            <BugFormPage />
          </ProtectedRoute>
        } />

        <Route path="/project/:projectId/story/new" element={
          <ProtectedRoute>
            <StoryFormPage />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId/story/:storyId" element={
          <ProtectedRoute>
            <UserStoryDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId/story/:storyId/edit" element={
          <ProtectedRoute>
            <StoryFormPage />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId/kanban" element={
          <ProtectedRoute>
            <KanbanPage />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId/sprints" element={
          <ProtectedRoute>
            <SprintsPage />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId/sprints/new" element={
          <ProtectedRoute>
            <SprintFormPage />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId/sprints/:sprintId" element={
          <ProtectedRoute>
            <SprintDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId/sprints/:sprintId/edit" element={
          <ProtectedRoute>
            <SprintFormPage />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId/calendar" element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId/members" element={
          <ProtectedRoute>
            <MembersPage />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId/reports" element={
          <ProtectedRoute>
            <ProjectReportPage />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
