import React, { useState, useEffect } from 'react';
import { ClientProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  X,
  FileSpreadsheet,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Send,
  HelpCircle,
  AlertCircle,
  Table,
  Code2,
  Save,
  Download,
  CheckCircle2,
  ShieldCheck,
  Globe,
  RotateCcw,
  Lock,
  AlertTriangle,
  KeyRound,
  Share2,
} from 'lucide-react';
import {
  GOOGLE_APPS_SCRIPT_CODE,
  GOOGLE_SHEET_COLUMNS,
  getSavedGoogleSheetsUrl,
  saveGoogleSheetsUrl,
  syncClientsToGoogleSheets,
  saveSingleClientToGoogleSheets,
  fetchClientsFromGoogleSheets,
  testGoogleSheetsConnection,
  SyncResponse,
  VERCEL_ENV_GOOGLE_SHEETS_URL,
  hasVercelEnvGoogleSheetsUrl,
  resetGoogleSheetsUrlToEnv,
  checkServerSheetsStatus,
  ServerStatusResponse,
} from '../utils/googleSheets';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientProfile[];
  activeClient?: ClientProfile;
  onLoadClients?: (loadedClients: ClientProfile[]) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  clients,
  activeClient,
  onLoadClients,
}) => {
  const { language } = useLanguage();
  const { isDark } = useTheme();

  const [url, setUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'google_api' | 'setup' | 'sync' | 'columns' | 'code'>('google_api');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedKeyVar, setCopiedKeyVar] = useState(false);
  const [copiedSheetIdVar, setCopiedSheetIdVar] = useState(false);
  const [copiedEmailVar, setCopiedEmailVar] = useState(false);
  const [copiedPrivateKeyVar, setCopiedPrivateKeyVar] = useState(false);
  const [copiedProjectIdVar, setCopiedProjectIdVar] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [savingSingle, setSavingSingle] = useState(false);
  const [singleResult, setSingleResult] = useState<{ success: boolean; message: string } | null>(null);

  const [loadingClients, setLoadingClients] = useState(false);
  const [loadResult, setLoadResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  const [copiedVarName, setCopiedVarName] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatusResponse | null>(null);

  const isEnvConfigured = Boolean(serverStatus?.configured || hasVercelEnvGoogleSheetsUrl());

  useEffect(() => {
    if (isOpen) {
      const saved = getSavedGoogleSheetsUrl();
      setUrl(saved);
      setTestResult(null);
      setSyncResult(null);
      setSyncError(null);
      setSingleResult(null);
      setLoadResult(null);

      checkServerSheetsStatus()
        .then((st) => {
          setServerStatus(st);
          if (st.configured || saved) {
            setActiveTab('sync');
          } else {
            setActiveTab('google_api');
          }
        })
        .catch(() => {
          if (saved) setActiveTab('sync');
          else setActiveTab('google_api');
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyVarName = () => {
    navigator.clipboard.writeText('GOOGLE_SHEETS_WEBAPP_URL');
    setCopiedVarName(true);
    setTimeout(() => setCopiedVarName(false), 2500);
  };

  const handleCopyCurrentUrl = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  const handleResetToVercelEnv = () => {
    const envUrl = resetGoogleSheetsUrlToEnv();
    setUrl(envUrl);
    setTestResult({
      success: true,
      message:
        language === 'en'
          ? 'Reverted to URL defined in Vercel environment'
          : 'Restablecido a la URL configurada en la variable de entorno de Vercel',
    });
  };

  const handleSaveUrl = () => {
    saveGoogleSheetsUrl(url);
  };

  const handleTestConnection = async () => {
    if (!url && !serverStatus?.configured) {
      setTestResult({
        success: false,
        message:
          language === 'en'
            ? 'Please enter a valid URL or configure GOOGLE_SHEETS_WEBAPP_URL in Vercel first.'
            : 'Por favor ingresa primero la URL o configura GOOGLE_SHEETS_WEBAPP_URL en Vercel.',
      });
      return;
    }
    setTestingConnection(true);
    setTestResult(null);
    try {
      const [res, freshStatus] = await Promise.all([
        testGoogleSheetsConnection(url || undefined),
        checkServerSheetsStatus(),
      ]);
      setServerStatus(freshStatus);
      setTestResult({
        success: res.success,
        message: res.message + (res.sheetName ? ` (${res.sheetName})` : ''),
      });
      if (res.success && url) {
        saveGoogleSheetsUrl(url);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult({
        success: false,
        message: msg,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSyncNow = async () => {
    if (!url && !serverStatus?.configured) {
      setSyncError(
        language === 'en'
          ? 'Enter your Google Apps Script Web App URL first or configure GOOGLE_SHEETS_WEBAPP_URL in Vercel.'
          : 'Introduce primero la URL de la aplicación web o configura GOOGLE_SHEETS_WEBAPP_URL en Vercel.'
      );
      return;
    }

    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);

    try {
      if (url) saveGoogleSheetsUrl(url);
      const res = await syncClientsToGoogleSheets(clients, url || undefined);
      setSyncResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSyncError(msg);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveCurrentClient = async () => {
    if (!url && !serverStatus?.configured) {
      setSingleResult({
        success: false,
        message:
          'Introduce primero la URL de la Web App en la configuración o configura GOOGLE_SHEETS_WEBAPP_URL en Vercel.',
      });
      return;
    }
    const target = activeClient || clients[0];
    if (!target) return;

    setSavingSingle(true);
    setSingleResult(null);

    try {
      if (url) saveGoogleSheetsUrl(url);
      const res = await saveSingleClientToGoogleSheets(target, url || undefined);
      setSingleResult({
        success: res.status === 'success',
        message: res.message || `Cliente "${target.name}" guardado exitosamente.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSingleResult({
        success: false,
        message: msg,
      });
    } finally {
      setSavingSingle(false);
    }
  };

  const handleFetchClientsFromSheets = async () => {
    if (!url && !serverStatus?.configured) {
      setLoadResult({
        success: false,
        message:
          'Introduce primero la URL de la Web App de Apps Script o configura GOOGLE_SHEETS_WEBAPP_URL en Vercel.',
      });
      return;
    }

    setLoadingClients(true);
    setLoadResult(null);

    try {
      if (url) saveGoogleSheetsUrl(url);
      const res = await fetchClientsFromGoogleSheets(url || undefined);
      if (res.success && res.clients.length > 0) {
        if (onLoadClients) {
          onLoadClients(res.clients);
        }
        setLoadResult({
          success: true,
          message: `Se cargaron ${res.clients.length} clientes desde la hoja "${res.sheetName || 'Margen'}".`,
          count: res.clients.length,
        });
      } else {
        setLoadResult({
          success: false,
          message: 'No se encontraron clientes en la hoja (la tabla de datos está vacía).',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLoadResult({
        success: false,
        message: msg,
      });
    } finally {
      setLoadingClients(false);
    }
  };

  const currentTargetClient = activeClient || clients[0];

  // Stats by territory
  const spainCount = clients.filter(
    (c) => ((c.inputs && c.inputs.warehouse) || 'Spain').toLowerCase() === 'spain'
  ).length;
  const ukCount = clients.filter(
    (c) => ((c.inputs && c.inputs.warehouse) || '').toLowerCase() === 'uk'
  ).length;
  const usaCount = clients.filter(
    (c) => ((c.inputs && c.inputs.warehouse) || '').toLowerCase() === 'usa'
  ).length;

  const canOperate = Boolean(url || serverStatus?.configured);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
          isDark
            ? 'bg-[#151226] border-[#2E2A48] text-gray-100'
            : 'bg-white border-[#E5DDD0] text-[#2D2825]'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b ${
            isDark ? 'bg-[#1A1630] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600">
              <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">
                  {language === 'en'
                    ? 'Google Sheets Integration · "Margen"'
                    : 'Integración con Google Sheets · "Margen"'}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Spain · UK · USA
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {language === 'en'
                  ? 'Sync all client margins & rates into separate territory sheets in real-time'
                  : 'Sincroniza todas las cotizaciones de clientes en pestañas separadas por Territorio'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg transition cursor-pointer ${
              isDark ? 'hover:bg-[#25203D] text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div
          className={`flex items-center gap-2 px-4 sm:px-6 pt-3 border-b text-xs font-semibold overflow-x-auto scrollbar-none whitespace-nowrap ${
            isDark ? 'border-[#2E2A48] bg-[#17132B]' : 'border-gray-200 bg-gray-50/50'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('google_api')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'google_api'
                ? 'border-emerald-500 text-emerald-500'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Google Console (API Directa)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'sync'
                ? 'border-emerald-500 text-emerald-500'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Sincronizar & Cargar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('setup')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'setup'
                ? 'border-emerald-500 text-emerald-500'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Apps Script (Legacy)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('columns')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'columns'
                ? 'border-emerald-500 text-emerald-500'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Columns & Sheets' : 'Pestañas y Columnas'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'code'
                ? 'border-emerald-500 text-emerald-500'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'View Script Code' : 'Código Apps Script'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB GOOGLE CLOUD CONSOLE (API DIRECTA + SHARE) */}
          {activeTab === 'google_api' && (
            <div className="space-y-6">
              {/* Banner informativo principal */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                  serverStatus?.configured && serverStatus?.connected
                    ? isDark
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : isDark
                    ? 'bg-blue-950/20 border-blue-500/40 text-blue-200'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <KeyRound className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-sm">
                    {serverStatus?.configured && serverStatus?.connected
                      ? '✓ Google Sheets API Conectada con Éxito'
                      : 'Integración Directa mediante Google Cloud Console & Service Account'}
                  </p>
                  <p className="leading-relaxed">
                    {serverStatus?.configured && serverStatus?.connected
                      ? `Conexión activa con "${serverStatus.sheetName}". Cualquier usuario u ordenador sincroniza en tiempo real de forma 100% fiable.`
                      : 'Esta es la forma más robusta y recomendada: la API oficial de Google Sheets lee y escribe directamente en tu hoja de cálculo compartida, sin depender de Web Apps de Apps Script ni bloqueos de red.'}
                  </p>
                </div>
              </div>

              {/* Guía Paso a Paso con Google Cloud Console y Share */}
              <div className="space-y-4">
                {/* Paso 1: Crear Service Account en Google Console */}
                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-[#1C1833] border-[#2E2A48]' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                      Crear Service Account & Habilitar API en Google Cloud
                    </h3>
                  </div>
                  <div className="text-xs text-gray-400 pl-7 space-y-1.5 leading-relaxed">
                    <p>
                      1. Entra a <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-blue-400 underline font-semibold">Google Cloud Console</a>.
                    </p>
                    <p>
                      2. Ve a <strong>APIs y servicios &gt; Biblioteca</strong>, busca <strong className="text-white">Google Sheets API</strong> y haz clic en <strong>Habilitar</strong>.
                    </p>
                    <p>
                      3. Ve a <strong>IAM y administración &gt; Cuentas de servicio</strong> y haz clic en <strong>Crear cuenta de servicio</strong> (ej. <em>huboo-sheets</em>).
                    </p>
                    <p>
                      4. Entra en la cuenta de servicio recién creada, ve a la pestaña <strong>Claves (Keys) &gt; Agregar clave &gt; Crear clave nueva &gt; Tipo JSON</strong>. Se descargará un archivo <code className="text-blue-300 font-mono">.json</code> con tus credenciales.
                    </p>
                  </div>
                </div>

                {/* Paso 2: Compartir la hoja con la cuenta de servicio */}
                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-[#1C1833] border-[#2E2A48]' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      2
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Dar Permiso de "Editor" en tu Google Sheet</span>
                    </h3>
                  </div>
                  <div className="text-xs text-gray-400 pl-7 space-y-1.5 leading-relaxed">
                    <p>
                      1. Abre tu hoja de Google Sheets (llamada <strong>"Margen"</strong>).
                    </p>
                    <p>
                      2. Haz clic en el botón superior derecho <strong>Compartir (Share)</strong>.
                    </p>
                    <p>
                      3. Pega el correo de tu Service Account (termina en <code className="text-blue-300 font-mono">@...iam.gserviceaccount.com</code>) que aparece dentro de tu archivo JSON (campo <em>client_email</em>).
                    </p>
                    <p>
                      4. asígnale el rol de <strong className="text-emerald-400 font-bold">Editor</strong> y pulsa <strong>Compartir</strong>.
                    </p>
                  </div>
                </div>

                {/* Paso 3: Pegar Secretos en Vercel */}
                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-[#1C1833] border-[#2E2A48]' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      3
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                      Configurar Variables de Entorno en Vercel
                    </h3>
                  </div>
                  <div className="text-xs text-gray-400 pl-7 space-y-3.5 leading-relaxed">
                    <p>
                      En tu panel de <strong className="text-white">Vercel &gt; Proyecto &gt; Settings &gt; Environment Variables</strong>, puedes elegir la opción recomendada de variables individuales (evita errores con saltos de línea del JSON) o pegar el JSON completo:
                    </p>

                    {/* Opción A: Variables individuales 1 por 1 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          OPCIÓN A (RECOMENDADA)
                        </span>
                        <span className="text-[11px] font-semibold text-gray-300">
                          Variables una por una (100% fiable)
                        </span>
                      </div>

                      <div className="p-3 bg-black/40 rounded-lg border border-gray-700 space-y-2">
                        {/* 1. SPREADSHEET_ID */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-emerald-400 font-bold text-xs truncate">GOOGLE_SHEETS_SPREADSHEET_ID</div>
                            <div className="text-[11px] text-gray-400">ID de tu hoja (la parte entre /d/ y /edit de la URL)</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('GOOGLE_SHEETS_SPREADSHEET_ID');
                              setCopiedSheetIdVar(true);
                              setTimeout(() => setCopiedSheetIdVar(false), 2000);
                            }}
                            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-[11px] font-semibold flex items-center gap-1 border border-gray-600 cursor-pointer shrink-0"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedSheetIdVar ? '¡Copiado!' : 'Copiar'}</span>
                          </button>
                        </div>

                        {/* 2. SERVICE_ACCOUNT_EMAIL */}
                        <div className="border-t border-gray-800 pt-2 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-emerald-400 font-bold text-xs truncate">GOOGLE_SERVICE_ACCOUNT_EMAIL</div>
                            <div className="text-[11px] text-gray-400">El email de tu Service Account (campo <em>client_email</em> del JSON)</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('GOOGLE_SERVICE_ACCOUNT_EMAIL');
                              setCopiedEmailVar(true);
                              setTimeout(() => setCopiedEmailVar(false), 2000);
                            }}
                            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-[11px] font-semibold flex items-center gap-1 border border-gray-600 cursor-pointer shrink-0"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedEmailVar ? '¡Copiado!' : 'Copiar'}</span>
                          </button>
                        </div>

                        {/* 3. PRIVATE_KEY */}
                        <div className="border-t border-gray-800 pt-2 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-emerald-400 font-bold text-xs truncate">GOOGLE_PRIVATE_KEY</div>
                            <div className="text-[11px] text-gray-400">Clave privada (campo <em>private_key</em> que empieza por -----BEGIN PRIVATE KEY-----)</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('GOOGLE_PRIVATE_KEY');
                              setCopiedPrivateKeyVar(true);
                              setTimeout(() => setCopiedPrivateKeyVar(false), 2000);
                            }}
                            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-[11px] font-semibold flex items-center gap-1 border border-gray-600 cursor-pointer shrink-0"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedPrivateKeyVar ? '¡Copiado!' : 'Copiar'}</span>
                          </button>
                        </div>

                        {/* 4. PROJECT_ID */}
                        <div className="border-t border-gray-800 pt-2 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-gray-400 font-bold text-xs truncate">GOOGLE_PROJECT_ID <span className="text-[10px] text-gray-500 font-normal">(Opcional)</span></div>
                            <div className="text-[11px] text-gray-400">ID del proyecto en Google Cloud (campo <em>project_id</em>)</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('GOOGLE_PROJECT_ID');
                              setCopiedProjectIdVar(true);
                              setTimeout(() => setCopiedProjectIdVar(false), 2000);
                            }}
                            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-[11px] font-semibold flex items-center gap-1 border border-gray-600 cursor-pointer shrink-0"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedProjectIdVar ? '¡Copiado!' : 'Copiar'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Opción B: JSON completo */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-700 text-gray-300">
                          OPCIÓN B (ALTERNATIVA)
                        </span>
                        <span className="text-[11px] font-semibold text-gray-400">
                          JSON completo en una sola variable
                        </span>
                      </div>

                      <div className="p-3 bg-black/40 rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-emerald-400 font-bold text-xs truncate">GOOGLE_SERVICE_ACCOUNT_KEY</div>
                            <div className="text-[11px] text-gray-400">Pega todo el contenido del archivo .json que descargaste</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('GOOGLE_SERVICE_ACCOUNT_KEY');
                              setCopiedKeyVar(true);
                              setTimeout(() => setCopiedKeyVar(false), 2000);
                            }}
                            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-[11px] font-semibold flex items-center gap-1 border border-gray-600 cursor-pointer shrink-0"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedKeyVar ? '¡Copiado!' : 'Copiar'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Panel de Diagnóstico en Tiempo Real */}
                    {serverStatus?.diagnostics && (
                      <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-700/80 space-y-2 text-xs">
                        <div className="font-bold text-gray-200 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-blue-400" />
                          <span>Diagnóstico en Vivo de Variables de Servidor</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                          <div className="flex items-center justify-between p-1.5 rounded bg-black/30">
                            <span className="text-gray-400">Spreadsheet ID:</span>
                            <span className={serverStatus.diagnostics.spreadsheetIdSet ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                              {serverStatus.diagnostics.spreadsheetIdSet ? '✓ Detectado' : '✗ No detectado'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-1.5 rounded bg-black/30">
                            <span className="text-gray-400">Email Service Account:</span>
                            <span className={serverStatus.diagnostics.individualVars?.emailSet ? 'text-emerald-400 font-semibold' : serverStatus.diagnostics.jsonBlob?.hasClientEmail ? 'text-blue-400 font-semibold' : 'text-amber-400'}>
                              {serverStatus.diagnostics.individualVars?.emailSet ? '✓ Por variable' : serverStatus.diagnostics.jsonBlob?.hasClientEmail ? '✓ Por JSON' : '✗ No detectado'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-1.5 rounded bg-black/30">
                            <span className="text-gray-400">Clave Privada:</span>
                            <span className={serverStatus.diagnostics.individualVars?.privateKeySet ? 'text-emerald-400 font-semibold' : serverStatus.diagnostics.jsonBlob?.hasPrivateKey ? 'text-blue-400 font-semibold' : 'text-amber-400'}>
                              {serverStatus.diagnostics.individualVars?.privateKeySet ? '✓ Por variable' : serverStatus.diagnostics.jsonBlob?.hasPrivateKey ? '✓ Por JSON' : '✗ No detectado'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-1.5 rounded bg-black/30">
                            <span className="text-gray-400">Estrategia Activa:</span>
                            <span className="font-semibold text-white">
                              {serverStatus.diagnostics.resolvedStrategy === 'INDIVIDUAL_VARS'
                                ? 'Variables Individuales'
                                : serverStatus.diagnostics.resolvedStrategy === 'JSON_BLOB'
                                ? 'JSON Blob'
                                : 'Sin configurar'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-gray-400">
                      💡 Tras guardar o cambiar las variables en Vercel, pulsa <strong>Redeploy</strong> (o despliega de nuevo) para que Vercel cargue los nuevos valores en el servidor.
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testingConnection}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                        <span>Comprobar Estado de la API</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('sync')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Ir a Sincronizar Clientes</span>
                      </button>
                    </div>

                    {testResult && (
                      <div
                        className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                          testResult.success
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {testResult.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        <span>{testResult.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: STEP BY STEP SETUP */}
          {activeTab === 'setup' && (
            <div className="space-y-6">
              <div
                className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                  isDark
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold">
                    {language === 'en'
                      ? 'Already created the Google Sheet "Margen"?'
                      : '¿Ya creaste el Google Sheet llamado "Margen"? ¡Genial!'}
                  </p>
                  <p className="leading-relaxed">
                    {language === 'en'
                      ? 'Follow these 4 simple steps to connect it. The script automatically generates the tabs "Spain", "UK", "USA" and "Resumen General", formats columns with currencies and colors, and keeps everything synced.'
                      : 'Sigue estos 4 pasos sencillos para conectarlo. El script creará automáticamente las pestañas "Spain", "UK", "USA" y "Resumen General", formateará las columnas con moneda (€) y colores, y recibirá los datos directamente desde la app.'}
                  </p>
                </div>
              </div>

              {/* Steps List */}
              <div className="space-y-4">
                {/* Step 1 */}
                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-[#1C1833] border-[#2E2A48]' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      {language === 'en' ? 'Open Apps Script' : 'Abre Apps Script en tu hoja "Margen"'}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 pl-7">
                    {language === 'en'
                      ? 'Inside your Google Sheet "Margen", click the top menu: '
                      : 'Dentro de tu Google Sheet "Margen", haz clic en el menú superior: '}
                    <strong className="text-emerald-400">Extensiones &gt; Apps Script</strong>.
                  </p>
                </div>

                {/* Step 2 */}
                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-[#1C1833] border-[#2E2A48]' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                        2
                      </span>
                      <h3 className="text-xs font-bold uppercase tracking-wider">
                        {language === 'en' ? 'Paste the Script Code' : 'Pega el código del script'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyScript}
                      className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer shadow-xs"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>{language === 'en' ? 'Copied!' : '¡Copiado!'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? 'Copy Script Code' : 'Copiar Script'}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 pl-7 leading-relaxed">
                    {language === 'en'
                      ? 'Select everything inside Código.gs, delete it, paste the copied script, and click Save (Floppy disk icon or Ctrl+S).'
                      : 'Borra todo el contenido que aparezca en el editor de Código.gs, pega el código copiado y haz clic en Guardar (icono de disquete o Ctrl+S).'}
                  </p>
                </div>

                {/* Step 3 */}
                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-[#1C1833] border-[#2E2A48]' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                      3
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      {language === 'en'
                        ? 'Deploy as Web Application'
                        : 'Implementar como Aplicación Web'}
                    </h3>
                  </div>
                  <div className="text-xs text-gray-400 pl-7 space-y-1.5 leading-relaxed">
                    <p>
                      {language === 'en'
                        ? '1. Click the blue button at the top right: '
                        : '1. En la esquina superior derecha, haz clic en el botón azul: '}
                      <strong className="text-emerald-400">Implementar &gt; Nueva implementación</strong>.
                    </p>
                    <p>
                      {language === 'en'
                        ? '2. Click the gear icon (⚙️) and choose '
                        : '2. En el icono de engranaje (⚙️), selecciona el tipo: '}
                      <strong className="text-emerald-400">Aplicación web</strong>.
                    </p>
                    <p>
                      {language === 'en'
                        ? '3. Set "Execute as": '
                        : '3. En "Ejecutar como": '}
                      <strong className="text-white">Yo (tu correo)</strong>.
                    </p>
                    <p>
                      {language === 'en'
                        ? '4. Set "Who has access": '
                        : '4. En "Quién tiene acceso": '}
                      <strong className="text-amber-400 font-bold">Cualquier persona (Anyone)</strong>.
                      <span className="text-[11px] block text-gray-500">
                        {language === 'en'
                          ? '(Critical: allows the calculator in browser to send client rates securely).'
                          : '(Imprescindible: permite a la calculadora enviar los datos sin bloqueos).' }
                      </span>
                    </p>
                    <p>
                      {language === 'en'
                        ? '5. Click Deploy, authorize access if prompted, and copy the Web App URL (ends in /exec).'
                        : '5. Haz clic en Implementar, autoriza los permisos que pida Google y copia la URL de la aplicación web (termina en /exec).'}
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div
                  className={`p-4 rounded-xl border ${
                    isDark ? 'bg-[#1C1833] border-[#2E2A48]' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                      4
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      {language === 'en' ? 'Paste Web App URL' : 'Pega aquí la URL y sincroniza'}
                    </h3>
                  </div>
                  <div className="pl-7 space-y-3">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onBlur={handleSaveUrl}
                      placeholder={
                        serverStatus?.configured
                          ? 'Configurado en Vercel Backend (GOOGLE_SHEETS_WEBAPP_URL)'
                          : 'https://script.google.com/macros/s/.../exec'
                      }
                      className={`w-full px-3 py-2 text-xs rounded-lg font-mono border focus:outline-none ${
                        isDark
                          ? 'bg-[#120e26] border-[#2E2A48] text-white focus:border-emerald-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-600'
                      }`}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testingConnection || !canOperate}
                        className="px-3 py-1.5 text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                        <span>{language === 'en' ? 'Test Connection' : 'Probar Conexión'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleSaveUrl();
                          setActiveTab('sync');
                        }}
                        disabled={!canOperate}
                        className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? 'Continue to Sync' : 'Ir a Sincronizar'}</span>
                      </button>
                    </div>

                    {testResult && (
                      <div
                        className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                          testResult.success
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {testResult.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        <span>{testResult.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SYNC & WEBHOOK */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              {/* URL input */}
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  isDark ? 'bg-[#1C1833] border-[#2E2A48]' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold uppercase text-gray-400 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{language === 'en' ? 'Google Apps Script Webhook URL' : 'URL del Webhook de Apps Script'}</span>
                  </label>

                  <div className="flex items-center gap-2">
                    {serverStatus?.configured ? (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 font-semibold flex items-center gap-1.5 shadow-xs">
                        <Lock className="w-3 h-3 text-emerald-400" />
                        <span>API Segura Vercel Activa</span>
                      </span>
                    ) : isEnvConfigured ? (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span>Vercel ENV</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCopyVarName}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-medium flex items-center gap-1 hover:bg-blue-500/20 transition cursor-pointer"
                        title="Haz clic para copiar el nombre de la variable para Vercel"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedVarName ? '¡Copiado!' : 'GOOGLE_SHEETS_WEBAPP_URL'}</span>
                      </button>
                    )}
                    {url && (
                      <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {language === 'en' ? 'Saved' : 'Guardado'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onBlur={handleSaveUrl}
                    placeholder={
                      serverStatus?.configured
                        ? 'Configurado en Vercel Backend (GOOGLE_SHEETS_WEBAPP_URL)'
                        : 'https://script.google.com/macros/s/.../exec'
                    }
                    className={`flex-1 px-3 py-2 text-xs rounded-lg font-mono border focus:outline-none ${
                      isDark
                        ? 'bg-[#120e26] border-[#2E2A48] text-white focus:border-emerald-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-600'
                    }`}
                  />

                  {url && (
                    <button
                      type="button"
                      onClick={handleCopyCurrentUrl}
                      title={language === 'en' ? 'Copy URL to clipboard' : 'Copiar URL al portapapeles'}
                      className="px-2.5 py-2 text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition border border-gray-700 cursor-pointer flex items-center gap-1"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{copiedUrl ? (language === 'en' ? 'Copied' : 'Copiada') : (language === 'en' ? 'Copy' : 'Copiar')}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection || !canOperate}
                    className="px-3 py-2 text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                    <span>{language === 'en' ? 'Test' : 'Probar'}</span>
                  </button>
                </div>

                {serverStatus?.needsScriptUpdate && (
                  <div className="p-4 rounded-xl border border-amber-500/60 bg-amber-500/10 text-amber-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-amber-400">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>¡Actualización de Script necesaria para sincronizar entre ordenadores!</span>
                    </div>
                    <p className="text-[11.5px] leading-relaxed text-amber-100">
                      Tu Google Sheet responde, pero tu Google Apps Script tiene la versión antigua que no puede enviar los clientes a otros ordenadores.
                    </p>
                    <div className="text-[11px] space-y-1 pl-3 border-l-2 border-amber-500/50 text-gray-300">
                      <p>1. En tu hoja Google Sheet &gt; <strong>Extensiones &gt; Apps Script</strong>.</p>
                      <p>2. Reemplaza todo el código en <em>Código.gs</em> con el nuevo script.</p>
                      <p>3. <strong>Paso clave:</strong> Haz clic en <strong>Implementar &gt; Administrar implementaciones &gt; Editar (icono lápiz) &gt; Versión: "Nueva versión" &gt; Implementar</strong>.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyScript}
                      className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedCode ? '¡Script Copiado!' : 'Copiar Código del Script Actualizado'}</span>
                    </button>
                  </div>
                )}

                {isEnvConfigured && url !== VERCEL_ENV_GOOGLE_SHEETS_URL && (
                  <div className="flex items-center justify-between text-xs px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300">
                    <span>
                      {language === 'en'
                        ? 'You modified the URL locally (different from Vercel ENV)'
                        : 'Has modificado la URL en este navegador (difiere de la configurada en Vercel)'}
                    </span>
                    <button
                      type="button"
                      onClick={handleResetToVercelEnv}
                      className="flex items-center gap-1 underline font-bold hover:text-amber-200 cursor-pointer ml-2"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{language === 'en' ? 'Reset to Vercel ENV' : 'Revertir a Vercel ENV'}</span>
                    </button>
                  </div>
                )}

                {testResult && (
                  <div
                    className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {testResult.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>

              {/* Multi-computer synchronization callout */}
              <div
                className={`p-4 rounded-xl border text-xs space-y-2.5 ${
                  serverStatus?.configured
                    ? isDark
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : isDark
                    ? 'bg-[#18142e] border-[#2E2A48] text-gray-300'
                    : 'bg-[#F9F7F2] border-[#E8E1D3] text-[#4D453E]'
                }`}
              >
                {serverStatus?.configured ? (
                  <>
                    <div className="flex items-center gap-2 font-bold text-emerald-400">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Sincronización Centralizada Activa vía API Vercel</span>
                    </div>
                    <p className="text-[11.5px] leading-relaxed">
                      La variable <code className="px-1.5 py-0.5 rounded bg-emerald-500/20 font-mono font-bold text-emerald-300">GOOGLE_SHEETS_WEBAPP_URL</code> está activa en el servidor. Todos los ordenadores y miembros de tu equipo acceden y guardan cotizaciones en Google Sheets automáticamente y de forma 100% segura sin exponer la URL en el navegador.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-500">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Sincronización Segura en Todos los Ordenadores (API Backend Vercel)</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyVarName}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedVarName ? '¡Nombre Copiado!' : 'Copiar GOOGLE_SHEETS_WEBAPP_URL'}</span>
                      </button>
                    </div>
                    <p className="text-[11.5px] leading-relaxed">
                      Para que cualquier ordenador cargue las cotizaciones automáticamente sin tener que ingresar la URL cada vez:
                    </p>
                    <ol className="list-decimal list-inside text-[11px] space-y-1 pl-1 text-gray-400">
                      <li>Abre tu panel en <strong className="text-white">Vercel &gt; Proyecto (margen-beige) &gt; Settings &gt; Environment Variables</strong>.</li>
                      <li>Añade la variable: <code className="px-1 py-0.5 rounded bg-black/40 font-mono text-emerald-300 font-bold">GOOGLE_SHEETS_WEBAPP_URL</code> (sin prefijo VITE, 100% privada).</li>
                      <li>Pega el valor de tu URL de Web App de Google Apps Script (terminada en <span className="font-mono">/exec</span>) y guarda.</li>
                      <li>Despliega un nuevo commit o pulsa <em>Redeploy</em> en Vercel. ¡A partir de ese instante todos tus ordenadores cargarán los clientes al abrir la web!</li>
                    </ol>
                  </>
                )}
              </div>

              {/* Partition Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div
                  className={`p-3.5 rounded-xl border text-center ${
                    isDark ? 'bg-[#1A1630] border-[#2E2A48]' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className="text-[11px] text-gray-400 uppercase font-semibold">
                    {language === 'en' ? 'Total Clients' : 'Total Clientes'}
                  </span>
                  <div className="text-xl font-bold mt-1 text-white">{clients.length}</div>
                  <span className="text-[10px] text-gray-500">
                    {language === 'en' ? 'Sheet: Resumen General' : 'Hoja: Resumen General'}
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-xl border text-center ${
                    isDark ? 'bg-[#1A1630] border-[#2E2A48]' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className="text-[11px] text-blue-400 uppercase font-semibold">Spain</span>
                  <div className="text-xl font-bold mt-1 text-blue-400">{spainCount}</div>
                  <span className="text-[10px] text-gray-500">
                    {language === 'en' ? 'Sheet: Spain' : 'Pestaña: Spain'}
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-xl border text-center ${
                    isDark ? 'bg-[#1A1630] border-[#2E2A48]' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className="text-[11px] text-purple-400 uppercase font-semibold">UK</span>
                  <div className="text-xl font-bold mt-1 text-purple-400">{ukCount}</div>
                  <span className="text-[10px] text-gray-500">
                    {language === 'en' ? 'Sheet: UK' : 'Pestaña: UK'}
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-xl border text-center ${
                    isDark ? 'bg-[#1A1630] border-[#2E2A48]' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <span className="text-[11px] text-amber-400 uppercase font-semibold">USA</span>
                  <div className="text-xl font-bold mt-1 text-amber-400">{usaCount}</div>
                  <span className="text-[10px] text-gray-500">
                    {language === 'en' ? 'Sheet: USA' : 'Pestaña: USA'}
                  </span>
                </div>
              </div>

              {/* Direct Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ACTION 1: Guardar cliente actual que se está cotizando */}
                <div
                  className={`p-5 rounded-2xl border flex flex-col justify-between ${
                    isDark ? 'bg-[#1C1833] border-[#2E2A48]' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <Save className="w-3.5 h-3.5" />
                        {language === 'en' ? 'Quote in progress' : 'Cotización en curso'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {currentTargetClient?.inputs.warehouse || 'Spain'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold truncate">
                      {currentTargetClient ? currentTargetClient.name : 'Cliente actual'}
                    </h4>

                    <p className="text-xs text-gray-400 leading-relaxed">
                      {language === 'en'
                        ? 'Save or update this client’s row in its territory sheet and the General Summary sheet.'
                        : 'Guarda o actualiza la fila de este cliente en la pestaña de su territorio y en Resumen General.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
                    <button
                      type="button"
                      onClick={handleSaveCurrentClient}
                      disabled={savingSingle || !canOperate}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <Save className={`w-3.5 h-3.5 ${savingSingle ? 'animate-spin' : ''}`} />
                      <span>
                        {savingSingle
                          ? language === 'en'
                            ? 'Saving...'
                            : 'Guardando en Sheet...'
                          : language === 'en'
                          ? `💾 Save "${currentTargetClient?.name || 'Client'}" to Sheet`
                          : `💾 Guardar "${currentTargetClient?.name || 'Cliente'}" en Sheet`}
                      </span>
                    </button>

                    {singleResult && (
                      <div
                        className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                          singleResult.success
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {singleResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                        <span className="truncate">{singleResult.message}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTION 2: Cargar clientes desde Google Sheet */}
                <div
                  className={`p-5 rounded-2xl border flex flex-col justify-between ${
                    isDark ? 'bg-[#1C1833] border-[#2E2A48]' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5" />
                        {language === 'en' ? 'Import / Pull' : 'Cargar desde Sheet'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        GET Request
                      </span>
                    </div>

                    <h4 className="text-sm font-bold">
                      {language === 'en' ? 'Load saved clients into App' : 'Descargar clientes guardados'}
                    </h4>

                    <p className="text-xs text-gray-400 leading-relaxed">
                      {language === 'en'
                        ? 'Fetches the rows from "Resumen General" in Google Sheets and updates your calculator client list.'
                        : 'Lee las filas de "Resumen General" en Google Sheet e importa los clientes a tu calculadora.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
                    <button
                      type="button"
                      onClick={handleFetchClientsFromSheets}
                      disabled={loadingClients || !canOperate}
                      className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <Download className={`w-3.5 h-3.5 ${loadingClients ? 'animate-spin' : ''}`} />
                      <span>
                        {loadingClients
                          ? language === 'en'
                            ? 'Loading from Sheet...'
                            : 'Cargando de Sheet...'
                          : language === 'en'
                          ? '📥 Load Clients from Google Sheet'
                          : '📥 Cargar Clientes desde Google Sheet'}
                      </span>
                    </button>

                    {loadResult && (
                      <div
                        className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                          loadResult.success
                            ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {loadResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                        <span className="truncate">{loadResult.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sync All Button */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl border bg-gradient-to-b from-emerald-950/20 to-transparent border-emerald-500/20 space-y-3">
                <button
                  type="button"
                  onClick={handleSyncNow}
                  disabled={syncing || !canOperate}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span>
                    {syncing
                      ? language === 'en'
                        ? 'Syncing to Google Sheets...'
                        : 'Sincronizando con Google Sheets...'
                      : language === 'en'
                      ? '🚀 Sync All Clients to Google Sheets'
                      : '🚀 Sincronizar todos los clientes en Google Sheets'}
                  </span>
                </button>

                <p className="text-[11px] text-gray-400 text-center max-w-md">
                  {language === 'en'
                    ? 'This will update the tabs Spain, UK, USA and Resumen General with current pricing, margins, revenue, ARR and channel integrations.'
                    : 'Actualiza automáticamente las pestañas Spain, UK, USA y Resumen General con precios, márgenes, ingresos, ARR e integraciones de cada cliente.'}
                </p>

                {syncResult && (
                  <div className="w-full mt-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{syncResult.message}</span>
                    </div>
                    <p className="text-emerald-400/80">
                      {language === 'en'
                        ? `Updated ${syncResult.totalClients} clients (Spain: ${syncResult.spainCount}, UK: ${syncResult.ukCount}, USA: ${syncResult.usaCount})`
                        : `Actualizados ${syncResult.totalClients} clientes (Spain: ${syncResult.spainCount}, UK: ${syncResult.ukCount}, USA: ${syncResult.usaCount})`}
                    </p>
                  </div>
                )}

                {syncError && (
                  <div className="w-full mt-3 p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">{language === 'en' ? 'Sync Error:' : 'Error al sincronizar:'}</p>
                      <p className="text-red-400/90">{syncError}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Vercel Environment Variable Card */}
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  isDark ? 'bg-[#18142e] border-purple-500/30' : 'bg-purple-50/60 border-purple-200'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                      {language === 'en'
                        ? 'Global Vercel Integration (https://margen-beige.vercel.app/)'
                        : 'Integración Global en Vercel (https://margen-beige.vercel.app/)'}
                    </h4>
                  </div>
                  {isEnvConfigured ? (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {language === 'en' ? 'Active in current build' : 'Activa en esta compilación'}
                    </span>
                  ) : (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                      {language === 'en' ? 'Pending Vercel setup' : 'Pendiente configurar en Vercel'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  {language === 'en'
                    ? 'To share https://margen-beige.vercel.app/ with your team so everyone can save and load quotes without pasting URLs manually, add this environment variable to your Vercel project.'
                    : 'Para que al compartir https://margen-beige.vercel.app/ con tu equipo todos puedan cargar y guardar cotizaciones inmediatamente sin tener que pegar la URL a mano, añade esta variable en tu proyecto de Vercel:'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div
                    className={`p-3 rounded-lg border flex flex-col justify-between ${
                      isDark ? 'bg-[#110D24] border-purple-500/20' : 'bg-white border-purple-200'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400">1. Variable Name (Key)</span>
                      <p className="text-xs font-mono font-bold text-purple-300 mt-1 select-all">
                        VITE_GOOGLE_SHEETS_WEBAPP_URL
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyVarName}
                      className="mt-2.5 w-full py-1.5 px-2.5 text-xs font-semibold bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 rounded border border-purple-500/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedVarName ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedVarName ? '¡Nombre Copiado!' : 'Copiar Nombre Variable'}</span>
                    </button>
                  </div>

                  <div
                    className={`p-3 rounded-lg border flex flex-col justify-between ${
                      isDark ? 'bg-[#110D24] border-purple-500/20' : 'bg-white border-purple-200'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400">2. Variable Value (URL)</span>
                      <p className="text-xs font-mono text-emerald-400 mt-1 truncate">
                        {url || 'https://script.google.com/macros/s/.../exec'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCurrentUrl}
                      disabled={!url}
                      className="mt-2.5 w-full py-1.5 px-2.5 text-xs font-semibold bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 rounded border border-emerald-500/30 transition flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? '¡URL Copiada!' : 'Copiar URL para Vercel'}</span>
                    </button>
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg text-xs space-y-1.5 ${
                    isDark ? 'bg-[#0E0A1E] text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <p className="font-bold text-gray-200 flex items-center gap-1.5">
                    <span>🚀 Pasos en Vercel (1 minuto):</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-400">
                    <li>Entra en tu panel de <strong>Vercel</strong> y selecciona el proyecto <strong>margen-beige</strong>.</li>
                    <li>Ve a <strong>Settings</strong> → <strong>Environment Variables</strong>.</li>
                    <li>En <strong>Key</strong> escribe <code className="text-purple-300">VITE_GOOGLE_SHEETS_WEBAPP_URL</code> y en <strong>Value</strong> pega tu URL que termina en <code className="text-emerald-300">/exec</code>.</li>
                    <li>Pulsa <strong>Save</strong>.</li>
                    <li>Ve a la pestaña <strong>Deployments</strong>, haz clic en los 3 puntos del último deploy y pulsa <strong>Redeploy</strong> (o haz un nuevo commit).</li>
                  </ol>
                </div>
              </div>

              {/* Informative Architecture & Vercel Help Card */}
              <div
                className={`p-4 rounded-xl border text-xs space-y-2.5 ${
                  isDark ? 'bg-[#151129] border-[#2E2A48]' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {language === 'en'
                      ? 'Architecture FAQs: Google Console, APIs and Vercel'
                      : 'Preguntas Frecuentes: Google Cloud Console, APIs y Despliegue en Vercel'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-[11px] text-gray-400">
                  <div className="space-y-1">
                    <p className="font-bold text-gray-200">
                      {language === 'en' ? '1. Do I need Google Cloud Console?' : '1. ¿Necesito Google Console?'}
                    </p>
                    <p>
                      {language === 'en'
                        ? 'No! Apps Script executes as your own Google account natively. You do not need API Keys, service accounts or Google Cloud OAuth screens.'
                        : '¡No! Apps Script se ejecuta con tus permisos de propietario de la hoja directamente. No necesitas crear proyectos ni habilitar APIs en Google Console.'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-gray-200">
                      {language === 'en' ? '2. Does it work on Vercel?' : '2. ¿Funciona en Vercel?'}
                    </p>
                    <p>
                      {language === 'en'
                        ? 'Yes, 100%. The Web App URL is a public HTTPS webhook endpoint. When deployed to Vercel, requests flow seamlessly.'
                        : 'Sí, 100%. La URL de la Web App es un endpoint HTTPS directo. Al desplegar en Vercel funciona igual de rápido sin configuraciones adicionales.'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-gray-200">
                      {language === 'en' ? '3. Is the sheet public to anyone?' : '3. ¿Debo hacer pública la hoja?'}
                    </p>
                    <p>
                      {language === 'en'
                        ? 'No. The sheet itself remains private in your Google Drive. Only your Apps Script endpoint accepts GET and POST calls.'
                        : 'No. Tu archivo en Drive sigue siendo privado. Solo el script que publicaste atiende las peticiones GET (cargar) y POST (guardar).'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COLUMNS AND SHEETS */}
          {activeTab === 'columns' && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-[#1C1833] border-[#2E2A48]' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                  {language === 'en' ? 'Sheet Tabs Created' : 'Pestañas Creadas en "Margen"'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300">
                    <strong>1. Spain</strong>
                    <p className="text-[10px] text-gray-400 mt-0.5">Clientes con territorio Spain</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300">
                    <strong>2. UK</strong>
                    <p className="text-[10px] text-gray-400 mt-0.5">Clientes con territorio UK</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300">
                    <strong>3. USA</strong>
                    <p className="text-[10px] text-gray-400 mt-0.5">Clientes con territorio USA</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                    <strong>4. Resumen General</strong>
                    <p className="text-[10px] text-gray-400 mt-0.5">Consolidado con todos los clientes</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  {language === 'en'
                    ? `Exact Columns (${GOOGLE_SHEET_COLUMNS.length})`
                    : `Columnas Exactas de Cada Pestaña (${GOOGLE_SHEET_COLUMNS.length})`}
                </h3>
                <div
                  className={`rounded-xl border overflow-hidden ${
                    isDark ? 'border-[#2E2A48]' : 'border-gray-200'
                  }`}
                >
                  <table className="w-full text-xs text-left">
                    <thead
                      className={`text-[11px] uppercase font-bold ${
                        isDark ? 'bg-[#1E1B2E] text-gray-300' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <tr>
                        <th className="px-3 py-2 w-12 text-center">Col</th>
                        <th className="px-4 py-2">Nombre de Columna</th>
                        <th className="px-4 py-2">Tipo de Dato / Formato</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-[#2E2A48]' : 'divide-gray-100'}`}>
                      {GOOGLE_SHEET_COLUMNS.map((col, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        let format = 'Texto';
                        if (col.includes('(€)')) format = 'Moneda (€#,##0.00)';
                        else if (col.includes('(%)')) format = 'Porcentaje (0.0%)';
                        else if (col.includes('SKUs') || col.includes('Pedidos')) format = 'Número Entero (#,##0)';
                        else if (col.includes('Picks') || col.includes('Markup')) format = 'Decimal (0.00)';
                        else if (col.includes('Fecha')) format = 'Fecha (YYYY-MM-DD)';

                        return (
                          <tr
                            key={col}
                            className={isDark ? 'hover:bg-[#1A1630]' : 'hover:bg-gray-50'}
                          >
                            <td className="px-3 py-1.5 text-center font-mono font-bold text-emerald-500">
                              {letter}
                            </td>
                            <td className="px-4 py-1.5 font-medium">{col}</td>
                            <td className="px-4 py-1.5 text-gray-400 text-[11px]">{format}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CODE PREVIEW */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {language === 'en'
                    ? 'Copy this code and paste it into Google Apps Script (Código.gs)'
                    : 'Copia este código y pégalo en el editor de Apps Script (Código.gs)'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? (language === 'en' ? 'Copied!' : '¡Copiado!') : (language === 'en' ? 'Copy Code' : 'Copiar Código')}</span>
                </button>
              </div>

              <pre
                className={`p-4 rounded-xl text-[11px] font-mono leading-relaxed overflow-x-auto max-h-[50vh] border ${
                  isDark
                    ? 'bg-[#0E0C1A] text-emerald-300 border-[#2E2A48]'
                    : 'bg-gray-900 text-emerald-400 border-gray-800'
                }`}
              >
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-between px-6 py-3.5 border-t text-xs ${
            isDark ? 'bg-[#1A1630] border-[#2E2A48]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
          }`}
        >
          <div className="text-gray-400 text-[11px]">
            {language === 'en'
              ? 'Stored securely in your local browser · Works directly on GitHub & Vercel'
              : 'Almacenado de forma segura en tu navegador · Funciona directo en GitHub y Vercel'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                isDark ? 'hover:bg-[#25203D] text-gray-300' : 'hover:bg-gray-200 text-gray-700'
              }`}
            >
              {language === 'en' ? 'Close' : 'Cerrar'}
            </button>
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={syncing || !url}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{language === 'en' ? 'Sync Now' : 'Sincronizar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
