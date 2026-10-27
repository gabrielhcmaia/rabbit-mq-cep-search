import { DatabaseSync } from "node:sqlite";
import type {
  DadosCep,
  LinhaCep,
  RegistroCep,
  StatusCep,
} from "./types/db.ts";

const db = new DatabaseSync("ceps.db");
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA busy_timeout = 5000");

db.exec(`
    CREATE TABLE IF NOT EXISTS ceps (
        id INTEGER PRIMARY KEY,
        cep TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pendente'
        CHECK (status IN ('pendente', 'processando', 'concluido', 'erro')),
        dados JSON CHECK (dados IS NULL OR json_valid(dados)),
        erro TEXT,
        criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    `);

const inserir = db.prepare(`INSERT INTO ceps (cep) VALUES (?)`);
const buscar = db.prepare(`SELECT * FROM ceps WHERE id = ?`);
const atualizar = db.prepare(`UPDATE ceps
        SET status = ?, dados = ?, erro = ?, atualizado_em = CURRENT_TIMESTAMP
        WHERE id = ?
    `);

export async function AdicionarCep(cep: string): Promise<number> {
  return Number(inserir.run(cep).lastInsertRowid);
}

export async function BuscarCep(id: number): Promise<RegistroCep | undefined> {
  const linha = buscar.get(id) as LinhaCep | undefined;
  if (!linha) {
    return undefined;
  }

  return {
    ...linha,
    dados: linha.dados === null ? null : (JSON.parse(linha.dados) as DadosCep),
  };
}

export async function AtualizarCep(
  id: number,
  status: StatusCep,
  dados: DadosCep | null = null,
  erro: string | null = null,
): Promise<void> {
  atualizar.run(status, dados && JSON.stringify(dados), erro, id);
}
