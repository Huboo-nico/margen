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
  const [activeTab, setActiveTab] = useState<'setup' | 'sync' | 'columns' | 'code'>('setup');
  const [copiedCode, setCopiedCode] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [savingSingle, setSavingSingle] = useState(false);
  const [singleResult, setSingleResult] = useState<{ success: boolean; message: string } | null>(null);

  const [loadingClients, setLoadingClients] = useState(false);
  const [loadResult, setLoadResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const saved = getSavedGoogleSheetsUrl();
      setUrl(saved);
      setTestResult(null);
      setSyncResult(null);
      setSyncError(null);
      setSingleResult(null);
      setLoadResult(null);
      if (saved) {
        setActiveTab('sync');
      } else {
        setActiveTab('setup');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSaveUrl = () => {
    saveGoogleSheetsUrl(url);
  };

  const handleTestConnection = async () => {
    if (!url) {
      setTestResult({
        success: false,
        message: language === 'en' ? 'Please enter a valid URL first.' : 'Por favor ingresa primero la URL de Apps Script.',
      });
      return;
    }
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testGoogleSheetsConnection(url);
      setTestResult({
        success: res.success,
        message: res.message + (res.sheetName ? ` (${res.sheetName})` : ''),
      });
      if (res.success) {
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
    if (!url) {
      setSyncError(
        language === 'en'
          ? 'Enter your Google Apps Script Web App URL first.'
          : 'Introduce primero la URL de la aplicación web de Google Apps Script.'
      );
      return;
    }

    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);

    try {
      saveGoogleSheetsUrl(url);
      const res = await syncClientsToGoogleSheets(clients, url);
      setSyncResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSyncError(msg);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveCurrentClient = async () => {
    if (!url) {
      setSingleResult({
        success: false,
        message: 'Introduce primero la URL de la Web App en la configuración.',
      });
      return;
    }
    const target = activeClient || clients[0];
    if (!target) return;

    setSavingSingle(true);
    setSingleResult(null);

    try {
      saveGoogleSheetsUrl(url);
      const res = await saveSingleClientToGoogleSheets(target, url);
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
    if (!url) {
      setLoadResult({
        success: false,
        message: 'Introduce primero la URL de la Web App de Apps Script.',
      });
      return;
    }

    setLoadingClients(true);
    setLoadResult(null);

    try {
      saveGoogleSheetsUrl(url);
      const res = await fetchClientsFromGoogleSheets(url);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
          isDark
            ? 'bg-[#151226] border-[#2E2A48] text-gray-100'
            : 'bg-white border-[#E5DDD0] text-[#2D2825]'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
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
          className={`flex items-center gap-2 px-6 pt-3 border-b text-xs font-semibold ${
            isDark ? 'border-[#2E2A48] bg-[#17132B]' : 'border-gray-200 bg-gray-50/50'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('setup')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'setup'
                ? 'border-emerald-500 text-emerald-500'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{language === 'en' ? '1. Step-by-Step Setup' : '1. Paso a Paso'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sync'
                ? 'border-emerald-500 text-emerald-500'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{language === 'en' ? '2. Sync & Webhook' : '2. Sincronizar'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('columns')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
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
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                      placeholder="https://script.google.com/macros/s/.../exec"
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
                        disabled={testingConnection || !url}
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
                        disabled={!url}
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
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase text-gray-400 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{language === 'en' ? 'Google Apps Script Webhook URL' : 'URL del Webhook de Apps Script'}</span>
                  </label>
                  {url && (
                    <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {language === 'en' ? 'Saved' : 'Guardado'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onBlur={handleSaveUrl}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className={`flex-1 px-3 py-2 text-xs rounded-lg font-mono border focus:outline-none ${
                      isDark
                        ? 'bg-[#120e26] border-[#2E2A48] text-white focus:border-emerald-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingConnection || !url}
                    className="px-3 py-2 text-xs font-semibold bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                    <span>{language === 'en' ? 'Test' : 'Probar'}</span>
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
                      disabled={savingSingle || !url}
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
                      disabled={loadingClients || !url}
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
                  disabled={syncing || !url}
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
