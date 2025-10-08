import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Dashboard, HomeLayout, Landing, Login, Logout, Register, BlogScoring, DomainAnalysis } from "./pages";
import History from "./pages/History";
import BlogEditor from "./pages/BlogEditor";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import AITools from "./pages/AITools";
import AIToolDetail from "./pages/AIToolDetail";
import OnboardingFlow from "./components/OnboardingFlow";
import OnboardingPreview from "./components/OnboardingPreview";
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
        path: "blog",
        element: <Blog />,
      },
      {
        path: "blog/:slug",
        element: <BlogPost />,
      },
      {
        path: "ai-tools",
        element: <AITools />,
      },
      {
        path: "ai-tools/:slug",
        element: <AIToolDetail />,
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
        path: "onboarding-preview",
        element: <OnboardingPreview />,
      },
      {
        path: "domain-analysis",
        element: <DomainAnalysisDashboard />,
      },
      {
        path: "playground",
        element: <SuperUserAnalysisPage />,
      },
      {
        path: "playground/history",
        element: <SuperUserHistoryPage />,
      },
      {
        path: "playground/brand/:brandId",
        element: <SuperUserAnalysisPage />,
      },
      {
        path: "playground/analysis/:analysisId",
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
