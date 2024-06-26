const { Menu, MenuItem, dialog } = require('electron');
const { loadConfig } = require('./config.service');
const fs = require('fs');
const path = require('path');

async function handleMenu(app, mainWindow, tasks) {
  const config = await loadConfig();

  const subMenuTaks = new Menu();
  const subMenuFavoriteProjects = new Menu();

  const configFavorites = config.favoriteProjects || [];

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

  // montar atravez da request p/ ober o nome, e deixar na config só o key
  configFavorites.forEach((project) => {
    subMenuFavoriteProjects.append(
      new MenuItem({
        label: project.name,
        click: function () {
          mainWindow.loadURL(`${config.url}/browse/${project.key}`);
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
    {
      label: 'Projetos Favoritos',
      submenu: subMenuFavoriteProjects,
      id: 'favoriteProjects',
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
    { type: 'separator' },
    {
      label: 'Sobre',
      click: function () {
        const contentPackage = fs.readFileSync(
          path.join(__dirname, '../') + 'package.json',
          'utf8',
        );

        const versao = JSON.parse(contentPackage).version;

        dialog.showMessageBox({
          type: 'question',
          message: 'Jira Checker',
          detail: `Versão: ${versao}`,
        });
      },
    },
  ]);

  if (configFavorites.length === 0) {
    contextMenu.items.find(
      (item) => item.id === 'favoriteProjects',
    ).visible = false;
  }

  return contextMenu;
}

module.exports = { handleMenu };
