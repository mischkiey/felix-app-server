// this script will be automated by Heroku Scheduler
// it will run every every sunday at 00:01 UTC
// for dev, we'll run it every 2 minutes


// this script needs to query the goals table
// select all goals that are not complete
// join the users table on uid and select balance and allowance
// for each goal -> 
//  if allowance > contribution amt. -> 
//    get allowance
//    if goal amt. - current amt. > contribution amt. ->      
//      subtract contribution amt. from allowance && add to current amt.
//      update db
//      continue with next goal
//    if goal amt. - current amt. = contribution amt. ->
//      subtract contribution amt. from allowance && add to current amt.
//      set "completed" to true
//      alert user: goal successful
//      update db
//      continue with next goal
//    if goal amt. - current amt. < contribution amt. ->
//      subtract (goal amt. - current amt.) from allowance && add to current amt.
//      set "completed" column true
//      alert user: goal successful
//      update db
//      continue with next goal
//    
//  if allowance < contribution amt. -> 
//    alert user: not enough allowance to fund goal
//    update db
//    continue with next goal


//check end date

const {
  asyncForEach,
  selectGoals,
  createAlert,
  selectUserAllowance,
  moveContribution,
  completeGoal,
} = require('./automationHelpers');

async function automatedGoals () {
  try {
    // select all incomplete goals
    const goals = await selectGoals({ 'completed': 'false' });

    await asyncForEach(goals, async goal => {
      //get allowance on each iteration to account for potential changes
      const allowance = await selectUserAllowance(goal.user_id);
      
      // if there's enough allowance to make a contribution
      if (allowance > goal.contribution_amount) {
        // if the amount needed to compelete the goal is greater than the contribution
        if (goal.goal_amount - goal.current_amount > goal.contribution_amount) {
          return moveContribution(goal, allowance, adjusted = false);
        }
        // if the amount needed to complete the goal is equal to the contribution
        if (goal.goal_amount - goal.current_amount === goal.contribution_amount) {
          return completeGoal(goal, allowance, adjusted = false);
        }
        // if the amount needed to complete the goal is less than the contribution
        // the contribution amount needs to be adjusted
        // prevents the current amount from exceeding goal amount
        if (goal.goal_amount - goal.current_amount < goal.contribution_amount) {
          return completeGoal(goal, allowance, adjusted = true);
        }
      } 
      // if there's not enough allowance to make a contribution 
      if (allowance < goal.contribution_amount) {
        await createAlert(goal.user_id, complete = false, goal.name);
        return;
      }
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = automatedGoals;