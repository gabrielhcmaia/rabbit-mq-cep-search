import { connect } from "amqplib";
import type { ConfirmChannel } from "amqplib";
import type { ConexaoRabbit, MensagemConsulta } from "../types/rabbit.ts";

export const FILA_CEPS = "ceps";

export async function conectar(): Promise<ConexaoRabbit> {
  const conexao = await connect("amqp://localhost");
  const canal = await conexao.createConfirmChannel();
  await canal.assertQueue(FILA_CEPS, { durable: true });

  return { conexao, canal };
}

export function publicarConsulta(canal: ConfirmChannel, id: number): void {
  const mensagem: MensagemConsulta = { id };
  canal.sendToQueue(FILA_CEPS, Buffer.from(JSON.stringify(mensagem)), {
    persistent: true,
  });
}
