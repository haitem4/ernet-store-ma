// ============================================================
// ERNET STORE — Application principale (routes)
// ============================================================
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Catalogue from './pages/Catalogue.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Compte from './pages/Compte.jsx';
import Panier from './pages/Panier.jsx';
import Marques from './pages/Marques.jsx';
import Promotions from './pages/Promotions.jsx';
import Blog from './pages/Blog.jsx';
import EspacePro from './pages/EspacePro.jsx';
import NotFound from './pages/NotFound.jsx';
// --- Routes Admin ---
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminImportPage from './pages/admin/ImportPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/catalogue" element={<Catalogue />} />
        <Route path="/produit/:slug" element={<ProductDetail />} />
        <Route path="/marques" element={<Marques />} />
        <Route path="/promotions" element={<Promotions />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/espace-pro" element={<EspacePro />} />
        <Route path="/panier" element={<Panier />} />
        <Route path="/compte" element={<Compte />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* --- Routes protégées pour l'administration --- */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin/import" element={<AdminImportPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
