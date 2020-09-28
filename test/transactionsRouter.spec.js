/* eslint-disable quotes */
const app = require('../src/app');
const helper = require('./testHelpers');
const supertest = require('supertest');


describe('Transaction Endpoint', ()=> {
  let db;

  const {
    testIncome,
    testExpenses
  } = helper.makeIncomeAndExpensesArray();

  const testUsers = helper.makeUsersArray();

  before('make knex instance', () =>{
    db = helper.makeKnexInstance();
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => helper.clearAllTables(db));

  afterEach('cleanup', () => helper.clearAllTables(db));


  describe(`GET '/' endpoint` , () =>{

    context(`if this is content in the database, the user has an auth token, and it's tied to that user`, ()=>{

      beforeEach('insert transactions into tables', () =>{
        return helper.seedIncomeAndExpensesTables(
          db,
          testUsers,
          testIncome,
          testExpenses
          );
        });

      it(`send back a 201, and a object with array of income, and expenses`, () => {

        const expectedObject = helper.makeExpectedIncomeExpensesArray(testIncome, testExpenses, testUsers[0].id) 

        return supertest(app)
        .get('/api/transactions')
        .set('Authorization', helper.makeAuthHeader(testUsers[0]))
        .expect(200, expectedObject)

      });
    });
  });

  describe(`POST '/' endpoint` , () =>{

    context(`if user has auth, and is sending the correct content for _income_`, ()=>{
        
      beforeEach('insert transactions into tables', () =>{
        return helper.seedIncomeAndExpensesTables(
          db,
          testUsers,
          testIncome,
          testExpenses
          );
        });

        const type = 'income';

      it(`should send back a 201, and have that content in the __income__ database`, () => {

        const newIncome = {
            name: 'NEW Test Income',
            description : 'NEW test',
            amount: 11113,
            category : 'other',
            type, 
        }

    
        return supertest(app)
        .post('/api/transactions')
        .set('Authorization', helper.makeAuthHeader(testUsers[0]))
        .send(newIncome)
        .expect(201)
        .expect( () =>
          supertest(app)
          .get(`/api/transactions/${type}/${testIncome.length}`)
          .set('Authorization', helper.makeAuthHeader(testUsers[0]))
          .expect(200, newIncome)
        )
      });
    });

    context(`if user has auth, and is sending the correct content for _expenses_`, ()=>{
        
      beforeEach('insert transactions into tables', () =>{

        return helper.seedIncomeAndExpensesTables(
          db,
          testUsers,
          testIncome,
          testExpenses
          );
        });

        const type = 'expenses'

        it(`should send back a 201, and have that content in the __income__ database`, () => {

          const newExpense = {
              name: 'NEW Test Income',
              description : 'NEW test',
              amount: -13,
              category : 'other',
              type, 
          }
  
      
          return supertest(app)
          .post('/api/transactions')
          .set('Authorization', helper.makeAuthHeader(testUsers[0]))
          .send(newExpense)
          .expect(201)
          .expect( () =>
            supertest(app)
            .get(`/api/transactions/${type}/${testExpenses.length}`)
            .set('Authorization', helper.makeAuthHeader(testUsers[0]))
            .expect(200, newExpense)
          )
        });
    });
  });

  describe(`GET "/api/transaction/:type/:id" endpoint`, () => {
    
    
    context('if given a valid auth, and a valid id, and a type of "income"', ()=> {

      const transaction_id = 2;
      const type = 'income';

      beforeEach('insert transactions into tables', () =>{
        return helper.seedIncomeAndExpensesTables(
          db,
          testUsers,
          testIncome,
          testExpenses
        );
      });

      it('should give a 200, and send back _income_ info',()=>{

        const expectedIncome = helper.makeTransactionReply( type ,testIncome[ transaction_id - 1 ]);

        return supertest(app)
          .get(`/api/transactions/${type}/${transaction_id}`)
          .set('Authorization', helper.makeAuthHeader(testUsers[0]))
          .expect(200, expectedIncome); 
      });

    });

    context('if given a vialed auth, and a valid id, and a type of "expenses"', ()=> {

      const transaction_id = 2;
      const type = 'expenses';

      beforeEach('insert transactions into tables', () =>{
        return helper.seedIncomeAndExpensesTables(
          db,
          testUsers,
          testIncome,
          testExpenses
        );
      });
      
      it('should give a 200, and send back _expenses_ info',()=>{
        
        const expectedExpense = helper.makeTransactionReply( type ,testExpenses[ transaction_id - 1 ]);

        return supertest(app)
          .get(`/api/transactions/${type}/${transaction_id}`)
          .set('Authorization', helper.makeAuthHeader(testUsers[0]))
          .expect(200, expectedExpense); 
      }); 
    });

    
  });

  describe(`PATCH "/api/transaction/:type/:id" endpoint ` , () =>{

    context(`if given a valid auth token, and all conditions( valid, target_id, at less one field ) are met, FOR _income_`, ()=>{

      beforeEach('insert transactions into tables', () =>{
        return helper.seedIncomeAndExpensesTables(
          db,
          testUsers,
          testIncome,
          testExpenses
        );
      });
      const transaction_id = 2; 
      const type = 'income';
      
      it(`it should update the new info into the DB and send back a 204`, () => {

        const updatedIncome = {
          name: 'Updated Income 2',
          description : 'updated',
          amount: 99000000.99,
          category : 'other',          
        };

        const filteredIncomeReply =  helper.makeTransactionReply( type ,testIncome[ transaction_id - 1 ]);

        const expectedUpdatedIncome = {
          ...filteredIncomeReply,
          ...updatedIncome
        }

        return supertest(app)
          .patch(`/api/transactions/${type}/${transaction_id}`)
          .set('Authorization', helper.makeAuthHeader(testUsers[0]))
          .send(updatedIncome)
          .expect(204)
          .then(() => 
            supertest(app)
            .get(`/api/transactions/${type}/${transaction_id}`)
            .set('Authorization', helper.makeAuthHeader(testUsers[0]))
            .expect(expectedUpdatedIncome)
          )
      });
    });
    /**
     * @note waiting on allowance change algorithms to working before fulling testing Gage -> Muji
     */
    context.skip(`if given a valid auth token, and all conditions( valid, target_id, at less one field ) are met, FOR _expenses_`, ()=>{

      beforeEach('insert transactions into tables', () =>{
        return helper.seedIncomeAndExpensesTables(
          db,
          testUsers,
          testIncome,
          testExpenses
        );
      });

      const transaction_id = 2; 
      const type = 'expenses';

      
      it(`it should update the new info into the DB and send back a 204`, () => {

        /*
        user Info =    {
      id: 1,
      username: 'test-user-1',
      first_name: 'Test First Name 1',
      last_name: 'Test Last Name 1',
      email: 'test-user-email-1@email.com',
      password: 'password',
      date_created: new Date('2029-01-22T16:28:32.615Z'),
      allowance: 3333, ($33.33)
      balance: 9999, ($99.99)
    },


        original_Expenses = {
      id: 2,
      name: 'Test Expense 2',
      user_id: 1,
      description : 'test',
      expense_amount: -5011, (50.11)
      expense_category: 'other',
      date_created: '2029-01-22T16:28:32.615Z'  
        }


         */

        const updatedExpenses = {
          name: 'Updated Income 2',
          description : 'updated',
          amount: -51, /* (9999) throwing error if grater then .. */
          category : 'other',          
        };

        const filteredExpensesReply =  helper.makeTransactionReply( type ,testExpenses[ transaction_id - 1 ]);

        const expectedUpdatedExpenses = {
          ...filteredExpensesReply,
          ...updatedExpenses
        }

        return supertest(app)
          .patch(`/api/transactions/${type}/${transaction_id}`)
          .set('Authorization', helper.makeAuthHeader(testUsers[0]))
          .send(updatedExpenses)
          .expect(204)
          .then(() => 
            supertest(app)
            .get(`/api/transactions/${type}/${transaction_id}`)
            .set('Authorization', helper.makeAuthHeader(testUsers[0]))
            .expect(expectedUpdatedExpenses)
            .end()
          )
      });
    });

  });

  describe(`DELETE "/api/transaction/:type/:id" endpoint ` , () =>{

    context(`if given a valid auth token, and the database has content`, ()=>{

      beforeEach('insert transactions into tables', () =>{
        return helper.seedIncomeAndExpensesTables(
          db,
          testUsers,
          testIncome,
          testExpenses
          );
        });

        const transactionIdToRemove = 2;
        const type = 'expenses';
        
      it(`it should insert the new info into the DB and send back a 204`, () => {

        const expectedIncomeArray = testIncome.filter(tr => tr.id !== transactionIdToRemove)
       
        return supertest(app)
          .delete(`/api/transactions/${type}/${transactionIdToRemove}`)
          .set('Authorization', helper.makeAuthHeader(testUsers[0]))
          .expect(204);
        
      });
    });
  });
  

});