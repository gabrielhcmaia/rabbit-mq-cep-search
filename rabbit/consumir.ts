import { conectar, FILA_CEPS } from "./rabbit.ts";
import type { MensagemConsulta } from "../types/rabbit.ts";

const { canal } = await conectar();
console.log("Aguardando mensagens");

await canal.consume(FILA_CEPS, (msg) => {
  if (msg === null) {
    return;
  }

  const conteudo = JSON.parse(msg.content.toString()) as MensagemConsulta;
  console.log("Mensagem recebida: ", conteudo);
  canal.ack(msg);
});
