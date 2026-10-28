export type StatusCep = "pendente" | "processando" | "concluido" | "erro";

export interface DadosCep {
  cep: string;
  logradouro: string;
  complemento: string;
  unidade: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
  regiao: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

export interface ErroViaCep {
  erro: boolean | string;
}

export type RespostaViaCep = DadosCep | ErroViaCep;

export interface LinhaCep {
  id: number;
  cep: string;
  status: StatusCep;
  dados: string | null;
  erro: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface RegistroCep extends Omit<LinhaCep, "dados"> {
  dados: DadosCep | null;
}
