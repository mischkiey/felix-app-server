const express = require('express');
const { requireAuth } = require('../../middleware/jwtAuth');
const transactionsRouter = express.Router();

const {
  getUserIncome,
  getUserExpenses,
  getSingleTransaction,
  createTransaction,
  patchSingleTransaction,
  serializeOutgoingTransaction,
  serializeAllPackage,
} = require('./TransactionsService');
const TransactionsService = require('./TransactionsService');
const { convertToCents, convertTransactionsToDollars, convertToDollars } = require('../../helpers');

transactionsRouter
  .route('/')
  .all(requireAuth)
  .get(async (req, res, next) => {
    const user_id = req.userId;
    try {
      let income = await getUserIncome(req.app.get('db'), user_id); // Array of income objects
      income = convertTransactionsToDollars(income, 'income');
      let expenses = await getUserExpenses(req.app.get('db'), user_id); // Array of expense objects
      expenses = convertTransactionsToDollars(expenses, 'expense');

      return res.json(serializeAllPackage(income,expenses));
    } catch (error) {
      next(error);
    }
  })
  .post(async (req, res, next) => {
    const { name, description, category, type } = req.body;
    const amount = convertToCents(req.body.amount);
    const user_id = req.userId;
    let newTransaction = {};
    //If type is income, transaction object has income_amount and income_category properties
    if (type === 'income') {

      //If the amount if less than or equal to 0 reject it
      if (amount <= 0) {
        return res.status(400).json({error: 'Income amount must be greater than 0'});
      }

      //If the category type doesn't match income table enums reject it
      if (category !== 'paycheck' && category !== 'freelance' && category !== 'side_gig' && category !== 'other') {
        return res.status(400).json({error: 'category does not exist for income'});
      }

      //Build the new transaction object
      newTransaction = {
        user_id: user_id,
        name,
        description,
        income_amount: amount,
        income_category: category,
      };
    }
    //If type is expenses, transaction object has expense_amount and expense_category properties
    else if (type === 'expenses') {
      //If the expense amount is 0 respond with error. If the amount is above 0 the client will coerce it to a negative number before POSTing
      if (amount === 0) {
        return res.status(400).json({error: 'Amount must not be 0'});
      };

      //If the category type doesn't match expenses table enums reject it
      if (category !== 'bills' && category !== 'transportation' && category !== 'food' && category !== 'entertainment' && category !== 'other') {
        return res.status(400).json({error: 'Category does not exist for expenses'});
      }
        newTransaction = {
          user_id: user_id,
          name,
          description,
          expense_amount: amount,
          expense_category: category,
        };
    }

    //If type is neither expenses or income reject it
    else if (type !== 'income' || type !== 'expenses') {
      return res.status(400).json({error: 'Transaction must be type "income" or "expenses"'});
    }

    //Create the transaction and insert it into the db, the 'type' parameter informs knex which db table to insert into
    try {
      await createTransaction(
        req.app.get('db'),
        type,
        newTransaction, type);

      return res.status(201).end();
    } catch (e) {
      next(e);
    }
  });

transactionsRouter
  .route('/:type/:id')
  .all(checkIfTransactionExists, requireAuth)
  .get(async (req, res, next) => {
    const { type, id } = req.params;

    if (!['income', 'expenses'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid transaction type',
      });
    }

    for (const [key, prop] of Object.entries({ type, id })) {
      if (!prop) {
        return res.status(400).json({
          error: `${key} seems to be missing from query params`,
        });
      }
    }

    try {
      const transaction = await getSingleTransaction(
        req.app.get('db'),
        type,
        id
      );

      if (!transaction) {
        return res.status(400).json({
          error: 'Invalid transaction id',
        });
      }

      if (req.auth_id !== req.userId) {
        return res
          .status(401)
          .json({
            error : 'user is unauthorized to view this transaction'
          });
      }


      const transactionDetails =
      type === 'income'
        ? {
          id: transaction.id,
          name: transaction.name,
          description : transaction.description,
          date_created: transaction.date_created,
          amount: convertToDollars(transaction.income_amount),
          category: transaction.income_category,
        }
        : {
          id: transaction.id,
          name: transaction.name,
          description : transaction.description,
          date_created: transaction.date_created,
          amount: convertToDollars(transaction.expense_amount),
          category: transaction.expense_category,
        };


      return res
        .status(200)
        .json(serializeOutgoingTransaction(transactionDetails));
    } catch (e) {
      next(e);
    }
  })
  .patch(async (req,res,next) => {
    const { type, id } = req.params;
    const {userId} = req; 
    const {name, category, description} = req.body;
    const amount = convertToCents(req.body.amount);
    //Checks if user making patch matches user id of the transaction
    if (req.auth_id !== userId) {
      return res.status(401).json({
          error : 'user is unauthorized to view this transaction'
        });
    }

    //Checks if type is either income or expense
    if (!['income','expenses'].includes(type)) {
      return res.status(400).json({
          error : 'Invalid transaction type'
        });
    }

    for (const [key, prop] of Object.entries({type, id})) {
      if (!prop) {
        return res.status(400).json({
            error : `${key} seems to be missing from query params`
          });
      }
    }
    //Checks if body content exists
    if (!name && !amount && !category) {
      res.status(400).json({error : 'no content to be updated'});
    }

    const transObject = type === 'income'
      ? {
        name,
        description,
        income_amount : amount,
        income_category : category
      }
      : {
        name,
        description, 
        expense_amount : amount,
        expense_category : category
      };
    //Insert the new transaction object into db
   patchSingleTransaction(
      res.app.get('db'),
      type,
      id,
      req.userId,
      transObject, type
    )
    .then(() => res.status(204).end())
    .catch(next);
  })
  .delete((req, res,next) =>{
    const { type, id } = req.params;

    if (!['income', 'expenses'].includes(type)) {
      return res.status(400).json({
        error: 'Invalid transaction type',
      });
    }

    for (const [key, prop] of Object.entries({ type, id })) {
      if (!prop) {
        return res.status(400).json({
          error: `${key} seems to be missing from query params`,
        });
      }
    }

    if (req.auth_id !== req.userId) {
      return res.status(401).json({
          error: 'user is unauthorized to view this transaction'
        });
    }

    TransactionsService.deleteTransaction(
      req.app.get('db'),
      type,
      id,
      req.userId
    )
    .then(() => res.status(204).end())
    .catch(next);
  });

//this should be moved to middleware
//Checks if transaction exists
async function checkIfTransactionExists(req,res,next) {
  try {
    const ExistingTransaction = await getSingleTransaction(
      req.app.get('db'),
      req.params.type,
      req.params.id
    );
    if(!ExistingTransaction){
      return res.status(400).json(
        {error : 'the id of the transaction doesn\'t exist'}
      );
    }
    //should be === w/ req.userId from auth
    req.auth_id = ExistingTransaction.user_id;
    next();
  } catch(error){
    next(error);
  }
}

module.exports = transactionsRouter;

