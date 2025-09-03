import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Dashboard, HomeLayout, Landing, Login, Logout, Register, BlogScoring, DomainAnalysis } from "./pages";
import History from "./pages/History";
import BlogEditor from "./pages/BlogEditor";
import OnboardingFlow from "./components/OnboardingFlow";
import DomainAnalysisDashboard from "./pages/DomainAnalysisDashboard";
import SuperUserAnalysisPage from "./pages/SuperUserAnalysisPage";
import SuperUserHistoryPage from "./pages/SuperUserHistoryPage";
import SuperUserAnalysisViewPage from "./pages/SuperUserAnalysisViewPage";
import { ToastContainer, toast } from 'react-toastify';
import ErrorBoundary from './components/ErrorBoundary';


const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeLayout />,
    children: [
      {
        index: true,
        element: <Landing />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "logout",
        element: <Logout />,
      },
      {
        path: "history",
        element: <History />,
      },
      {
        path: "brand/:brandId/blog-scoring",
        element: <BlogScoring />,
      },
      {
        path: "editor/:postId",
        element: <BlogEditor />,
      },
      {
        path: "onboarding",
        element: <OnboardingFlow />,
      },
      {
        path: "domain-analysis",
        element: <DomainAnalysisDashboard />,
      },
      {
        path: "super-user-analysis",
        element: <SuperUserAnalysisPage />,
      },
      {
        path: "super-user-history",
        element: <SuperUserHistoryPage />,
      },
      {
        path: "super-user-analysis/:brandId",
        element: <SuperUserAnalysisPage />,
      },
      {
        path: "super-user-analysis/view/:analysisId",
        element: <SuperUserAnalysisViewPage />,
      }
    ],
  },
]);

function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <ToastContainer 
        position='top-center'
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </ErrorBoundary>
  );
}

export default App;
