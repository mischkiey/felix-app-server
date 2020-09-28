const knex = require("knex");
const { DATABASE_URL } = require('./src/config');
const { updateTotalSaved } = require('./src/helpers');

//  pg returns numeric values as strings
//  this converts all numeric types to floats (decimal)
var types = require('pg').types
types.setTypeParser(1700, function(val) {
  return parseFloat(val)
});

var types = require('pg').types
types.setTypeParser(20, function(val) {
  return parseFloat(val)
});

const db = knex({
  client: 'pg',
  connection: DATABASE_URL,
});

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

const selectGoals = async params => {
  return await db('goals')
    .select(
      'goals.id',
      'goals.name',
      'user_id',
      'goal_amount',
      'contribution_amount',
      'current_amount',
      'end_date',
      'completed',
      'users.allowance',
      'users.balance',
    )
    .where(params)
    .join('users', {'goals.user_id': 'users.id'});
};

const selectUserAllowance = async id => {
  const result = await db('users')
    .select('allowance')
    .where({ id })
    .first();

  return result.allowance;
};

const updateGoal = async (id, params) => {
  await db('goals')
    .where({ id })
    .update(params);
};

const createAlert = async (user_id, complete, name) => {
  return await db('alerts')
    .insert({
      'user_id': user_id,
      'title': complete ? 'Goal Complete!' : 'Insufficient Allowance.',
      'message': complete ? `You completed your goal, ${name}` : `Looks like you don't have enough allowance to fund your goal, ${name}`,
    });
};

/**
 * Subtracts contribution amount from allowance, and adds to goal
 * Updates goal, allowance, and total saved
 * 
 * @param {Object} goal - goal object from goals table 
 * @param {Number} allowance - allowance from users table 
 * @param {Boolean} adjusted - adjusts value of contribution amount if true
 */
const moveContribution = async (goal, allowance, adjusted) => {
  // calculate the difference if the contibution amt needs to be adjusted
  const difference = goal.goal_amount - goal.current_amount;
  let amount = goal.contribution_amount;
  // subtract contribution amount from allowance

  adjusted
    ? allowance -= difference // if true, subtract difference from allowance 
    : allowance -= goal.contribution_amount;  //if false, subtract contribution amount from allowance

  // add contribution amount to goal's current amount
  adjusted
    ? goal.current_amount += difference //if true, add difference to current amt
    : goal.current_amount += goal.contribution_amount; // if false, add contribution amt to current amt

  console.log(goal.current_amount)

  if (adjusted) amount = difference;

  await db.transaction(async trx => {
    // update allowance value on users table
    await trx('users')
      .where({ 'id': goal.user_id})
      .update({ allowance: allowance });

    await updateTotalSaved(trx, goal.user_id, amount);
    
    // update current amount in goals table
    await updateGoal(goal.user_id, { 'current_amount': goal.current_amount });
  });
};

/**
 * Sets user goal as completed 
 * 
 * @param {Object} goal - goal object from goals table 
 * @param {Number} allowance - allowance from users table
 * @param {Boolean} adjusted - adjusts value of contribution amount if true
 */
const completeGoal = async (goal, allowance, adjusted,) => {
  await db.transaction(async trx => {
    await moveContribution(goal, allowance, adjusted);
    await updateGoal(goal.id, { 'completed': true });
    await createAlert(goal.user_id, complete = true, goal.name);
  });
};

module.exports = {
  asyncForEach,
  selectGoals,
  updateGoal,
  createAlert,
  selectUserAllowance,
  moveContribution,
  completeGoal,
};