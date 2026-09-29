const { test } = require('node:test');
const { before, after } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { unlink } = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

async function uploadFixture(t) {
  const content = 'Conteúdo de teste do documento';
  const form = new FormData();
  form.append('file', new Blob([content], { type: 'text/plain' }), 'documento.txt');

  const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
  assert.equal(response.status, 201);
  const document = await response.json();
  t.after(() => unlink(path.resolve(__dirname, '../storage', document.id)));
  return { document, content };
}

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('POST /upload salva e retorna os metadados do documento', async (t) => {
  const { document, content } = await uploadFixture(t);

  assert.match(document.id, /^[0-9a-f-]{36}$/);
  assert.equal(document.originalName, 'documento.txt');
  assert.equal(document.size, Buffer.byteLength(content));
  assert.equal(document.owner, null);
  assert.ok(!Number.isNaN(Date.parse(document.uploadedAt)));
});

test('GET /documents lista os documentos enviados', async (t) => {
  const { document } = await uploadFixture(t);

  const response = await fetch(`${baseUrl}/documents`);
  assert.equal(response.status, 200);
  const documents = await response.json();
  assert.ok(documents.some((item) => item.id === document.id && item.originalName === document.originalName));
});

test('GET /documents/:id/download retorna o arquivo enviado', async (t) => {
  const { document, content } = await uploadFixture(t);

  const response = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/octet-stream');
  assert.match(response.headers.get('content-disposition'), /documento\.txt/);
  assert.equal(await response.text(), content);
});
