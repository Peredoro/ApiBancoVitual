const express = require('express');
const router = express.Router();

const controladorContas = require('../controladores/controladorContas');
//listar contas existentes
router.get('/contas', controladorContas.listarContas);
//criar uma conta
router.post('/contas', controladorContas.criarConta);
//atualizar usuario
router.put('/contas/:numeroConta/usuario', controladorContas.atualizarUsuarioConta)
//excluir conta saldo zerado
router.delete('/contas/:numeroConta', controladorContas.excluirConta)
//deposito em contas
router.post('/transacoes/depositar', controladorContas.depositar)
//saque de uma conta
router.post('/transacoes/sacar', controladorContas.sacarDaConta)
//transferir valores entre contas diferentes
router.post('/transacoes/transferir', controladorContas.transferir)
//visualizar saldo de uma conta
router.get('/contas/saldo', controladorContas.obterSaldo)
//visualizar extrato
router.get('/contas/extrato', controladorContas.obterExtrato)


module.exports = router;