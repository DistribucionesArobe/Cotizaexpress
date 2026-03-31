import { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').trim() || 'https://api.cotizaexpress.com';
const API = `${BACKEND_URL}/api`;

const ADMIN_EMAILS = ['ealejandro.robledo@gmail.com'];

function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className={`rounded-xl p-4 ${colors[color] || colors.blue}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm font-medium opacity-80">{label}</div>
      {sub && <div className="text-xs mt-1 opacity-60">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    found: { bg: 'bg-emerald-100 text-emerald-800', label: 'found' },
    ambiguous: { bg: 'bg-amber-100 text-amber-800', label: 'ambiguous' },
    not_found: { bg: 'bg-red-100 text-red-800', label: 'not_found' },
  };
  const s = map[status] || { bg: 'bg-gray-100 text-gray-800', label: status };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.bg}`}>{s.label}</span>;
}

export default function AdminSearchStats() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [topErrors, setTopErrors] = useState([]);
  const [topSearches, setTopSearches] = useState([]);
  const [byCompany, setByCompany] = useState([]);
  const [jerga, setJerga] = useState([]);
  const [jergaTotal, setJergaTotal] = useState(0);
  const [queryLog, setQueryLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  // New jerga form
  const [newJerga, setNewJerga] = useState({ termino_original: '', termino_normalizado: '' });

  const email = user?.usuario?.email || user?.email || '';
  const esAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const opts = { withCredentials: true };
      const [ovRes, errRes, srcRes, compRes, jrgRes, logRes] = await Promise.allSettled([
        axios.get(`${API}/admin/stats/overview`, opts),
        axios.get(`${API}/admin/stats/top-errors?days=${days}`, opts),
        axios.get(`${API}/admin/stats/top-searches?days=${days}`, opts),
        axios.get(`${API}/admin/stats/by-company?days=${days}`, opts),
        axios.get(`${API}/admin/jerga?per_page=100`, opts),
        axios.get(`${API}/admin/query-log?days=1&limit=50`, opts),
      ]);
      if (ovRes.status === 'fulfilled') setOverview(ovRes.value.data.stats);
      if (errRes.status === 'fulfilled') setTopErrors(errRes.value.data.errors || []);
      if (srcRes.status === 'fulfilled') setTopSearches(srcRes.value.data.searches || []);
      if (compRes.status === 'fulfilled') setByCompany(compRes.value.data.companies || []);
      if (jrgRes.status === 'fulfilled') {
        setJerga(jrgRes.value.data.jerga || []);
        setJergaTotal(jrgRes.value.data.total || 0);
      }
      if (logRes.status === 'fulfilled') setQueryLog(logRes.value.data.events || []);
    } catch (e) {
      toast.error('Error cargando datos admin');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    if (esAdmin) fetchAll();
  }, [esAdmin, fetchAll]);

  const handleCreateJerga = async () => {
    if (!newJerga.termino_original || !newJerga.termino_normalizado) return;
    try {
      await axios.post(`${API}/admin/jerga`, newJerga, { withCredentials: true });
      toast.success(`Jerga creada: "${newJerga.termino_original}" → "${newJerga.termino_normalizado}"`);
      setNewJerga({ termino_original: '', termino_normalizado: '' });
      fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error creando jerga');
    }
  };

  const handleToggleProtect = async (term, currentProtected) => {
    try {
      await axios.put(`${API}/admin/jerga`, {
        termino_original: term,
        is_protected: !currentProtected,
      }, { withCredentials: true });
      toast.success(`${term}: ${!currentProtected ? 'protegido' : 'desprotegido'}`);
      fetchAll();
    } catch (e) {
      toast.error('Error actualizando jerga');
    }
  };

  const handleDeleteJerga = async (term) => {
    if (!window.confirm(`¿Eliminar "${term}" de la jerga global?`)) return;
    try {
      await axios.delete(`${API}/admin/jerga/${encodeURIComponent(term)}`, { withCredentials: true });
      toast.success(`Eliminado: "${term}"`);
      fetchAll();
    } catch (e) {
      toast.error('Error eliminando jerga');
    }
  };

  if (!esAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'errors', label: `Errores (${topErrors.length})` },
    { id: 'searches', label: 'Top Búsquedas' },
    { id: 'companies', label: 'Por Empresa' },
    { id: 'jerga', label: `Jerga (${jergaTotal})` },
    { id: 'log', label: 'Log Reciente' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Motor de Búsqueda</h2>
          <p className="text-slate-500 text-sm">query_events + jerga global — God Mode</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="border rounded-lg px-3 py-1.5 text-sm"
          >
            <option value={1}>Hoy</option>
            <option value={7}>7 días</option>
            <option value={30}>30 días</option>
            <option value={90}>90 días</option>
          </select>
          <button
            onClick={fetchAll}
            className="px-3 py-1.5 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-700"
          >
            Refrescar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {tab === 'overview' && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Empresas Activas" value={overview.total_companies} color="blue" />
            <StatCard label="Productos" value={overview.total_products} color="purple" />
            <StatCard label="Conversaciones" value={overview.total_conversations} color="green" />
            <StatCard label="Búsquedas Hoy" value={overview.queries_today} color="amber" />
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-lg mb-4">Búsquedas (últimos 7 días)</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <div className="text-3xl font-bold text-slate-900">{overview.queries_7d.total}</div>
                <div className="text-sm text-slate-500">Total</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-emerald-600">{overview.queries_7d.found}</div>
                <div className="text-sm text-slate-500">Encontrado</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-600">{overview.queries_7d.ambiguous}</div>
                <div className="text-sm text-slate-500">Ambiguo</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600">{overview.queries_7d.not_found}</div>
                <div className="text-sm text-slate-500">No Encontrado</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">{overview.queries_7d.success_rate}%</div>
                <div className="text-sm text-slate-500">Tasa Éxito</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Jerga Global" value={overview.total_jerga} sub={`${overview.auto_promoted_jerga} auto-promovidos`} color="purple" />
            <StatCard label="Tasa de Éxito" value={`${overview.queries_7d.success_rate}%`} sub="últimos 7 días" color="green" />
          </div>
        </div>
      )}

      {/* ═══ TOP ERRORS ═══ */}
      {tab === 'errors' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b bg-red-50">
            <h3 className="font-semibold text-red-900">Búsquedas que fallan — prioridad para corregir</h3>
          </div>
          {topErrors.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Sin errores en los últimos {days} días</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3 font-medium">Texto Original</th>
                    <th className="text-left p-3 font-medium">Normalizado</th>
                    <th className="text-left p-3 font-medium">Fuente</th>
                    <th className="text-right p-3 font-medium">Veces</th>
                    <th className="text-left p-3 font-medium">Última vez</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topErrors.map((e, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-red-700">{e.original_text}</td>
                      <td className="p-3 text-slate-500">{e.normalized_text || '—'}</td>
                      <td className="p-3 text-slate-400 text-xs">{e.normalization_source}</td>
                      <td className="p-3 text-right font-bold">{e.count}</td>
                      <td className="p-3 text-slate-400 text-xs">
                        {e.last_seen ? new Date(e.last_seen).toLocaleDateString('es-MX') : '—'}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            setNewJerga({ termino_original: e.original_text, termino_normalizado: '' });
                            setTab('jerga');
                          }}
                          className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200"
                        >
                          + Crear Jerga
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ TOP SEARCHES ═══ */}
      {tab === 'searches' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b bg-emerald-50">
            <h3 className="font-semibold text-emerald-900">Top búsquedas exitosas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 font-medium">Texto</th>
                  <th className="text-left p-3 font-medium">Normalizado</th>
                  <th className="text-left p-3 font-medium">Producto</th>
                  <th className="text-left p-3 font-medium">Paso</th>
                  <th className="text-right p-3 font-medium">Veces</th>
                  <th className="text-right p-3 font-medium">Confianza</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {topSearches.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-3 font-mono">{s.original_text}</td>
                    <td className="p-3 text-slate-500">{s.normalized_text || '—'}</td>
                    <td className="p-3 text-emerald-700 font-medium">{s.matched_item}</td>
                    <td className="p-3 text-xs text-slate-400">{s.paso}</td>
                    <td className="p-3 text-right font-bold">{s.count}</td>
                    <td className="p-3 text-right">{s.avg_confidence ? `${(s.avg_confidence * 100).toFixed(0)}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ BY COMPANY ═══ */}
      {tab === 'companies' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Uso por Empresa</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 font-medium">Empresa</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-right p-3 font-medium">Found</th>
                  <th className="text-right p-3 font-medium">Ambiguous</th>
                  <th className="text-right p-3 font-medium">Not Found</th>
                  <th className="text-right p-3 font-medium">Éxito</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {byCompany.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 text-right">{c.total}</td>
                    <td className="p-3 text-right text-emerald-600">{c.found}</td>
                    <td className="p-3 text-right text-amber-600">{c.ambiguous}</td>
                    <td className="p-3 text-right text-red-600">{c.not_found}</td>
                    <td className="p-3 text-right font-bold">{c.success_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ JERGA ═══ */}
      {tab === 'jerga' && (
        <div className="space-y-4">
          {/* Create new */}
          <div className="bg-white rounded-xl border p-4">
            <h4 className="font-semibold mb-3">Agregar Jerga Manual</h4>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-xs text-slate-500">Término original</label>
                <input
                  type="text"
                  value={newJerga.termino_original}
                  onChange={e => setNewJerga(p => ({ ...p, termino_original: e.target.value }))}
                  placeholder="ej: cargadoras"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="text-slate-400 pb-2">→</div>
              <div className="flex-1">
                <label className="text-xs text-slate-500">Normalizado a</label>
                <input
                  type="text"
                  value={newJerga.termino_normalizado}
                  onChange={e => setNewJerga(p => ({ ...p, termino_normalizado: e.target.value }))}
                  placeholder="ej: canaleta de carga"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={handleCreateJerga}
                disabled={!newJerga.termino_original || !newJerga.termino_normalizado}
                className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-40"
              >
                Crear
              </button>
            </div>
          </div>

          {/* List */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="p-4 border-b bg-purple-50">
              <h3 className="font-semibold text-purple-900">Diccionario de Jerga Global ({jergaTotal})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3 font-medium">Original</th>
                    <th className="text-left p-3 font-medium">Normalizado</th>
                    <th className="text-center p-3 font-medium">Protegido</th>
                    <th className="text-right p-3 font-medium">Usos</th>
                    <th className="text-right p-3 font-medium">Éxitos</th>
                    <th className="text-right p-3 font-medium">Confianza</th>
                    <th className="text-left p-3 font-medium">Fuente</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {jerga.map((j, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-mono">{j.termino_original}</td>
                      <td className="p-3 text-purple-700 font-medium">{j.termino_normalizado}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleProtect(j.termino_original, j.is_protected)}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            j.is_protected
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-400 hover:bg-amber-100 hover:text-amber-700'
                          }`}
                        >
                          {j.is_protected ? 'Si' : 'No'}
                        </button>
                      </td>
                      <td className="p-3 text-right">{j.usage_count}</td>
                      <td className="p-3 text-right">{j.success_count}</td>
                      <td className="p-3 text-right">
                        <span className={`font-medium ${
                          j.confidence >= 80 ? 'text-emerald-600' :
                          j.confidence >= 50 ? 'text-amber-600' : 'text-red-500'
                        }`}>
                          {j.confidence}%
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-400">{j.source}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleDeleteJerga(j.termino_original)}
                          className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ QUERY LOG ═══ */}
      {tab === 'log' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Log de búsquedas (últimas 24h)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-3 font-medium">Hora</th>
                  <th className="text-left p-3 font-medium">Empresa</th>
                  <th className="text-left p-3 font-medium">Texto</th>
                  <th className="text-left p-3 font-medium">Normalizado</th>
                  <th className="text-left p-3 font-medium">Producto</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Paso</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {queryLog.map((e, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-3 text-xs text-slate-400 whitespace-nowrap">
                      {e.created_at ? new Date(e.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="p-3 text-xs">{e.company || '—'}</td>
                    <td className="p-3 font-mono">{e.original_text}</td>
                    <td className="p-3 text-slate-500">{e.normalized_text || '—'}</td>
                    <td className="p-3 text-emerald-700">{e.matched_item || '—'}</td>
                    <td className="p-3 text-center"><StatusBadge status={e.status} /></td>
                    <td className="p-3 text-xs text-slate-400">{e.paso}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
