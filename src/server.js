require('dotenv').config();
const app = require('./app');
const knex = require('knex');
const { PORT, DATABASE_URL } = require('./config');

//  pg returns number values as strings
//  this converts bigint type to int
var types = require('pg').types;
types.setTypeParser(20, function(val) {
  return parseInt(val);
});

const db = knex({
  client: 'pg',
  connection: DATABASE_URL,
});

app.set('db', db);

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
