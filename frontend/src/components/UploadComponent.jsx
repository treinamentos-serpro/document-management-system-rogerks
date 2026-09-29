import { useRef, useState } from 'react';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function UploadComponent({ isUploading, onUpload }) {
  const [file, setFile] = useState(null);
  const [validationError, setValidationError] = useState('');
  const inputRef = useRef(null);

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0] || null;
    setValidationError('');

    if (selectedFile && selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      setValidationError('O arquivo excede o limite de 10 MiB.');
      return;
    }

    setFile(selectedFile);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || isUploading) {
      return;
    }

    try {
      await onUpload(file);
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch {
      // O componente pai exibe o erro retornado pela API.
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className={`file-picker${file ? ' file-picker-selected' : ''}`} htmlFor="document-file">
        <span className="file-picker-mark" aria-hidden="true">+</span>
        <span className="file-picker-copy">
          <strong>{file ? file.name : 'Escolha um arquivo'}</strong>
          <span>{file ? `${(file.size / 1024).toFixed(1)} KB` : 'ou arraste até aqui'}</span>
        </span>
        <span className="file-picker-action">Procurar</span>
        <input
          ref={inputRef}
          id="document-file"
          type="file"
          onChange={handleFileChange}
          disabled={isUploading}
          aria-describedby={validationError ? 'upload-validation-error' : 'upload-help'}
        />
      </label>
      <div className="upload-submit-row">
        <p id="upload-help" className="upload-help">Qualquer formato · Máximo 10 MiB</p>
        <button className="primary-button" type="submit" disabled={!file || isUploading}>
          {isUploading ? 'Enviando...' : 'Enviar arquivo'}
        </button>
      </div>
      {validationError && <p className="field-error" id="upload-validation-error">{validationError}</p>}
    </form>
  );
}