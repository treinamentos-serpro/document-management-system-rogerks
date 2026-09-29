import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments, uploadDocument } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDocuments() {
      setIsLoading(true);

      try {
        const result = await listDocuments({ signal: controller.signal });
        setDocuments(result);
      } catch (error) {
        if (error.name !== 'AbortError') {
          setNotice({ type: 'error', message: error.message });
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadDocuments();
    return () => controller.abort();
  }, [refreshKey]);

  async function handleUpload(file) {
    setIsUploading(true);
    setNotice(null);

    try {
      await uploadDocument(file);
      setNotice({ type: 'success', message: 'Documento enviado com sucesso.' });
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
      throw error;
    } finally {
      setIsUploading(false);
    }
  }

  function handleDownloadError(error) {
    setNotice({ type: 'error', message: error.message });
  }

  return (
    <main className="workspace">
      <header className="topbar">
        <a className="wordmark" href="#inicio" aria-label="DMS, início">
          <span className="wordmark-symbol" aria-hidden="true">D</span>
          <span>DMS<span className="wordmark-period">.</span></span>
        </a>
        <span className="topbar-label">ARQUIVO DIGITAL</span>
      </header>

      <section className="intro" id="inicio">
        <div>
          <p className="eyebrow">ESPAÇO DE TRABALHO</p>
          <h1>Seus documentos,<br />em um só lugar.</h1>
        </div>
        <p className="intro-note">
          Envie um arquivo para guardar e acessar seus documentos nesta sessão.
        </p>
      </section>

      <section className="upload-section" aria-labelledby="upload-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ADICIONAR</p>
            <h2 id="upload-heading">Enviar documento</h2>
          </div>
          <span className="size-note">Até 10 MiB</span>
        </div>
        <UploadComponent isUploading={isUploading} onUpload={handleUpload} />
      </section>

      {notice && (
        <div className={`notice notice-${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
          <span>{notice.message}</span>
          <button className="notice-dismiss" type="button" onClick={() => setNotice(null)} aria-label="Fechar mensagem">
            Fechar
          </button>
        </div>
      )}

      <DocumentList
        documents={documents}
        isLoading={isLoading}
        onRefresh={() => setRefreshKey((current) => current + 1)}
        onDownloadError={handleDownloadError}
      />

      <footer className="footer">
        <span>Os arquivos são mantidos localmente.</span>
        <span>Metadados disponíveis durante esta sessão.</span>
      </footer>
    </main>
  );
}