import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import Landing from "./pages/Landing";
import PlanCreate from "./pages/PlanCreate";
import PlanDetail from "./pages/PlanDetail";
import PlanEdit from "./pages/PlanEdit";
import UserPlans from "./pages/UserPlans";
import PlanQuizzes from "./pages/PlanQuizzes";
import QuizTake from "./pages/QuizTake";
import { useAuth } from "./hooks/use-auth";
import { Center, Spinner } from "@chakra-ui/react";

const App = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={user ? <Home /> : <Landing />} />
          <Route path="about" element={<Landing />} />
          <Route
            path="settings"
            element={user ? <Settings /> : <Navigate to="/" replace />}
          />
          <Route
            path="plans/new"
            element={user ? <PlanCreate /> : <Navigate to="/" replace />}
          />
          <Route path="plans/:id" element={<PlanDetail />} />
          <Route
            path="plans/:id/edit"
            element={user ? <PlanEdit /> : <Navigate to="/" replace />}
          />
          <Route
            path="plans/:id/quizzes"
            element={user ? <PlanQuizzes /> : <Navigate to="/" replace />}
          />
          <Route
            path="quizzes/:id"
            element={user ? <QuizTake /> : <Navigate to="/" replace />}
          />
          <Route path="users/:userId" element={<UserPlans />} />
          <Route path="home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
