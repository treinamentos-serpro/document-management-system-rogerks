const documentRepository = require('../repositories/document.repository');

function createServiceError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
  };
}

async function upload(file) {
  if (!file) {
    throw createServiceError(400, 'FILE_REQUIRED', 'Envie um arquivo no campo "file".');
  }

  const document = {
    id: file.id,
    originalName: file.originalName,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: null,
    storagePath: file.storagePath,
  };

  try {
    await documentRepository.save(document);
  } catch (error) {
    try {
      await documentRepository.deleteStoredFile(file.storagePath);
    } catch {
      // Preserve the repository failure; the API must not expose filesystem details.
    }

    throw createServiceError(500, 'STORAGE_ERROR', 'Não foi possível registrar o documento.');
  }

  return toPublicDocument(document);
}

async function list() {
  const documents = documentRepository.findAll();
  return documents.map(toPublicDocument);
}

async function getDownload(id) {
  let document;

  try {
    document = await documentRepository.findDownloadById(id);
  } catch {
    throw createServiceError(500, 'STORAGE_ERROR', 'Não foi possível ler o documento.');
  }

  if (!document) {
    throw createServiceError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  return {
    filePath: document.storagePath,
    originalName: document.originalName,
  };
}

module.exports = {
  upload,
  list,
  getDownload,
};