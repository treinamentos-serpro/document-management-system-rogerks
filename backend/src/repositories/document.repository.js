const { access, unlink } = require('node:fs/promises');
const documents = new Map();

async function save(document) {
  if (documents.has(document.id)) {
    throw new Error('Identificador de documento duplicado');
  }

  documents.set(document.id, document);
}

function findAll() {
  return [...documents.values()].sort((first, second) => {
    const dateOrder = second.uploadedAt.localeCompare(first.uploadedAt);
    return dateOrder || first.id.localeCompare(second.id);
  });
}

async function findDownloadById(id) {
  const document = documents.get(id);
  if (!document) {
    return null;
  }

  try {
    await access(document.storagePath);
    return document;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

async function deleteStoredFile(filePath) {
  try {
    await unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

module.exports = {
  save,
  findAll,
  findDownloadById,
  deleteStoredFile,
};