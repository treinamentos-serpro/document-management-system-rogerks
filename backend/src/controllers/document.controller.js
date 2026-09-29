const documentService = require('../services/document.service');

function sendError(response, error, fallback) {
  const status = error.status || fallback.status;
  const code = error.code || fallback.code;
  const message = error.status ? error.message : fallback.message;

  return response.status(status).json({
    error: { code, message },
  });
}

async function upload(request, response) {
  try {
    const document = await documentService.upload(request.file && {
      id: request.documentId,
      originalName: request.file.originalname,
      size: request.file.size,
      storagePath: request.file.path,
    });

    return response.status(201).json(document);
  } catch (error) {
    return sendError(response, error, {
      status: 500,
      code: 'STORAGE_ERROR',
      message: 'Não foi possível salvar o documento.',
    });
  }
}

async function list(request, response) {
  try {
    const documents = await documentService.list();
    return response.status(200).json(documents);
  } catch (error) {
    return sendError(response, error, {
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Não foi possível listar os documentos.',
    });
  }
}

async function download(request, response) {
  let document;

  try {
    document = await documentService.getDownload(request.params.id);
  } catch (error) {
    return sendError(response, error, {
      status: 500,
      code: 'STORAGE_ERROR',
      message: 'Não foi possível baixar o documento.',
    });
  }

  return response.download(
    document.filePath,
    document.originalName,
    { headers: { 'Content-Type': 'application/octet-stream' } },
    (error) => {
      if (!error || response.headersSent) {
        return;
      }

      if (error.code === 'ENOENT') {
        return response.status(404).json({
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Documento não encontrado.',
          },
        });
      }

      return response.status(500).json({
        error: {
          code: 'STORAGE_ERROR',
          message: 'Não foi possível baixar o documento.',
        },
      });
    },
  );
}

module.exports = {
  upload,
  list,
  download,
};