# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web simples para enviar, listar e baixar documentos, mantendo os arquivos no filesystem local e seus metadados em memória.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem dos documentos conhecidos pela instância em execução.
- Download de um documento pelo identificador.
- Armazenamento local dos arquivos em `backend/storage`, usando `multer` com `diskStorage`.
- Interface web para interagir com os três recursos, consumindo a API por meio do proxy `/api` do Vite.
- Metadados mantidos em memória durante a execução do processo.

### Fora do escopo

- Armazenamento externo, em nuvem ou em serviços de terceiros.
- Banco de dados ou persistência dos metadados entre reinicializações.
- Autenticação, autorização e isolamento efetivo de documentos por usuário.
- Versionamento, edição, compartilhamento ou exclusão de documentos.
- Paginação, busca, filtros e upload de múltiplos arquivos em uma requisição.
- Allowlist de tipos de arquivo; o limite de tamanho é aplicado independentemente do tipo.
- Reconciliação ou limpeza automática de arquivos que permaneçam no disco sem metadados após uma reinicialização.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | O sistema deve aceitar o envio de um único arquivo por requisição multipart. | Uma requisição válida com o campo `file` cria um documento e retorna seus metadados. |
| RF-02 | O sistema deve exigir que a requisição de upload contenha um arquivo. | A ausência do arquivo retorna `400` com código `FILE_REQUIRED`. |
| RF-03 | O sistema deve limitar cada arquivo a 10 MiB (10.485.760 bytes). | Arquivo acima do limite retorna `413` com código `FILE_TOO_LARGE` e não fica disponível como documento. |
| RF-04 | O sistema deve armazenar o conteúdo do arquivo localmente em `backend/storage`. | Upload concluído grava o arquivo no filesystem local usando `multer` e `diskStorage`; nenhum serviço externo é utilizado. |
| RF-05 | O sistema deve gerar um identificador único para cada documento. | O identificador é gerado no servidor e não depende do nome enviado pelo cliente. |
| RF-06 | O sistema deve registrar metadados do documento em memória após salvar o arquivo. | A resposta do upload contém os metadados públicos definidos no modelo de dados. |
| RF-07 | O sistema deve listar os documentos registrados na instância atual. | A resposta inclui os metadados públicos, ordenados do upload mais recente para o mais antigo; lista vazia retorna `200` com `[]`. |
| RF-08 | O sistema deve permitir baixar um documento existente pelo identificador. | A resposta contém o arquivo como anexo e usa o nome original no nome de download. |
| RF-09 | O sistema deve responder quando o identificador solicitado não corresponder a um documento disponível. | Download com identificador inexistente retorna `404` com código `DOCUMENT_NOT_FOUND`, sem expor caminhos locais. |
| RF-10 | O sistema deve apresentar erros de operação em formato JSON consistente. | Erros da API incluem código estável e mensagem segura, sem stack trace ou detalhes internos de filesystem. |
| RF-11 | A interface deve permitir enviar um arquivo, consultar a listagem e iniciar o download de um item listado. | As ações usam a API por `fetch` e apresentam erros retornados pela API de forma compreensível. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | O backend deve usar Node.js e Express em JavaScript CommonJS; o frontend deve usar React e Vite em JavaScript ESM. |
| RNF-02 | O backend deve seguir Clean Architecture simples: `routes -> controllers -> services -> repositories`. |
| RNF-03 | `routes` delegam para controllers; controllers tratam HTTP e validação básica; services concentram regras de negócio; repositories tratam metadados e acesso aos arquivos. |
| RNF-04 | Os arquivos devem ser gravados somente no filesystem local em `backend/storage`, via `multer` configurado com `diskStorage`. |
| RNF-05 | Os metadados devem permanecer em memória. Reiniciar o processo remove os registros; arquivos remanescentes não são recuperados automaticamente. |
| RNF-06 | A configuração operacional deve respeitar 12-Factor e usar variáveis de ambiente quando aplicável. A porta HTTP é configurada por `PORT`; o diretório de armazenamento permanece definido como `backend/storage` nesta fase. |
| RNF-07 | O identificador ou nome físico do arquivo deve ser gerado pelo servidor. O nome fornecido pelo usuário não pode ser usado para construir caminhos no filesystem. |
| RNF-08 | O sistema deve limitar o tamanho do upload a 10 MiB, sem restringir o tipo MIME nesta fase. |
| RNF-09 | Respostas de erro não devem revelar caminhos absolutos, stack traces ou detalhes internos de filesystem. |
| RNF-10 | O armazenamento em memória pressupõe uma única instância do backend; execução em múltiplas instâncias não é suportada nesta fase. |
| RNF-11 | Testes de backend devem usar o runner nativo `node:test`; não é necessário introduzir novas dependências para os contratos descritos. |

