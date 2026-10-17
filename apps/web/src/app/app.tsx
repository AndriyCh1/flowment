import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ExerciseListPage } from '../modules/exercises';
import { ProjectListPage, ProjectPage } from '../modules/projects';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/projects" replace />} />
      <Route path="/projects" element={<ProjectListPage />} />
      <Route path="/projects/:projectId" element={<ProjectPage />} />
      <Route path="/exercises" element={<ExerciseListPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/** Needs a QueryClientProvider above it (see main.tsx). */
export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
