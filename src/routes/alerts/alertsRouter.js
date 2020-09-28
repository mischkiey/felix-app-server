const express = require('express');
const { requireAuth } = require('../../middleware/jwtAuth');
const { getUserAlerts, updateAlert } = require('./alertsService');

const alertsRouter = express.Router();

alertsRouter
  .route('/')
  .get(requireAuth, async (req, res, _next) => {
    try {
      const userId = req.userId;
      const db = req.app.get('db');
      const alerts = await getUserAlerts(db, userId);
      return res.send(alerts)
    } catch (error) {
      console.log(error)
    }
  });

alertsRouter
  .route('/:id')
  .patch(requireAuth, async (req, res, _next) => {
    const id = req.params.id;
    const db = req.app.get('db');
    try {
      if (!req.body.read) {
        return res.status(400).json({
          error: 'Invalid request'
        });
      };
      
      const result = await updateAlert(db, id, req.body.read);

      if (!result[0]) {
        return res.status(404).json({
          error: 'Alert not found'
        });
      };

      return res.status(204).end();

    } catch (error) {
      console.log(error);
    }
  })

module.exports = alertsRouter;