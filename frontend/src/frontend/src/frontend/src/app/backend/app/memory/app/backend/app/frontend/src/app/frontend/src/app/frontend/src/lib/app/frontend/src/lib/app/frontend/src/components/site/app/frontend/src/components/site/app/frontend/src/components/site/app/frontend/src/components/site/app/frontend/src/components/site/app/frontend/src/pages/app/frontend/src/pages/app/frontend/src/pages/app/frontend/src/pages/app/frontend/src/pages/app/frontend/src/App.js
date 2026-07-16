"import React from \"react\";
import \"@/App.css\";
import { BrowserRouter, Routes, Route, useLocation } from \"react-router-dom\";
import { AuthProvider } from \"@/lib/auth\";
import { Toaster } from \"sonner\";
import Header from \"@/components/site/Header\";
import Footer from \"@/components/site/Footer\";
import Home from \"@/pages/Home\";
import Catalog from \"@/pages/Catalog\";
import MovieDetails from \"@/pages/MovieDetails\";
import AdminLogin from \"@/pages/AdminLogin\";
import Admin from \"@/pages/Admin\";

function Layout({ children }) {
  const loc = useLocation();
  const hideChrome = false; // keep header on admin too
  return (
    <div className=\"min-h-screen bg-[#050505] text-white\">
      <Header />
      <main>{children}</main>
      {!loc.pathname.startsWith(\"/admin\") && <Footer />}
    </div>
  );
}

function App() {
  return (
    <div className=\"App\">
      <BrowserRouter>
        <AuthProvider>
          <Toaster position=\"top-right\" theme=\"dark\" richColors />
          <Layout>
            <Routes>
              <Route path=\"/\" element={<Home />} />
              <Route path=\"/catalogo\" element={<Catalog />} />
              <Route path=\"/filme/:slug\" element={<MovieDetails />} />
              <Route path=\"/admin/login\" element={<AdminLogin />} />
              <Route path=\"/admin\" element={<Admin />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </div>
