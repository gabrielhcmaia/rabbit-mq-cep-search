import { connect } from "amqplib";
import type { ConfirmChannel } from "amqplib";
import type { ConexaoRabbit, MensagemConsulta } from "../types/rabbit.ts";

export const FILA_CEPS = "ceps";
const FILA_CEPS_DLQ = "ceps.dlq";
const EXCHANGE_DLX = "ceps.dlx";

export async function conectar(): Promise<ConexaoRabbit> {
  const conexao = await connect(process.env.RABBIT_URL ?? "amqp://localhost");
  const canal = await conexao.createConfirmChannel();

  await canal.assertExchange(EXCHANGE_DLX, "fanout", { durable: true });
  await canal.assertQueue(FILA_CEPS_DLQ, { durable: true });
  await canal.bindQueue(FILA_CEPS_DLQ, EXCHANGE_DLX, "");
  await canal.assertQueue(FILA_CEPS, {
    durable: true,
    deadLetterExchange: EXCHANGE_DLX,
  });

  return { conexao, canal };
}

export function publicarConsulta(canal: ConfirmChannel, id: number): void {
  const mensagem: MensagemConsulta = { id };
  canal.sendToQueue(FILA_CEPS, Buffer.from(JSON.stringify(mensagem)), {
    persistent: true,
  });
}
