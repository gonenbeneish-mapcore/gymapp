import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { TabBar } from "./ui/TabBar";
import { TrainPage } from "./pages/TrainPage";
import { ExercisesPage } from "./pages/ExercisesPage";
import { ExerciseDetailPage } from "./pages/ExerciseDetailPage";
import { WorkoutEditorPage } from "./pages/WorkoutEditorPage";
import { MeasurePage } from "./pages/MeasurePage";
import { HistoryPage } from "./pages/HistoryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { DesignPage } from "./pages/DesignPage";
import { SessionPage } from "./pages/SessionPage";
import { SummaryPage } from "./pages/SummaryPage";

function TabLayout() {
  return (
    <>
      <Outlet />
      <TabBar />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<TabLayout />}>
        <Route path="/train" element={<TrainPage />} />
        <Route path="/exercises" element={<ExercisesPage />} />
        <Route path="/measure" element={<MeasurePage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Route>
      <Route path="/exercises/:id" element={<ExerciseDetailPage />} />
      <Route path="/workouts/:id" element={<WorkoutEditorPage />} />
      <Route path="/session" element={<SessionPage />} />
      <Route path="/session/:id/done" element={<SummaryPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/design" element={<DesignPage />} />
      <Route path="*" element={<Navigate to="/train" replace />} />
    </Routes>
  );
}
