# rabbit-mq-cep-search

Consulta de CEPs de forma assíncrona usando RabbitMQ.

A API recebe uma lista de CEPs, salva cada um no SQLite com status `pendente` e publica o id na fila `ceps`. O worker consome a fila, consulta o [ViaCEP](https://viacep.com.br) e grava o resultado no banco. Depois é só consultar pelo id.

```
POST /cep ──► SQLite (pendente) ──► fila "ceps" ──► worker ──► ViaCEP ──► SQLite (concluido | erro)
```

Mensagens que falham vão para a fila `ceps.dlq` (dead letter).

## Requisitos

- Node 22.22+ (roda `.ts` direto, sem build)
- Docker (para o RabbitMQ)

## Como rodar

```bash
npm install
docker compose up -d
npm run api
npm run worker
```

`api` e `worker` rodam em terminais separados. A API sobe em `http://localhost:3000` e o painel do RabbitMQ em `http://localhost:15672` (usuário e senha `guest`).

## Uso

Enviar CEPs:

```bash
curl -X POST http://localhost:3000/cep \
  -H "Content-Type: application/json" \
  -d '{"ceps": ["01001-000", "20040020"]}'
```

Resposta (`202`):

```json
{ "cepsProcessados": [{ "id": 1, "cepLimpo": "01001000" }, { "id": 2, "cepLimpo": "20040020" }], "erros": [] }
```

Consultar o resultado:

```bash
curl http://localhost:3000/cep/1
```

O `status` pode ser `pendente`, `processando`, `concluido` ou `erro`.

## Variáveis de ambiente

Opcionais, lidas de um `.env` na raiz se existir.

| Variável     | Padrão                 | Para que serve                              |
| ------------ | ---------------------- | ------------------------------------------- |
| `RABBIT_URL` | `amqp://localhost`     | Endereço do RabbitMQ                        |
| `DELAY_MS`   | `0`                    | Espera artificial no worker (simula lentidão) |
| `VIACEP_URL` | `https://viacep.com.br` | Base da API de CEP                         |

## Outros scripts

- `npm run publicar`: publica uma mensagem de teste na fila
- `npm run consumir`: só lê e imprime as mensagens da fila
- `npm run typecheck`: checa os tipos com `tsc`
