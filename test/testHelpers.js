/* eslint-disable quotes */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const knex = require('knex');
const moment = require ('moment');
const { convertToDollars } = require('../src/helpers');

const makeKnexInstance = () => {
  return knex({
    client: 'pg',
    connection: process.env.TEST_DATABASE_URL,
  });
}

const makeAuthHeader = (user, secret = process.env.JWT_SECRET) => {
  const token = jwt.sign({ user_id: user.id }, secret, {
    subject: user.username,
    algorithm: 'HS256',
  });
  return `Bearer ${token}`;
}

const makeUsersArray = () => {
  return [
    {
      id: 1,
      username: 'test-user-1',
      first_name: 'Test First Name 1',
      last_name: 'Test Last Name 1',
      email: 'test-user-email-1@email.com',
      password: 'password',
      date_created: new Date('2029-01-22T16:28:32.615Z'),
      allowance: 3333,
      balance: 9999,
    },
    {
      id: 2,
      username: 'test-user-2',
      first_name: 'Test First Name 2',
      last_name: 'Test Last Name 2',
      email: 'test-user-email-2@email.com',
      password: 'password',
      date_created: new Date('2029-02-22T16:28:32.615Z'),
      allowance: 4444,
      balance: 8888,
    },
    {
      id: 3,
      username: 'test-user-3',
      first_name: 'Test First Name 3',
      last_name: 'Test Last Name 3',
      email: 'test-user-email-3@email.com',
      password: 'password',
      date_created: new Date('2029-03-22T16:28:32.615Z'),
      allowance: 5555,
      balance: 7777,
    },
    {
      id: 4,
      username: 'test-user-4',
      first_name: 'Test First Name 4',
      last_name: 'Test Last Name 4',
      email: 'test-user-email-4@email.com',
      password: 'password',
      date_created: new Date('2029-04-22T16:28:32.615Z'),
      allowance: 6666,
      balance: 6666,
    },
    {
      id: 5,
      username: 'test-user-5',
      first_name: 'Test First Name 5',
      last_name: 'Test Last Name 5',
      email: 'test-user-email-5@email.com',
      password: 'password',
      date_created: new Date('2029-05-22T16:28:32.615Z'),
      allowance: 7777,
      balance: 5555,
    },
    {
      id: 6,
      username: 'test-user-6',
      first_name: 'Test First Name 6',
      last_name: 'Test Last Name 6',
      email: 'test-user-email-6@email.com',
      password: 'password',
      date_created: new Date('2029-06-22T16:28:32.615Z'),
      allowance: 8888,
      balance: 4444,
    },
  ];
}

const makeIncomeAndExpensesArray = () => {
  const testIncome = [
    {
      id: 1,
      name: 'Test Income 1',
      user_id: 1,
      description : 'test',
      income_amount: 11113,
      income_category : 'other',
      date_created: '2029-01-22T16:28:32.615Z'  
    },
    {
      id: 2,
      name: 'Test Income 2',
      user_id: 1,
      description : 'test',
      income_amount: 2000,
      income_category : 'other',
      date_created: '2029-01-22T16:28:32.615Z'  
    },
    {
      id: 3,
      name: 'Test Income 3',
      user_id: 2,
      description : 'test',
      income_amount: 7777,
      income_category: 'other',
      date_created: '2029-01-22T16:28:32.615Z'  
    },
    {
      id: 4,
      name: 'Test Income 4',
      user_id: 1,
      description : 'test',
      income_amount: 65412,
      income_category: 'other',
      date_created: '2029-01-22T16:28:32.615Z'  
    },
    {
      id: 5,
      name: 'Test Income 5',
      user_id: 3,
      description : 'test',
      income_amount: 99,
      income_category: 'other',
      date_created: '2029-01-22T16:28:32.615Z'  
    }
  ];
  const testExpenses = [
    {
      id: 1,
      name: 'Test Expense 1',
      user_id: 1,
      description : 'test',
      expense_amount: -1212,
      expense_category: 'other',
      date_created: '2029-01-22T16:28:32.615Z'  
    },
    {
      id: 2,
      name: 'Test Expense 2',
      user_id: 1,
      description : 'test',
      expense_amount: -5011,
      expense_category: 'other',
      date_created: '2029-01-22T16:28:32.615Z'  
    },
    {
      id: 3,
      name: 'Test Expense 3',
      user_id: 3,
      description : 'test',
      expense_amount: -12,
      expense_category : 'other',
      date_created : '2029-01-22T16:28:32.615Z'  
    },
    {
      id: 4,
      name: 'Test Expense 4',
      user_id: 2,
      description : 'test',
      expense_amount: -754146,
      expense_category : 'other',
      date_created : '2029-01-22T16:28:32.615Z'  
    },
    {
      id: 5,
      name: 'Test Expense 5',
      user_id: 1,
      description : 'test',
      expense_amount: -70881,
      expense_category : 'other',
      date_created : '2029-01-22T16:28:32.615Z'  
    },
    {
      id: 6,
      name: 'Test Expense 6',
      user_id: 3,
      description : 'test',
      expense_amount: -4374,
      expense_category : 'other',
      date_created : '2029-01-22T16:28:32.615Z'  
    }
  ];
  return {testIncome, testExpenses}; 
}

const makeTransactionReply = (type, tran) => {
    tran.description = !tran.description ? null : tran.description ; 
    
    return type === 'income' 
    ? {
      id: tran.id,
      name: tran.name,
      description : tran.description,
      date_created: tran.date_created,
      amount: (tran.income_amount / 100),
      category: tran.income_category,
    }
    : {
      id: tran.id,
      name: tran.name,
      description : tran.description,
      date_created: tran.date_created,
      amount: (tran.expense_amount / 100),
      category: tran.expense_category,
    };
}

