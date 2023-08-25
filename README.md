# <img src="assets/icons/jira.png" alt="Jira Checker" width="32" height="32"> Jira Checker

Ao iniciar a aplicação, um ícone será adicionado ao System Tray, e ele irá sinalizar as situações:

> <img src="assets/icons/jira-white-32.png" alt="Nenhuma tarefa" width="12" height="12"> - Nenhuma tarefa
>
> <img src="assets/icons/jira-blue/1.png" alt="Nenhuma tarefa" width="12" height="12"> - Um tarefa, ou mais (o badge numerico indica a quantidade de tarefas atribuídas)

A verificação de tarefas ocorre automáticamente a cada 5 minutos, e caso existam novas tarefas, uma notificação será exibida informando a quantidade de novas tarefas.

Ao clicar no ícone, no System Tray, serão exibidas as opções:

- **Ver todas as tarefas:** abre a aplicação, no link informado na instalação (caso não tenha informado, será aberta a página "Seu Trabalho");
- **X tarefas atribuidas:** um submenu contendo as tarefas atribuídas e as respectivas situações. Ex.: VRS-123 (Pendente). Ao clicar, a tarefa será aberta na aplicação;
- **Página Inicial:** abre a aplicação, na página inicial do Jira;
- **Exibir:** abre a aplicação, na última página exibida;
- **Fechar:** encerra a aplicação

Ao clicar no botão para fechar a janela da aplicação, e aplicação não será encerrada, e sim minimizada no System Tray.

## Setup

### Pré Requisitos

- [Node.js 16^](https://nodejs.org/pt-br/download)

### Install

- Clone o repositório;
- Navegue pelo terminal até a pasta do repositório e execute: `./start`
- Ao executar pela primeira vez, alguns dados de acesso serão solicitados. Siga as instruções no terminal.

### Start

Para iniciar a aplicação, navegue pelo terminal até a pasta do repositório e execute: `./start`

### Configurar

Para editar as configurações o arquivo `config.json`, que fica na raiz do repositório, deve ser alterado.

Para resetar as configurações, apague o arquivo `config.json`.

## Útil

A credencial de acesso ao Jira, solicitada no primeiro start, pode ser gerada [neste link](https://id.atlassian.com/manage/api-tokens)

## TODO

Visualizar [aqui](./TODO.md)
