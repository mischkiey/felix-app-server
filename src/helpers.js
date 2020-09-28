var Fraction = require('fraction.js');

const { selectUserAllowance } = require("../automationHelpers");

const selectBalance = async (db, id) => {
  const res = await db('users').where({ id }).select('balance').first();
  return res.balance;
};

const updateBalance = async (db, id, amount) => {
  await db('users')
    .where({ id })
    .update({ balance: db.raw(`?? + ${amount}`, ['balance'])});
};

const selectTotalSaved = async (db, id) => {
  const res = await db('users').where({ id }).select('total_saved').first();
  return res.total_saved;
};

const updateTotalSaved = async (db, id, amount) => {
  await db('users').where({ id })
    .update({ total_saved: db.raw(`?? + ${amount}`, ['total_saved'])});
};

const selectTransactionAmount = async (db, type, id) => {
  let name = type;
  if (type === 'expenses') name = 'expense';
  const result = await db(type).where({ id })
    .select(`${name}_amount`).first();
  return result[`${name}_amount`];
};

const convertToCents = (dollars) => {
  return dollars * 100;
};

const convertToDollars = (cents) => {
  return cents / 100;
};

const convertTransactionsToDollars = (arr, type) => {
  return arr.map(obj => {
    const dollarAmount = convertToDollars(obj[`${type}_amount`]);
    obj[`${type}_amount`] = dollarAmount;
    return obj;
  });
};

const getDifference = (oldAmt, newAmt) => {
  return (oldAmt - newAmt) * -1;
};

/**
 * Allocates funds based on ratios provided
 * Returns array of allocation amounts for each ratio
 * 
 * @param {Array} ratios - each index represents the part of a part:whole ratio
 * @param {Number} amount - total amount to be allocated
 * @returns {Array}
 */
const allocate = (ratios, amount) => {
  let remainder = amount;
  let results = [];
  let total = 0;

  //total shares equals sum of ratios
  ratios.forEach(ratio => total += ratio);

  //each share equals ratio/total from amount
  ratios.forEach(ratio => {
    const share = Math.floor(amount * ratio/total);
    results.push(share);
    remainder -= share;
  });

  //add one from remainder to each share until no remainder
  for (let i = 0; remainder > 0; i++) {
    results[i] = results[i] + 1;
    remainder --;
  };

  return results;
};

/**
 *  Gets total number of user goals
 *  determines deallocation amount for each goal based on amount provided
 *  subtracts deallocation amount from each goal
 * 
 * @param {Function} trx - knex transaction connection
 * @param {Number} user_id
 * @param {Number} amount - total amount to deallocate from user's goals 
 */
const deallocateGoals = async (trx, user_id, amount) => {
  try {
    //only deallocate from goals that have money 
    const goals = await trx('goals').select().where({ user_id }).andWhere('current_amount', '>', 0);
    const totalSaved = await selectTotalSaved(trx, user_id);
    let ratios = [];
    
    goals.forEach(goal => {
      const ratio = new Fraction(goal.current_amount / totalSaved);
      ratios.push(ratio.n); // numerator of fraction
    });

    const deallocateAmt = allocate(ratios, amount);
  
    for (let i = 0; i < goals.length; i++) {
      const goal = goals[i];
      await trx('goals').where({ id: goal.id })
        .update({ current_amount: trx.raw(`?? - ${deallocateAmt[i]}`, ['current_amount'])}); 

      await updateTotalSaved(trx, goal.user_id, deallocateAmt[i] * -1);
    };

  } catch (error) {
    console.log(error)
  }
};

/**
 * 
 * @param {Function} trx - knex transaction connection 
 * @param {Number} id - userId
 * @param {Number} amount - total amount to add to allowance. To subtract, add a negative number.
 */
const updateAllowance = async (trx, id, amount) => {
  try {
    let allowance = await selectUserAllowance(id);
    const totalSaved = await selectTotalSaved(trx, id);
    const difference = allowance + amount;
    let deallocateAmt;

    if (difference < 0) {
      amount = allowance * -1; // subtract allowance from itself. prevents negative allowance
      
      (totalSaved + difference <= 0) 
        ? deallocateAmt = totalSaved // deallocate totalSaved, prevents negative goals
        : deallocateAmt -= difference;

      await deallocateGoals(trx, id, deallocateAmt);
    } else amount -= totalSaved;

    const balance = await selectBalance(trx, id);
    allowance = balance - totalSaved;
    if (totalSaved === 0) allowance = balance;
    if (balance <= 0) allowance = 0;
    
    await trx('users')
      .where({ id })
      .update({ allowance: allowance});
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  selectTransactionAmount,
  convertToCents,
  convertToDollars,
  convertTransactionsToDollars,
  getDifference,
  updateAllowance,
  updateBalance,
  updateTotalSaved,
};

