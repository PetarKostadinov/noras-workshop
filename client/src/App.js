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

function AppContent() {
  const { pathname } = useLocation();
  const showHomepageHero = pathname === "/";

  return (
    <>
      <div className="d-flex flex-column site-container">
        <ToastContainer position="bottom-center" limit={1} />
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





