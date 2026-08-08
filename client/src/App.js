import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Home from "./components/Home";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Container from "react-bootstrap/Container";
import CartScreen from "./components/CartScreen";
import DetailsPage from "./components/DetailsPage";
import Login from "./components/Login";
import ShippingInfo from "./components/ShippingInfo";
import Register from "./components/Register";
import Payment from "./components/Payment";
import PreviewOrder from "./components/PreviewOrder";
import OrderFinalStep from "./components/OrderFinalStep";
import OrderHistory from "./components/OrderHistory";
import Profile from "./components/Profile";
import SearchPage from "./components/SearchPage";
import Protected from "./helpersComponents/Protected";
import DashboardPage from "./components/DashboardPage";
import AdminRoute from "./helpersComponents/AdminRoute";
import Header from "./components/Header";
import CreateItem from "./components/CreateItem";
import EditItemPage from "./components/EditItemPage";
import CarouselComponent from "./helpersComponents/Carousel";
import Footer from "./components/Footer";
import AdminManagementPage from "./components/AdminManagementPage";
import AnalyticsConsent from "./helpersComponents/AnalyticsConsent";
import { trackPageView } from "./service/analyticsService";

function AppContent() {
  const { pathname, search } = useLocation();
  const showHomepageHero = pathname === "/";

  useEffect(() => {
    trackPageView(`${pathname}${search}`);
  }, [pathname, search]);

  return (
    <>
      <div className="d-flex flex-column site-container">
        <ToastContainer position="bottom-center" limit={2} autoClose={5000} hideProgressBar closeOnClick pauseOnFocusLoss className="workshop-toast-container" toastClassName="workshop-toast" />
        <Header />
        {showHomepageHero && <CarouselComponent />}
        <main>
          <Container className="mt-3 expand">
            <Routes>
              <Route path="/cart" element={<CartScreen />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Protected><Profile /></Protected>} />
              <Route path="/register" element={<Register />} />
              <Route path="/shipping" element={<Protected><ShippingInfo /></Protected>} />
              <Route path="/payment" element={<Protected><Payment /></Protected>} />
              <Route path="/order" element={<Protected><PreviewOrder /></Protected>} />
              <Route path="/order/:id" element={<Protected><OrderFinalStep /></Protected>} />
              <Route path="/orderhistory" element={<Protected><OrderHistory /></Protected>} />
              <Route path="/product/:id/:slug" element={<DetailsPage />} />
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





