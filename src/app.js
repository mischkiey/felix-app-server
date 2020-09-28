const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
// Variables
const app = express();
const morganOption = NODE_ENV === 'production' ? 'tiny' : 'common';
// Middleware
const errorHandler = require('./middleware/errorHandler');
// Routers
const usersRouter = require('./routes/users/usersRouter');
const goalsRouter = require('./routes/goals/goalsRouter');
const transactionsRouter = require('./routes/transactions/transactionsRouter');
const alertsRouter = require('./routes/alerts/alertsRouter');

app.get('/', (req, res) => {
  res.status(200).send('Hello, world!');
});
app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/alerts', alertsRouter);

app.use(errorHandler);

module.exports = app;
