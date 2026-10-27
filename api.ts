import express from "express";
import type { Request, Response } from "express";
import { AdicionarCep, BuscarCep } from "./db.ts";
import { conectar, publicarConsulta } from "./rabbit/rabbit.ts";
import type {
  CepInvalido,
  CepProcessado,
  CorpoPostCep,
  RespostaErro,
  RespostaGetCep,
  RespostaPostCep,
} from "./types/api.ts";

const app = express();
const port = 3000;
const LIMIT_LOTE = 100;
app.use(express.json());

const { canal } = await conectar();

app.post(
  "/cep",
  async (
    req: Request<Record<string, never>, RespostaPostCep, CorpoPostCep | undefined>,
    res: Response<RespostaPostCep>,
  ) => {
    const ceps = req.body?.ceps;

    if (!Array.isArray(ceps)) {
      return res.status(400).json({
        errors: [{ cep: ceps, motivo: "O campo ceps deve ser uma lista" }],
      });
    }

    const cepsValidos: CepProcessado[] = [];
    const cepsInvalidos: CepInvalido[] = [];

    for (const cep of ceps as unknown[]) {
      if (typeof cep !== "string" || !/^\d{5}-?\d{3}$/.test(cep)) {
        cepsInvalidos.push({ cep, motivo: "Formato inválido" });
        continue;
      }
      const cepLimpo = cep.replace("-", "");

      const id = await AdicionarCep(cepLimpo);
      publicarConsulta(canal, id);
      cepsValidos.push({ id, cepLimpo });
    }

    if (cepsValidos.length === 0) {
      return res.status(400).json({ errors: cepsInvalidos });
    }

    return res
      .status(202)
      .json({ cepsProcessados: cepsValidos, erros: cepsInvalidos });
  },
);

app.get(
  "/cep/:id",
  async (
    req: Request<{ id: string }>,
    res: Response<RespostaGetCep | RespostaErro>,
  ) => {
    const id = Number(req.params.id);
    const cepBuscado = Number.isInteger(id) ? await BuscarCep(id) : undefined;
    if (!cepBuscado) {
      return res.status(404).json({ erro: "Cep não encontrado" });
    }

    return res.status(200).json({
      cep: cepBuscado.cep,
      status: cepBuscado.status,
      dados: cepBuscado.dados,
      erro: cepBuscado.erro,
    });
  },
);

app.listen(port, () => {
  console.log(`Servidor rodando em: http://localhost:${port}`);
});
