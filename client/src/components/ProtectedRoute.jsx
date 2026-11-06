import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-6">Cargando...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm mt-8">
        <h2 className="font-bold text-lg">Acceso restringido</h2>
        <p className="text-slate-600 mt-2">No tienes permisos para ver esta sección. Tu rol es {user.role}.</p>
      </div>
    );
  }
  return children;
}
