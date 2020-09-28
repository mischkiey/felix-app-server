const xss = require('xss');
const { updateAllowance, updateBalance, getDifference, selectTransactionAmount } = require('../../helpers');

const TransactionsService = {
  getUserDetails(db, id) {
    return db('users')
      .select('*')
      .where({ id })
      .first();
  },

  getUserIncome(db, user_id) {
    return db('income')
      .select('*')
      .where({ user_id });
  },
  /**
   * @param {knex} db
   * @param {number} user_id
   * @returns {array}
   **/

  getUserExpenses(db, user_id) {
    return db('expenses')
      .select('*')
      .where({ user_id });
  },

  getSingleTransaction(db, type, id) {
    return db.select()
      .from(type)
      .where({ id })
      .first();
  },

  //type is a string of either 'income' or 'expenses'
  async createTransaction(db, type, newTransaction) {
    await db.transaction(async trx => {
      await trx(type)
        .insert(newTransaction)
        .catch(error => error);

      const t = newTransaction; 
      await updateBalance(trx, t.user_id, t.income_amount || t.expense_amount);
      await updateAllowance(trx, t.user_id, t.income_amount || t.expense_amount);
    });
  },
  
  async patchSingleTransaction(db, type, id, userId, content) {
    // get transaction amount before patch
    const oldAmt = await selectTransactionAmount(db, type, id);
    //add the difference between the amounts to balance/allowance
    const difference = getDifference(oldAmt, content.income_amount || content.expense_amount);
    
    await db.transaction(async trx => {
      await trx(type).where({ id }).update(content);
      await updateBalance(db, userId, difference);
      await updateAllowance(db, userId, difference);
    });
  },
  async deleteTransaction(db, type, id, userId) {
    // get transaction amount before delete
    const amount = await selectTransactionAmount(db, type, id);
    // add the negative of that amount to balance/allowance
    const difference = amount * -1;

    await db.transaction(async trx => {
      await trx(type).where({ id }).delete();
      await updateBalance(trx, userId, difference);
      await updateAllowance(trx, userId, difference);
    });
  },
  serializeOutgoingTransaction(transaction){
    return {
      id: transaction.id,
      name: xss(transaction.name),
      description : xss(transaction.description),
      date_created: transaction.date_created,
      amount: Number(xss(transaction.amount)),
      category: xss(transaction.category),   
    };
  },
  serializeIncoming(content, type) {
    return type === 'income'
      ?{
        user_id : content.user_id,
        name : xss(content.name),
        description : xss(content.description),
        income_amount : xss(content.income_amount),
        income_category : xss(content.income_category),
      }
      :{
        user_id : content.user_id,
        name : xss(content.name),
        description : xss(content.description),
        expense_amount : xss(content.expense_amount),
        expense_category : xss(content.expense_category),
      }
    ;
  },
  //this is dumb i shouldn't have to write 3 different serialize function for one damn endpoint
  serializeAllPackage(inc, exp){
    const income = inc.map(intran => {
      return {
        id: intran.id,
        user_id: intran.user_id,
        name: xss(intran.name),
        description: xss(intran.description),
        income_amount: Number(xss(intran.income_amount)),
        income_category: xss(intran.income_category),
        date_created: intran.date_created
      };
    });
    const expenses = exp.map(extran => {
      return {
        id: extran.id,
        user_id: extran.user_id,
        name: xss(extran.name),
        description: xss(extran.description),
        expense_amount: Number(xss(extran.expense_amount)),
        expense_category: xss(extran.expense_category),
        date_created: extran.date_created
      };
    });
    return {income, expenses};
  },
  //... this is still dumb
  serializePatch(tran, type){
    return type === 'income'
      ? {
        name : tran.name,
        description : tran.description,
        income_amount : tran.income_amount,
        income_category : tran.income_category
      }
      : {
        name:tran.name,
        description:tran.description, 
        expense_amount : tran.expense_amount,
        expense_category : tran.expense_category
      }
    ;
  }
};

module.exports = TransactionsService;
