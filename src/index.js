const express = require('express');
const bodyParser = require('body-parser');
const rotas = require('./roteamento/rotas');

const app = express();

app.use(express.json());

// Usar as rotas definidas no arquivo rotas
app.use(rotas);

app.listen(3000, () => {
    console.log(`Servidor rodando na porta 3000`);
});