const { Menu, MenuItem } = require('electron');
const { loadConfig } = require('./config.service');

async function handleMenu(app, mainWindow, tasks) {
  const config = await loadConfig();

  const subMenuTaks = new Menu();

  let taskAtribuidaLabel = 'Nenhuma tarefa atribuida';

  if (tasks.length > 0) {
    taskAtribuidaLabel = `${tasks.length} tarefa atribuída`;

    if (tasks.length > 1) {
      taskAtribuidaLabel = `${tasks.length} tarefas atribuídas`;
    }
  }

  tasks.forEach((task) => {
    subMenuTaks.append(
      new MenuItem({
        label: `${task.key} (${task.status})`,
        click: function () {
          mainWindow.loadURL(`${config.url}/browse/${task.key}`);
          mainWindow.maximize();
        },
      }),
    );
  });

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Ver todas tarefas',
      click: function () {
        mainWindow.loadURL(`${config.urlTaskClick}`);
        mainWindow.maximize();
      },
    },
    {
      label: taskAtribuidaLabel,
      submenu: subMenuTaks,
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
        mainWindow.maximize();
      },
    },
    {
      label: 'Fechar',
      click: function () {
        app.exit(0);
      },
    },
  ]);

  return contextMenu;
}

module.exports = { handleMenu };
