const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, writeFile } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const documentService = require('../../src/services/document.service');

test('o upload retorna apenas os metadados públicos do documento', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'dms-service-'));
  const storagePath = path.join(directory, 'document.txt');
  await writeFile(storagePath, 'conteúdo');

  const document = await documentService.upload({
    id: `service-test-${Date.now()}-upload`,
    originalName: 'document.txt',
    size: 9,
    storagePath,
  });

  assert.deepStrictEqual(document, {
    id: document.id,
    originalName: 'document.txt',
    size: 9,
    uploadedAt: document.uploadedAt,
    owner: null,
  });
  assert.equal(Object.hasOwn(document, 'storagePath'), false);
});

test('o download retorna o caminho e o nome original', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'dms-service-'));
  const storagePath = path.join(directory, 'document.txt');
  const id = `service-test-${Date.now()}-download`;
  await writeFile(storagePath, 'conteúdo');
  await documentService.upload({
    id,
    originalName: 'document.txt',
    size: 9,
    storagePath,
  });

  assert.deepStrictEqual(await documentService.getDownload(id), {
    filePath: storagePath,
    originalName: 'document.txt',
  });
});
