import type { ChannelModel, ConfirmChannel } from "amqplib";

export interface MensagemConsulta {
  id: number;
}

export interface ConexaoRabbit {
  conexao: ChannelModel;
  canal: ConfirmChannel;
}
