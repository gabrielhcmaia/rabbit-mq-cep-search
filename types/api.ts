import type { DadosCep, StatusCep } from "./db.ts";

export interface CorpoPostCep {
  ceps?: unknown;
}

export interface CepProcessado {
  id: number;
  cepLimpo: string;
}

export interface CepInvalido {
  cep: unknown;
  motivo: string;
}

export type RespostaPostCep =
  | { errors: CepInvalido[] }
  | { cepsProcessados: CepProcessado[]; erros: CepInvalido[] };

export interface RespostaGetCep {
  cep: string;
  status: StatusCep;
  dados: DadosCep | null;
  erro: string | null;
}

export interface RespostaErro {
  erro: string;
}
