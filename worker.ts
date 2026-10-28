import { setTimeout } from "node:timers/promises";
import { BuscarCep, AtualizarCep } from "./db.ts";
import type { ConsumeMessage } from "amqplib";
import { conectar, FILA_CEPS } from "./rabbit/rabbit.ts";
import type { RespostaViaCep } from "./types/db.ts";
import type { MensagemConsulta } from "./types/rabbit.ts";

const DELAY_MS = Number(process.env.DELAY_MS ?? 0);
const VIACEP_URL = process.env.VIACEP_URL ?? "https://viacep.com.br";
const { canal } = await conectar();

await canal.prefetch(5);
console.log("Worker conectado, Aguardando Mensagens...");

const handler = async (msg: ConsumeMessage | null) => {
  if (!msg) {
    return;
  }

  const { id } = JSON.parse(msg.content.toString()) as MensagemConsulta;
  console.log(`Worker recebeu id: ${id}`);

  try {
    const registro = await BuscarCep(id);

    if (!registro) {
      console.log(`ID ${id} lido pelo worker, não existe no banco`);
      canal.ack(msg);
      return;
    }

    await AtualizarCep(id, "processando");

    await setTimeout(DELAY_MS);
    const response =  await fetch(`${VIACEP_URL}/ws/${registro.cep}/json/`);

    if (!response.ok) {
      console.log(`Worker recebeu do viacep: ${response.status}`);
      await AtualizarCep(id, "erro", null, `viacep respondeu: ${response.status}`);
      canal.nack(msg, false, false);
      return;
    }

    const dados = (await response.json()) as RespostaViaCep;

    if ("erro" in dados) {
      await AtualizarCep(id, "erro", null, "CEP não encontrado");
    } else {
      await AtualizarCep(id, "concluido", dados);
    }

    canal.ack(msg);
  } catch (erro: any) {
    console.error(` Worker falhou com id: ${id}`);
    console.error(erro);
    await AtualizarCep(id, "erro", null, `erro: ${erro.message}`);
    canal.nack(msg, false, false);
  }
};

canal.consume(FILA_CEPS, handler, { noAck: false });
