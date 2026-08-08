import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Home from "./components/Home";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Container from "react-bootstrap/Container";
import Protected from "./helpersComponents/Protected";
import AdminRoute from "./helpersComponents/AdminRoute";
import Header from "./components/Header";
import CarouselComponent from "./helpersComponents/Carousel";
import Footer from "./components/Footer";
import AnalyticsConsent from "./helpersComponents/AnalyticsConsent";
import LoadingComponent from "./helpersComponents/LoadingComponent";
import { trackPageView } from "./service/analyticsService";

const CartScreen = lazy(() => import("./components/CartScreen"));
const DetailsPage = lazy(() => import("./components/DetailsPage"));
const Login = lazy(() => import("./components/Login"));
const ShippingInfo = lazy(() => import("./components/ShippingInfo"));
const Register = lazy(() => import("./components/Register"));
const Payment = lazy(() => import("./components/Payment"));
const PreviewOrder = lazy(() => import("./components/PreviewOrder"));
const OrderFinalStep = lazy(() => import("./components/OrderFinalStep"));
const OrderHistory = lazy(() => import("./components/OrderHistory"));
const Profile = lazy(() => import("./components/Profile"));
const SearchPage = lazy(() => import("./components/SearchPage"));
const DashboardPage = lazy(() => import("./components/DashboardPage"));
const CreateItem = lazy(() => import("./components/CreateItem"));
const EditItemPage = lazy(() => import("./components/EditItemPage"));
const AdminManagementPage = lazy(() => import("./components/AdminManagementPage"));
const LegalPage = lazy(() => import("./components/LegalPage"));
const CustomerCarePage = lazy(() => import("./components/CustomerCarePage"));
const AboutPage = lazy(() => import("./components/AboutPage"));

function AppContent() {
  const { pathname, search } = useLocation();
  const showHomepageHero = pathname === "/";

  useEffect(() => {
    trackPageView(`${pathname}${search}`);
  }, [pathname, search]);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="route-announcer" aria-live="polite" aria-atomic="true">{pathname === '/' ? 'Home page' : `${pathname.split('/').filter(Boolean).join(' ')} page`}</div>
      <div className="d-flex flex-column site-container">
        <ToastContainer position="bottom-center" limit={2} autoClose={5000} hideProgressBar closeOnClick pauseOnFocusLoss className="workshop-toast-container" toastClassName="workshop-toast" />
        <Header />
        {showHomepageHero && <CarouselComponent />}
        <main id="main-content" tabIndex="-1">
          <Container className="mt-3 expand">
            <Suspense fallback={<LoadingComponent />}>
            <Routes>
              <Route path="/cart" element={<CartScreen />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Protected><Profile /></Protected>} />
              <Route path="/register" element={<Register />} />
              <Route path="/shipping" element={<ShippingInfo />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/order" element={<PreviewOrder />} />
              <Route path="/order/:id" element={<OrderFinalStep />} />
              <Route path="/orderhistory" element={<Protected><OrderHistory /></Protected>} />
              <Route path="/product/:id/:slug" element={<DetailsPage />} />
              <Route path="/legal/:policy" element={<LegalPage />} />
              <Route path="/help/:topic" element={<CustomerCarePage />} />
              <Route path="/about" element={<AboutPage />} />
              {/* Admin Routes */}
              <Route path="/admin/dashboard"
                element={<AdminRoute>
                  <DashboardPage></DashboardPage>
                </AdminRoute>}
              />
              <Route path="/admin/productlist" element={<AdminRoute><AdminManagementPage key="products" collection="products" /></AdminRoute>} />
              <Route path="/admin/orderlist" element={<AdminRoute><AdminManagementPage key="orders" collection="orders" /></AdminRoute>} />
              <Route path="/admin/userlist" element={<AdminRoute><AdminManagementPage key="users" collection="users" /></AdminRoute>} />
              <Route path="/create"
                element={<AdminRoute>
                  <CreateItem></CreateItem>
                </AdminRoute>}
              />
              <Route path="/:id/editItem/:slug"
                element={<AdminRoute>
                  <EditItemPage></EditItemPage>
                </AdminRoute>}
              />
              <Route path="/" element={<Home />} />
            </Routes>
            </Suspense>
          </Container>
        </main>
      </div>
      <Footer />
      <AnalyticsConsent />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;





