const { app, shell, Menu, Tray, BrowserWindow } = require('electron');
const iconWhite32 = 'assets/icons/jira-white-32.png';
const iconApp = 'assets/icons/jira.png';

let tray = null;
let config = null;

let mainWindow = null;

app.whenReady().then(() => {
  tray = new Tray(iconWhite32);
  tray.setToolTip('Jira Checker');

  loadConfig();

  loadMainWindow();

  findNewTask(true);
});

function loadMainWindow() {
  mainWindow = new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    icon: iconApp,
    title: 'Jira Checker',
  });

  mainWindow.on('close', (event) => {
    mainWindow.hide();
    event.preventDefault();
  });

  mainWindow.loadURL(`${config.url}`);

  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
}

function loadConfig() {
  const fs = require('fs');

  if (!fs.existsSync('./config.json')) {
    const prompt = require('prompt-sync')({ sigint: true });

    const url = prompt(
      'Informe a Jira URL (algo parecido com https://nome-empresa.atlassian.net): ',
    );
    const urlTaskClick =
      prompt(
        'Informe a URL que será aberta ao clicar nas tarefas atribuidas (não obrigatório): ',
      ) || url + '/jira/your-work';
    const email = prompt('Informe o email do seu usuário no Jira: ');
    const senha = prompt(
      'Informe seu Token de API do Jira (voce pode obter/gerar ele aqui: https://id.atlassian.com/manage/api-tokens): ',
    );

    const auth = Buffer.from(email + ':' + senha).toString('base64');

    const configuration = {
      url,
      urlTaskClick,
      email,
      auth,
    };

    fs.writeFileSync('./config.json', JSON.stringify(configuration));
  }

  config = require('./config.json');
}

function findNewTask(startSchedule) {
  info('finding new tasks...');

  const request = require('request');

  const url = `${config.url}/rest/api/2/search?jql=assignee='${config.email}'%26status!=Fechado%26status!=Cancelado`;

  const options = {
    method: 'GET',
    url,
    headers: {
      Authorization: 'Basic ' + config.auth,
      Cookie:
        'atlassian.xsrf.token=c3a8200b-d485-4dee-9483-17a1e8bed68d_ac1e044ab5b03283892abe2f1e8bf103a713fc47_lin',
    },
  };

  request(options, function (err, response) {
    try {
      if (err) throw new Error(err);

      const result = JSON.parse(response.body);

      if (result.errorMessages) {
        error(result.errorMessages);
        return;
      }

      if (result.warningMessages) {
        warning(result.warningMessages);
        return;
      }

      info(`tarefas atribuidas: ${result.total}`);

      updateContextMenu(result.total);
    } catch (err) {
      error(`Erro obtendo novas tarefas(${err.message})`);
    }
  });

  if (startSchedule) {
    scheduleFindNewTaks();
  }
}

function scheduleFindNewTaks() {
  const cron = require('node-cron');

  cron.schedule('*/5 * * * *', () => {
    findNewTask(false);
  });
}

function updateContextMenu(taskCount) {
  let taskAtribuidaLabel = 'Nenhuma task atribuida';

  if (taskCount > 0) {
    let iconWithTaks = 'assets/icons/jira-blue/+9.png';

    if (taskCount < 10) {
      iconWithTaks = `assets/icons/jira-blue/${taskCount}.png`;
    }

    tray.setImage(iconWithTaks);
    taskAtribuidaLabel = `${taskCount} task(s) atribuída(s)`;
  } else {
    tray.setImage(iconWhite32);
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: taskAtribuidaLabel,
      click: function () {
        mainWindow.loadURL(`${config.urlTaskClick}`);
        mainWindow.maximize();
      },
    },
    { type: 'separator' },
    {
      label: 'Página Inicial',
      click: function () {
        mainWindow.loadURL(`${config.url}`);
        mainWindow.maximize();
      },
    },
    { type: 'separator' },
    {
      label: 'Exibir',
      click: function () {
        mainWindow.show();
      },
    },
    {
      label: 'Fechar',
      click: function () {
        app.exit(0);
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function info(message) {
  console.info(new Date(), message);
}

function error(message) {
  console.error(new Date(), `Error: ${message}`);
}
function warning(message) {
  console.log(new Date(), `Warning: ${message}`);
}
