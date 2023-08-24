function info(message) {
  console.info(new Date(), message);
}

function error(message) {
  console.error(new Date(), `Error: ${message}`);
}
function warning(message) {
  console.log(new Date(), `Warning: ${message}`);
}

module.exports = { info, error, warning };