## 5. Modelo de dados

### Metadados públicos do documento

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | UUID gerado pelo servidor e usado nas rotas de download. |
| `originalName` | string | Sim | Nome original recebido no multipart, preservado como metadado e nome sugerido no download. |
| `size` | number | Sim | Tamanho do conteúdo em bytes. Deve ser menor ou igual a 10.485.760. |
| `uploadedAt` | string | Sim | Data e hora do upload em ISO 8601, normalizada para UTC. |
| `owner` | string ou `null` | Sim | Identificador do dono, reservado para uma futura fase com identidade. No MVP é `null`; não representa autorização nem isolamento. |

### Referência interna de armazenamento

O repository mantém uma referência interna ao nome físico gerado para o arquivo. Essa referência não faz parte do objeto público da API. O nome físico deve ser independente do nome original e não pode permitir que uma entrada do cliente escolha um caminho arbitrário.

Os metadados existem somente na memória do processo. Ao reiniciar o backend, os registros deixam de existir mesmo que os arquivos permaneçam em `backend/storage`; não há reconstrução automática do catálogo.

Exemplo de objeto público:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-09-29T12:00:00.000Z",
  "owner": null
}
```

## 6. Contratos de API

### Convenções

- Os caminhos abaixo são os caminhos montados pelo Express e não incluem `/api`.
- No ambiente de desenvolvimento, o frontend chama `/api/...`; o proxy do Vite remove `/api` e encaminha a requisição ao backend.
- O corpo dos erros é JSON no formato `{ "error": { "code": "...", "message": "..." } }`.
- As mensagens podem ser exibidas ao usuário; os códigos são estáveis para tratamento programático.
- Nenhuma resposta pública inclui o caminho ou nome físico do arquivo no servidor.

### `POST /upload`

Envia um documento.

**Entrada**

- `Content-Type: multipart/form-data`.
- Campo de arquivo obrigatório: `file`.
- Um único arquivo por requisição.
- Tamanho máximo: 10 MiB (10.485.760 bytes).
- Qualquer tipo de arquivo é aceito no MVP; não há allowlist de MIME.

**Sucesso: `201 Created`**

Retorna o objeto público do documento como JSON.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-09-29T12:00:00.000Z",
  "owner": null
}
```

**Erros**

| Status | Código | Condição |
| --- | --- | --- |
| `400` | `FILE_REQUIRED` | Campo `file` ausente ou sem arquivo. |
| `400` | `INVALID_UPLOAD` | Requisição multipart inválida ou campo inesperado. |
| `413` | `FILE_TOO_LARGE` | Arquivo excede 10 MiB. |
| `500` | `STORAGE_ERROR` | Falha ao gravar o arquivo ou registrar seus metadados. |

### `GET /documents`

Lista os metadados dos documentos registrados na memória do processo.

**Entrada**

- Sem parâmetros obrigatórios.
- Não há paginação nem filtragem no MVP.
- A lista contém todos os documentos conhecidos pela instância; não há filtro ou autorização por `owner`.

**Sucesso: `200 OK`**

