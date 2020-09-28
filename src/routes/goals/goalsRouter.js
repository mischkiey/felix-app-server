const express = require('express');
const xss = require('xss');
const { requireAuth } = require('../../middleware/jwtAuth');
const goalsRouter = express.Router();

const {
  getGoal,
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  sanitizeGoal,
} = require('./GoalsService');

const { 
  convertToCents,
  convertToDollars } = require('../../helpers');
const moment = require('moment');

goalsRouter.use(requireAuth);
goalsRouter
  .route('/')
  .get(async(req, res, next) => {
  try {
    /**
     * @argument {object} - Database meta
     * @argument {number} - User ID
     * @returns {array} - Array of goal objects
     */
    const goals = await getGoals(req.app.get('db'), req.userId);

    // Convert any amount to dollars before sending it back to client side 
    if(goals.length) {
      const convertedGoals = goals.map(goal => ({
          ...goal,
          name: xss(goal.name),
          goal_amount: convertToDollars(goal.goal_amount),
          current_amount: convertToDollars(goal.current_amount),
          contribution_amount: convertToDollars(goal.contribution_amount),
          end_date: moment(goal.end_date).format(),
        })
      );

      return res.json(convertedGoals);
    }
    
    // return res.json([]);
    return res.json(goals);
  }
  catch(error) {
    next(error);
  }
  })
  .post(async(req, res, next) => {
    // Retrieve inputs
    const user_id = req.userId;
    const { name, goal_amount, contribution_amount, end_date} = req.body;
    
    // Validate inputs
    // req.body only contains the inputs destructured above
    for(const [key, value] of Object.entries(req.body)) {
      if(!value) {
        return res
          .status(400)
          .json({
            error: `Missing ${key} in body`
          })
      }
    }

    // Compose new goal object with converted amounts
    const newGoal = {
      user_id,
      name,
      goal_amount: convertToCents(goal_amount),
      contribution_amount: convertToCents(contribution_amount),
      // Moment parses PostgreSQL date format correctly
      end_date,
    }
    
    // Insert new goal object into database
    // Send appropriate response
    try {
      /**
       * @argument {object} - Database meta
       * @argument {object} - New goal object
      */
      const response = await createGoal(req.app.get('db'), newGoal);

      return res
        .status(201)
        .json({message: 'Goal succesfully added'});
      // return res
      //   .status(204)
      //   .json({});
    }
    catch(error) {
      next(error)
    }
  });

goalsRouter
  .route('/:id')
  .get(async(req, res, next) => {
    try {
      /**
       * @argument {object} - Database meta
       * @argument {number} - Goal ID
       * @returns {array} - Array of goal objects
       */
      let goal = await getGoal(req.app.get('db'), req.params.id);
  
      // Convert any amount to dollars before sending it back to client side 
      if(!goal) {
        return res
          .status(400)
          .json({
            error: 'Invalid goal ID'
          });
      }
      
      goal = {
        ...goal,
        goal_amount: convertToDollars(goal.goal_amount),
        current_amount: convertToDollars(goal.current_amount),
        contribution_amount: convertToDollars(goal.contribution_amount),
        end_date: moment(goal.end_date).format(),
      }
      return res.json(sanitizeGoal(goal));
    }
    catch(error) {
      next(error);
    }
  })
  .patch(async(req, res, next) => {
    // Retrieve inputs
    const { name, goal_amount, contribution_amount, end_date } = req.body;
   
    // const tempObj = {name, goal_amount, contribution_amount, end_date};
    for(const [key, value] of Object.entries(req.body)) {
      if(!value) {
        return res
          .status(400)
          .json({
            error: `Missing ${key} in body`
          })
      }
    }

    // Compose updated goal object with converted amounts
    const updatedGoal = {
      name,
      goal_amount: convertToCents(goal_amount),
      contribution_amount: convertToCents(contribution_amount),
      // moment parses PostgreSQL date format correctly
      end_date,
    }
    
    // Insert updated goal object into database
    // Send appropriate response
    try {
      /**
       * @argument {object} - Database meta
       * @argument {object} - Updated goal object
      */
      const response = await updateGoal(req.app.get('db'), req.params.id, updatedGoal);
      
      if(!response) {
        return res
          .status(400)
          .json({
            error: 'Invalid goal id'
          })
      }

      return res
        .status(201)
        .json({message: 'Goal succesfully updated'});
      // return res
      //   .status(204)
      //   .json({});
    }
    catch(error) {
      next(error)
    }
  })
  .delete(async(req, res, next) => {  
    try {
      /**
       * @argument {object} - Database meta
       * @argument {number} - Goal id
      */
      const response = await deleteGoal(req.app.get('db'), req.params.id);

      if(!response) {
        return res
          .status(400)
          .json({
            error: 'Invalid goal id'
          })
      }

      return res
        .status(200)
        .json({message: 'Goal succesfully deleted'});
      // return res
      //   .status(204)
      //   .json({});
    }
    catch(error) {
      next(error)
    }
  });

module.exports = goalsRouter;

