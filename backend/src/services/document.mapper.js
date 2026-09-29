function toDocumentRecord(file, uploadedAt) {
  return {
    id: file.id,
    originalName: file.originalName,
    size: file.size,
    uploadedAt,
    owner: null,
    storagePath: file.storagePath,
  };
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

function toDownloadDocument(document) {
  return {
    filePath: document.storagePath,
    originalName: document.originalName,
  };
}

module.exports = {
  toDocumentRecord,
  toPublicDocument,
  toDownloadDocument,
};
