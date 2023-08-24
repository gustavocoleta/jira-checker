const fs = require('fs');
const path = require('path');

async function checkAndWriteConfig() {
  if (!fs.existsSync(path.join(__dirname, '../') + 'config.json')) {
    const url = await readOutput(
      'Informe a Jira URL (algo parecido com https://nome-empresa.atlassian.net): ',
    );

    const urlTaskClick =
      (await readOutput(
        'Informe a URL que será aberta para visualizar todas as tarefas (não obrigatório): ',
      )) || url + '/jira/your-work';

    const email = await readOutput('Informe o email do seu usuário no Jira: ');

    const senha = await readOutput(
      'Informe seu Token de API do Jira (voce pode obter/gerar ele aqui: https://id.atlassian.com/manage/api-tokens): ',
    );

    const auth = Buffer.from(email + ':' + senha).toString('base64');

    const configuration = {
      url,
      urlTaskClick,
      email,
      auth,
    };

    fs.writeFileSync(
      path.join(__dirname, '../') + 'config.json',
      JSON.stringify(configuration),
    );
  }
}

async function readOutput(mensagem) {
  return new Promise((resolve, reject) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question(mensagem, (name) => {
      resolve(name);
      readline.close();
    });
  }).then((data) => {
    return data;
  });
}

async function loadConfig() {
  await checkAndWriteConfig();

  const contentConfig = fs.readFileSync(
    path.join(__dirname, '../') + 'config.json',
    'utf8',
  );

  return JSON.parse(contentConfig);
}

module.exports = { loadConfig };
