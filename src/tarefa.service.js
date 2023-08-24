const request = require('request');
const { loadConfig } = require('./config.service');

async function getTarefas() {
  const config = await loadConfig();

  return new Promise((resolve, reject) => {
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
      resolve(JSON.parse(response.body));
    });
  }).then((data) => {
    return data;
  });
}

module.exports = { getTarefas };
