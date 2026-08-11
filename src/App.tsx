import { Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import HomePage from "@/pages/HomePage";
import ProjectListPage from "@/pages/ProjectListPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import AboutPalettePage from "@/pages/AboutPalettePage";
import OffTheRecordPage from "@/pages/OffTheRecordPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="project" element={<ProjectListPage />} />
        <Route path="project/:id" element={<ProjectDetailPage />} />
        <Route path="about-palette" element={<AboutPalettePage />} />
        <Route path="off-the-record" element={<OffTheRecordPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
