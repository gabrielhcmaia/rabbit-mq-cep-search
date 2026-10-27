import { conectar, publicarConsulta } from "./rabbit.ts";

const { conexao, canal } = await conectar();

publicarConsulta(canal, 1);

await canal.waitForConfirms();

console.log("Publicado!");

await conexao.close();