Retorna um array JSON de objetos públicos, ordenado de `uploadedAt` mais recente para mais antigo. Sem documentos, retorna `[]`.

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "relatorio.pdf",
    "size": 24576,
    "uploadedAt": "2026-09-29T12:00:00.000Z",
    "owner": null
  }
]
```

**Erros**

| Status | Código | Condição |
| --- | --- | --- |
| `500` | `INTERNAL_ERROR` | Falha inesperada ao consultar os metadados. |

### `GET /documents/:id/download`

Baixa o conteúdo do documento associado ao identificador.

**Entrada**

- `id` é o UUID retornado pelo upload ou pela listagem.

**Sucesso: `200 OK`**

- Corpo: conteúdo binário do arquivo.
- `Content-Type: application/octet-stream`.
- `Content-Disposition: attachment`, com o nome original codificado com segurança como nome sugerido para download.
- O arquivo é localizado pela referência interna associada ao `id`; o caminho nunca é derivado diretamente do parâmetro da rota.

**Erros**

| Status | Código | Condição |
| --- | --- | --- |
| `404` | `DOCUMENT_NOT_FOUND` | Não existe metadado para o `id` ou o arquivo local correspondente não está disponível. |
| `500` | `STORAGE_ERROR` | Falha de leitura do arquivo por erro de filesystem diferente de arquivo ausente. |

### Exemplo de erro

```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "O arquivo excede o limite de 10 MiB."
  }
}
```

## 7. Decisões arquiteturais

- O fluxo do backend é `routes -> controllers -> services -> repositories`; camadas internas não conhecem Express nem detalhes de transporte.
- Routes definem e conectam endpoints. Controllers traduzem requisições/respostas HTTP e validações de borda. Services aplicam regras de upload, listagem e download. Repositories mantêm metadados em memória e coordenam o acesso ao filesystem local.
- O uso de `multer` com `diskStorage` fica na borda de entrada do backend; o serviço não deve depender de objetos de requisição do Express.
- A criação do arquivo usa um nome físico gerado pelo servidor. `originalName` é metadado e nome de download, nunca caminho de armazenamento.
- Arquivo e metadados são registrados somente após o upload local ser concluído. Se o registro falhar depois da gravação, a implementação deve tentar remover o arquivo criado para evitar resíduo imediato.
- Frontend React consome a API via `fetch` usando o prefixo `/api`; o proxy Vite encaminha para as rotas Express sem esse prefixo.
- `owner` é reservado, `null` no MVP. Nenhum requisito deve sugerir que documentos são privados ou isolados por usuário sem autenticação/autorização.
- Arquivos ficam em disco, mas o catálogo em memória não sobrevive a reinicializações. Banco de dados, recuperação e limpeza de órfãos são decisões futuras.
- Sem armazenamento distribuído, a aplicação atende uma única instância de backend nesta fase.

## 8. Plano de execução

As etapas abaixo descrevem entregas e verificações futuras. Esta especificação não executa nem altera arquivos de backend ou frontend.

1. **Preparação do backend:** estabelecer o fluxo de dependências da Clean Architecture simples e os limites de configuração. Critério: rotas delegam às camadas internas sem transferir responsabilidades de HTTP para services ou repositories.
2. **Upload local:** implementar o contrato multipart com limite de 10 MiB, nome físico gerado pelo servidor e metadados em memória. Critério: upload válido retorna `201`; entradas inválidas e falhas retornam o status/código definidos, sem deixar documento parcialmente registrado.
3. **Listagem e download:** implementar listagem ordenada e download pelo `id`, usando a referência interna ao arquivo. Critério: respostas seguem os contratos e não expõem caminho local; identificadores ou arquivos indisponíveis retornam `404`.
4. **Interface web:** permitir envio, consulta dos documentos e download pela API via proxy `/api`. Critério: os fluxos funcionam com sucesso e exibem erros de forma compreensível.
5. **Integração e aceite:** validar os três fluxos, limite de upload, erros, comportamento com lista vazia e reinicialização do processo. Critério: testes cobrem regras e contratos; fica documentado que metadados são voláteis e arquivos sem metadados não são recuperados.

## Critérios gerais de aceite

- As operações de upload, listagem e download correspondem aos contratos desta especificação.
- Nenhum arquivo é enviado a armazenamento externo; os arquivos são gravados localmente via `multer`/`diskStorage`.
- Os metadados ficam em memória e o comportamento após reinicialização é explícito.
- A API não expõe caminhos internos nem deriva caminhos de armazenamento de entradas do cliente.
- A arquitetura respeita as quatro camadas e a direção de dependências definida.
- A ausência de autenticação é clara: o MVP não garante privacidade ou isolamento por usuário.