import express from "express";
import { AdicionarCep, BuscarCep } from "./db.js";
import { conectar, publicarConsulta } from "./rabbit/rabbit.js";

const app = express();
const port = 3000;
const LIMIT_LOTE = 100;
app.use(express.json());

const { canal } = await conectar();

app.post("/cep", (req, res) => {
  const ceps = req.body?.ceps;

  const cepsValidos = [];
  const cepsInvalidos = [];

  for (const cep of ceps) {
    if (typeof cep !== "string" || !/^\d{5}-?\d{3}$/.test(cep)) {
      cepsInvalidos.push({ cep, motivo: "Formato inválido" });
      continue;
    }
    const cepLimpo = cep.replace("-", "");

    const id = AdicionarCep(cepLimpo);
    publicarConsulta(canal, id);
    cepsValidos.push({ id, cepLimpo });
  }

  if (cepsValidos.length === 0) {
    return res.status(400).json({ errors: cepsInvalidos });
  }

  return res
    .status(202)
    .json({ cepsProcessados: cepsValidos, erros: cepsInvalidos });
});

app.get("/cep/:id", (req, res) => {
  const cepBuscado = BuscarCep(req.params.id);
  if (!cepBuscado) {
    return res.status(404).json({ erro: "Cep não encontrado" });
  }

  return res.status(200).json({
    cep: cepBuscado.cep,
    status: cepBuscado.status,
    dados: cepBuscado.dados,
    erro: cepBuscado.erro,
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em: http://localhost:${port}`);
});