const makeGoalsArray = () => {
  return [
    {
      id: 1,
      name: 'Test Goal 1',
      user_id: 1,
      goal_amount: 40000, // In cents
      contribution_amount: 10000,
      current_amount: 10000,
      end_date: moment(new Date('2020-10-15T13:26:19.359Z')),
      completed: false,
    },
    {
      id: 2,
      name: 'Test Goal 2',
      user_id: 1,
      goal_amount: 40000, // In cents
      contribution_amount: 10000,
      current_amount: 10000,
      end_date: moment(new Date('2020-10-15T13:26:19.359Z')),
      completed: false,
    },
  ];
}

const makeAllFixtures = () => {
  const testUsers = makeUsersArray();
  const { income: testIncome, expenses: testExpenses } = makeIncomeAndExpensesArray();
  const testGoals = makeGoalsArray();

  return {
    testUsers,
    testIncome,
    testExpenses,
    testGoals,
  }
}

const seedUsersTable = async (db, users) => {
  const preppedUsers = users.map(user => ({
    ...user,
    password: bcrypt.hashSync(user.password, 1),
  }));

  await db.into('users')
    .insert(preppedUsers);

  await db
    .raw(
      `SELECT setval('users_id_seq', ?)`,
      users[users.length-1].id
    );
}

const seedIncomeAndExpensesTables = (db, users, income = [] , expenses = [] ) => {
  return db.transaction(async trx => {
    await trx.into('users').insert(users);
    await trx.into('income').insert(income);
    await trx.into('expenses').insert(expenses);
    
    await trx
      .raw(
        `SELECT setval('income_id_seq', ?)`,
        income[income.length - 1].id
      );

    await trx
      .raw(
        `SELECT setval('expenses_id_seq', ?)`,
        expenses[expenses.length - 1].id
      );
  });
}

const seedGoalsTable = (db, goals = []) => {
  return db('goals').insert(goals);
}

const seedAllTables = (db, users, income = [], expenses = [], goals = []) => {
  return db.transaction(async trx => {
    await trx('users').insert(users);
    await trx('income').insert(income);
    await trx('expenses').insert(expenses);
    await trx('goals').insert(goals);

    await trx
      .raw(
        `SELECT setval(users_id_seq, ?)`,
        users[users.length-1].id
      );

    await trx
      .raw(
        `SELECT setval(income_id_seq, ?)`,
        income[income.length-1].id
      );

    await trx
      .raw(
        `SELECT setval(expenses_id_seq, ?)`,
        expenses[expenses.length-1].id
      );
    
    await trx
      .raw(
        `SELECT setval(goals_id_seq, ?)`,
        goals[goals.length-1].id
      );

  })
}

const clearAllTables = (db) => {
  return db.transaction(trx =>
    trx.raw(
      `TRUNCATE
          goals,
          income,
          expenses,
          users
          RESTART IDENTITY CASCADE;`
    )
  );
}

const makeExpectedIncomeExpensesArray = (inc, exp, match_id) =>{
  
  let income = [];
  let expenses = [];

  /*


  FOUND THE ERROR!!  forgot to check for user id.... 


  expected = {
      id: 1,
      user_id: 1,
      name: 'Test Income 1',
      description: 'test',
      income_amount: 111.13,
      income_category: 'other',
      date_created: '2029-01-22T16:28:32.615Z'
    },

    got = {
      id: 1,
      user_id: 1,
      name: 'Test Income 1',
      description: 'test',
      income_amount: 111.13,
      income_category: 'other',
      date_created: '2029-01-22T16:28:32.615Z'
    },
  
  
  */

    for(let i = 0 ; i < inc.length ; i++){
      if(inc[i].user_id === match_id){
        income.push(
          {
            id: inc[i].id,
            user_id: inc[i].user_id,
            name: inc[i].name,
            description: inc[i].description,
            income_amount: (inc[i].income_amount / 100),/*all...this shit just to fix THIS*/
            income_category: inc[i].income_category,
            date_created: inc[i].date_created
          }
        )
      }
    }

    for(let i = 0 ; i < exp.length ; i++){
      if(exp[i].user_id === match_id){
            expenses.push(
          {
            id: exp[i].id,
            user_id: exp[i].user_id,
            name: exp[i].name,
            description: exp[i].description,
            expense_amount: (exp[i].expense_amount / 100),/*all...this shit just to fix THIS*/
            expense_category: exp[i].expense_category,
            date_created: exp[i].date_created
          }
        )
      }
    }



    return {income, expenses}
};

const convertTestGoal = (goal) => ({
  ...goal,
  goal_amount: convertToDollars(goal.goal_amount),
  current_amount: convertToDollars(goal.current_amount),
  contribution_amount: convertToDollars(goal.contribution_amount),
  end_date: moment(goal.end_date).format(),
  date_created: new Date().toLocaleString(),
});

const convertTestGoals = (goals) =>
  goals.map(goal => convertTestGoal(goal));

module.exports = {
  clearAllTables,
  makeAuthHeader,
  makeAllFixtures,
  makeExpectedIncomeExpensesArray,
  makeIncomeAndExpensesArray,
  makeKnexInstance,
  makeTransactionReply,
  makeUsersArray,
  makeGoalsArray,
  seedUsersTable,
  seedIncomeAndExpensesTables,
  seedGoalsTable,
  seedAllTables,
  convertTestGoal,
  convertTestGoals
};
