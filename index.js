const { app, shell, Tray, BrowserWindow, Notification } = require('electron');
const { handleMenu } = require('./src/menu.service');
const { info, error, warning } = require('./src/log.service');
const { getTarefas } = require('./src/tarefa.service');
const { loadConfig } = require('./src/config.service');
const request = require('request');
const icon = 'assets/icons/jira.png';

let config = null;
let tray = null;
let mainWindow = null;
let notification = null;

let lastTaskCheck = null;

app.setName('Jira Checker');

app.whenReady().then(async () => {
  tray = new Tray(icon);
  tray.setToolTip('Jira Checker');

  config = await loadConfig();

  await initialize();
});

async function initialize() {
  mainWindow = new BrowserWindow({
    show: true,
    autoHideMenuBar: true,

    icon: icon,
    title: 'Jira Checker',
  });

  mainWindow.on('close', (event) => {
    mainWindow.hide();
    event.preventDefault();
  });

  mainWindow.on('show', () => {
    findNewTask(false);
  });

  mainWindow.on('focus', () => {
    findNewTask(false);
  });

  mainWindow.loadURL(`${config.url}`);

  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  notification = new Notification({
    title: 'Jira Checker',
    icon: icon,
  });

  notification.on('click', () => {
    mainWindow.loadURL(`${config.urlTaskClick}`);
    mainWindow.maximize();
  });

  await findNewTask(true);
}

async function findNewTask(startSchedule) {
  info('finding new tasks...');

  const result = await getTarefas();

  if (result.errorMessages) {
    error(result.errorMessages);
    return;
  }

  if (result.warningMessages) {
    warning(result.warningMessages);
    return;
  }

  info(`tarefas atribuidas: ${result.total}`);

  const tasks = [];

  result.issues.forEach((issue) => {
    tasks.push({ key: issue.key, status: issue.fields.status.name });
  });

  await updateTrayMenu(tasks);

  await checkNotification(tasks);

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

async function updateTrayMenu(tasks) {
  if (tasks.length > 0) {
    let iconWithTaks = 'assets/icons/badge/+3.png';

    if (tasks.length <= 3) {
      iconWithTaks = `assets/icons/badge/${tasks.length}.png`;
    }

    tray.setImage(iconWithTaks);
  } else {
    tray.setImage(icon);
  }

  const menu = await handleMenu(app, mainWindow, tasks);

  tray.setContextMenu(menu);
}

async function checkNotification(tasks) {
  if (!lastTaskCheck) {
    lastTaskCheck = tasks;
    return;
  }

  const newTask = tasks.map((task) => `${task.key}`);
  const oldTask = lastTaskCheck.map((task) => `${task.key}`);

  const countDiff = newTask.length - oldTask.length;

  const isEqual =
    JSON.stringify(newTask.sort()) === JSON.stringify(oldTask.sort());

  if (!isEqual && countDiff > 0) {
    let mensagem = `Você tem ${countDiff} nova tarefa`;

    if (countDiff > 1) {
      mensagem = `Você tem ${countDiff} novas tarefas`;
    }

    notification.body = mensagem;
    notification.show();

    if (config.webHookNewTask) {
      request({
        method: 'GET',
        url: config.webHookNewTask,
      });
    }
  }

  lastTaskCheck = tasks;
}
