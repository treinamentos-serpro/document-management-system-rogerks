const { randomUUID } = require('node:crypto');
const { mkdir } = require('node:fs/promises');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const documentController = require('../controllers/document.controller');

const router = express.Router();
const storageDirectory = path.resolve(__dirname, '../../storage');
const storage = multer.diskStorage({
  destination(request, file, callback) {
    mkdir(storageDirectory, { recursive: true })
      .then(() => callback(null, storageDirectory), callback);
  },
  filename(request, file, callback) {
    const id = randomUUID();
    request.documentId = id;
    callback(null, id);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/upload', upload.single('file'), documentController.upload);
router.get('/documents', documentController.list);
router.get('/documents/:id/download', documentController.download);

router.use((error, request, response, next) => {
  if (response.headersSent) {
    return next(error);
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return response.status(413).json({
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'O arquivo excede o limite de 10 MiB.',
        },
      });
    }

    return response.status(400).json({
      error: {
        code: 'INVALID_UPLOAD',
        message: 'A requisição de upload é inválida.',
      },
    });
  }

  if (error.code && ['EACCES', 'EPERM', 'ENOSPC', 'EROFS', 'EMFILE', 'ENFILE'].includes(error.code)) {
    return response.status(500).json({
      error: {
        code: 'STORAGE_ERROR',
        message: 'Não foi possível gravar o arquivo.',
      },
    });
  }

  return response.status(400).json({
    error: {
      code: 'INVALID_UPLOAD',
      message: 'A requisição de upload é inválida.',
    },
  });
});

module.exports = router;