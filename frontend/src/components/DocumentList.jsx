import DownloadButton from './DownloadButton.jsx';

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function DocumentList({ documents, isLoading, onRefresh, onDownloadError }) {
  return (
    <section className="documents-section" aria-labelledby="documents-heading">
      <div className="section-heading document-list-heading">
        <div>
          <p className="eyebrow">BIBLIOTECA</p>
          <h2 id="documents-heading">Documentos</h2>
        </div>
        <div className="list-controls">
          <span className="document-count">{documents.length.toString().padStart(2, '0')}</span>
          <button className="text-button refresh-button" type="button" onClick={onRefresh} disabled={isLoading}>
            {isLoading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {isLoading && documents.length === 0 ? (
        <p className="list-message" role="status">Carregando documentos...</p>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-index" aria-hidden="true">01</span>
          <div>
            <h3>Nenhum documento por aqui</h3>
            <p>Os arquivos enviados aparecerão nesta lista.</p>
          </div>
        </div>
      ) : (
        <div className="document-table-wrap">
          <table className="document-table">
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Tamanho</th>
                <th scope="col">Enviado em</th>
                <th scope="col"><span className="visually-hidden">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td className="document-name-cell">
                    <span className="document-file-mark" aria-hidden="true">DOC</span>
                    <span className="document-name" title={document.originalName}>{document.originalName}</span>
                  </td>
                  <td className="document-meta-cell">{formatFileSize(document.size)}</td>
                  <td className="document-meta-cell">{formatDate(document.uploadedAt)}</td>
                  <td className="document-action-cell">
                    <DownloadButton
                      documentId={document.id}
                      fileName={document.originalName}
                      onError={onDownloadError}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}