const bancodedados = require('../bancodedados');
const validator = require('validator');

function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, ''); 

    if (cpf.length !== 11 || /^(.)\1+$/.test(cpf)) {
        return false; 
    }

    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = soma % 11;
    let digitoVerificador1 = resto < 2 ? 0 : 11 - resto;
    if (parseInt(cpf.charAt(9)) !== digitoVerificador1) {
        return false;
    }

    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = soma % 11;
    let digitoVerificador2 = resto < 2 ? 0 : 11 - resto;
    if (parseInt(cpf.charAt(10)) !== digitoVerificador2) {
        return false;
    }

    return true; 
}

function obterDataAtualFormatada() {
    const dataAtual = new Date();
    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const dia = String(dataAtual.getDate()).padStart(2, '0');
    const horas = String(dataAtual.getHours()).padStart(2, '0');
    const minutos = String(dataAtual.getMinutes()).padStart(2, '0');
    const segundos = String(dataAtual.getSeconds()).padStart(2, '0');

    return `${ano}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
}


function listarContas(req, res) {
    //listar contas bancárias
    const senhaBanco = req.query.senha_banco;
    
    if (!senhaBanco) {
        return res.status(400).json({ mensagem: "A senha do banco não foi informada!" });
    }
    if (senhaBanco !== bancodedados.banco.senha) {
        return res.status(401).json({ mensagem: "A senha do banco informada é inválida!" });
    }

    res.json(bancodedados.contas);
}

function criarConta(req, res) {

    const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;


    if (!nome || !cpf || !data_nascimento || !telefone || !email || !senha) {
        return res.status(400).json({ mensagem: "Todos os campos são obrigatórios!" });
    }

    const cpfExistente = bancodedados.contas.find(conta => conta.usuario.cpf === cpf);
    const emailExistente = bancodedados.contas.find(conta => conta.usuario.email === email);

    if (!validator.isEmail(email)) {
        return res.status(400).json({ mensagem: "O e-mail informado é inválido!" });
    }

    if (!validarCPF(cpf)) {
        return res.status(400).json({ mensagem: "O CPF informado é inválido!" });
    }

    if (cpfExistente || emailExistente) {
        return res.status(400).json({ mensagem: "Já existe uma conta com o CPF ou e-mail informado!" });
    }

    const numeroConta = gerarNumeroContaUnico();
    const novaConta = {
        numero: numeroConta,
        saldo: 0,
        usuario: {
            nome,
            cpf,
            data_nascimento,
            telefone,
            email,
            senha
        }
    };

    bancodedados.contas.push(novaConta);

    res.sendStatus(201); 
}

function atualizarUsuarioConta(req, res) {
    const numeroConta = req.params.numeroConta;
    const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;

    if (!nome || !cpf || !data_nascimento || !telefone || !email || !senha) {
        return res.status(400).json({ mensagem: "Todos os campos são obrigatórios!" });
    }

    const contaExistente = bancodedados.contas.find(conta => conta.numero === numeroConta);
    if (!contaExistente) {
        return res.status(404).json({ mensagem: "Número da conta inválido!" });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ mensagem: "O e-mail informado é inválido!" });
    }

    if (!validarCPF(cpf)) {
        return res.status(400).json({ mensagem: "O CPF informado é inválido!" });
    }

    const cpfExistente = bancodedados.contas.find(conta => conta.usuario.cpf === cpf && conta.numero !== numeroConta);
    if (cpfExistente) {
        return res.status(400).json({ mensagem: "O CPF informado já existe cadastrado!" });
    }

    const emailExistente = bancodedados.contas.find(conta => conta.usuario.email === email && conta.numero !== numeroConta);
    if (emailExistente) {
        return res.status(400).json({ mensagem: "O E-mail informado já existe cadastrado!" });
    }

    const usuario = {
        nome,
        cpf,
        data_nascimento,
        telefone,
        email,
        senha
    };
    contaExistente.usuario = usuario;

    res.sendStatus(204);
}

function excluirConta(req, res) {
    const numeroConta = req.params.numeroConta;
    const contaExistente = bancodedados.contas.find(conta => conta.numero === numeroConta);

    if (!contaExistente) {
        return res.status(404).json({ mensagem: "Número da conta inválido!" });
    }

    if (contaExistente.saldo !== 0) {
        return res.status(400).json({ mensagem: "A conta só pode ser removida se o saldo for zero!" });
    }

    bancodedados.contas = bancodedados.contas.filter(conta => conta.numero !== numeroConta);

    res.sendStatus(204);
}

function depositar(req, res) {
    const { numero_conta, valor } = req.body;

    if (!numero_conta || !valor) {
        return res.status(400).json({ mensagem: "O número da conta e o valor do depósito são obrigatórios!" });
    }

    const conta = bancodedados.contas.find(conta => conta.numero === numero_conta);
    if (!conta) {
        return res.status(404).json({ mensagem: "Conta bancária não encontrada!" });
    }

    if (valor <= 0) {
        return res.status(400).json({ mensagem: "Valor de depósito inválido!" });
    }

    conta.saldo += valor;

    const transacao = {
        data: obterDataAtualFormatada(),
        numero_conta,
        valor,
        tipo: "depósito"
    };

    bancodedados.depositos.push(transacao);

    res.sendStatus(204);
}

function sacarDaConta(req, res) {
    const { numero_conta, valor, senha } = req.body;

    if (!numero_conta || !valor || !senha) {
        return res.status(400).json({ mensagem: "O número da conta, o valor do saque e a senha são obrigatórios!" });
    }

    const conta = bancodedados.contas.find(conta => conta.numero === numero_conta);
    if (!conta) {
        return res.status(404).json({ mensagem: "Conta bancária não encontrada!" });
    }

    if (senha !== conta.usuario.senha) {
        return res.status(401).json({ mensagem: "Senha incorreta!" });
    }

    if (valor <= 0 || valor > conta.saldo) {
        return res.status(400).json({ mensagem: "Valor de saque inválido ou saldo insuficiente!" });
    }

    conta.saldo -= valor;

    const saque = {
        data: obterDataAtualFormatada(),
        numero_conta,
        valor: -valor 
    };

    bancodedados.saques.push(saque);

    res.sendStatus(204); 
}

function transferir(req, res) {
    const { numero_conta_origem, numero_conta_destino, valor, senha } = req.body;

    if (!numero_conta_origem || !numero_conta_destino || !valor || !senha) {
        return res.status(400).json({ mensagem: "Todos os campos são obrigatórios!" });
    }

    const contaOrigem = bancodedados.contas.find(conta => conta.numero === numero_conta_origem);
    const contaDestino = bancodedados.contas.find(conta => conta.numero === numero_conta_destino);
    if (!contaOrigem || !contaDestino) {
        return res.status(404).json({ mensagem: "Conta de origem ou destino não encontrada!" });
    }

    if (numero_conta_origem === numero_conta_destino) {
        return res.status(400).json({ mensagem: "Não é possível transferir para a mesma conta!" });
    }

    if (contaOrigem.usuario.senha !== senha) {
        return res.status(401).json({ mensagem: "Senha incorreta!" });
    }

    if (contaOrigem.saldo < valor) {
        return res.status(403).json({ mensagem: "Saldo insuficiente!" });
    }

    contaOrigem.saldo -= valor;

    contaDestino.saldo += valor;

    const transferencia = {
        data: obterDataAtualFormatada(),
        numero_conta_origem,
        numero_conta_destino,
        valor
    };
    bancodedados.transferencias.push(transferencia);

    res.sendStatus(204); 
}

function obterSaldo(req, res) {
    const { numero_conta, senha } = req.query;

    if (!numero_conta || !senha) {
        return res.status(400).json({ mensagem: "Número da conta e senha são obrigatórios." });
    }

    const conta = bancodedados.contas.find(conta => conta.numero === numero_conta);

    if (!conta) {
        return res.status(404).json({ mensagem: "Conta bancária não encontrada." });
    }

    if (conta.usuario.senha !== senha) {
        return res.status(401).json({ mensagem: "Senha inválida." });
    }

    res.status(200).json({ saldo: conta.saldo });
}

function obterExtrato(req, res) {
    const { numero_conta, senha } = req.query;

    if (!numero_conta || !senha) {
        return res.status(400).json({ mensagem: "Número da conta e senha são obrigatórios." });
    }

    const conta = bancodedados.contas.find(conta => conta.numero === numero_conta);

    if (!conta) {
        return res.status(404).json({ mensagem: "Conta bancária não encontrada." });
    }

    if (conta.usuario.senha !== senha) {
        return res.status(401).json({ mensagem: "Senha inválida." });
    }

    const depositos = bancodedados.depositos.filter(deposito => deposito.numero_conta === numero_conta);
    const saques = bancodedados.saques.filter(saques => saques.numero_conta === numero_conta);
    const transferenciasConta = bancodedados.transferencias.filter(transferencia => transferencia.numero_conta_destino === numero_conta);

    res.status(200).json({ depositos, saques, transferenciasConta });
}


const numerosCriados = []
function gerarNumeroContaUnico() {
    const numeroConta = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const numeroExistente = numerosCriados.find(numero => numero === numeroConta);
    if (numeroExistente) {
        return gerarNumeroContaUnico(); 
    }
    numerosCriados.push(numeroConta);
    return numeroConta;
}

module.exports = {
    listarContas,
    criarConta,
    atualizarUsuarioConta,
    excluirConta,
    depositar,
    sacarDaConta,
    transferir,
    obterSaldo,
    obterExtrato
};