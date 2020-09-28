const xss = require("xss");

const GoalsService = {
  getGoal(db, id) {
    return db('goals')
      .select('*')
      .where({ id })
      .first();
  },

  getGoals(db, user_id) {
    return db('goals')
      .select('*')
      .where({ user_id });
  },

  createGoal(db, newGoal) {
    return db('goals')
      .insert(newGoal);
  },

  updateGoal(db, id, updatedGoal) {
    return db('goals')
      .where({ id })
      .update(updatedGoal);
  },

  deleteGoal(db, id) {
    return db('goals')
      .where({id})
      .del();
  },

  sanitizeGoal(goal) {
    return {
      ...goal,
      name: xss(goal.name)
    }
  },
}

module.exports = GoalsService;