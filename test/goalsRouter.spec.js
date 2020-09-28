const { expect } = require('chai');
const supertest = require('supertest');
const app = require('../src/app');
const moment = require('moment');

const {
  makeKnexInstance,
  makeAuthHeader,
  makeAllFixtures,
  seedUsersTable,
  seedGoalsTable,
  clearAllTables,
  convertTestGoal,
  convertTestGoals,
} = require('./testHelpers');

describe('Goals Endpoints', function () {
  this.retries(5);
  let db;

  const {
    testUsers,
    testGoals,
  } = makeAllFixtures();

  const convertedTestGoal = convertTestGoal(testGoals[0]);
  const convertedTestGoals = convertTestGoals(testGoals);

  before('Connect to db', () => {
    db = makeKnexInstance();
    app.set('db', db);
  });

  after('Disconnect from db', () => db.destroy());

  before('Clean up tables', () => clearAllTables(db));

  afterEach('Clean up tables', () => clearAllTables(db));

  describe('GET /goals endpoint', () => {
    beforeEach('Insert users into db', () => seedUsersTable(db, testUsers));

    context('Given there are no goals in db', () => {
      it('Responds with 200 and an empty array', () => {
        return supertest(app)
          .get('/api/goals')
          .set('Authorization', makeAuthHeader(testUsers[0]))
          .expect(200, [])
      });
    });

    context('Given there are goals in db', () => {
      beforeEach('Insert goals into db', () => seedGoalsTable(db, testGoals));

      it('Responds with 200 and an array of goals objects', () => {
        return supertest(app)
          .get('/api/goals')
          .set('Authorization', makeAuthHeader(testUsers[0]))
          .expect(200)
          .then(response => {
            response.body.forEach(goal => {
              goal.date_created = new Date(goal.date_created).toLocaleString();
            });
            expect(response.body).to.eql(convertedTestGoals);
          });
      });

      it('Responds with 200 and a goal object', () => {
        const goalId = 1;
        return supertest(app)
          .get(`/api/goals/${goalId}`)
          .set('Authorization', makeAuthHeader(testUsers[0]))
          .expect(200)
          .then(response => {
            response.body.date_created = new Date(response.body.date_created).toLocaleString();
            expect(response.body).to.eql(convertedTestGoal);
          });
      });
    });

    context('Given malicious goal content', () => {
      const maliciousTestGoal = {
        id: 911,
        name: `<script>alert('xss');</script>`,
        user_id: 1,
        goal_amount: 40000,
        contribution_amount: 10000,
        current_amount: 10000,
        end_date: moment(new Date('2020-10-15T13:26:19.359Z')),
        completed: false,
      }
      beforeEach('Insert malicious goal content into db', () =>
        seedGoalsTable(db, [maliciousTestGoal])
      );

      it('Removes XSS attack content', () => {
        return supertest(app)
          .get('/api/goals')
          .set('Authorization', makeAuthHeader(testUsers[0]))
          .expect(200)
          .then(response => {
            expect(response.body[response.body.length-1].name).to.eql(`&lt;script&gt;alert(\'xss\');&lt;/script&gt;`)
          });
      })

      it('Removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/goals/${maliciousTestGoal.id}`)
          .set('Authorization', makeAuthHeader(testUsers[0]))
          .expect(200)
          .then(response => {
            expect(response.body.name).to.eql(`&lt;script&gt;alert(\'xss\');&lt;/script&gt;`)
          });
      })
    })
  });

  describe('POST /goals endpoint', () => {
    beforeEach('Insert users into db', () => seedUsersTable(db, testUsers));
    it('Responds with 201', () => {
      const goalId = 1;
      let newTestGoal = {
        name: 'Bicycle',
        goal_amount: 100,
        contribution_amount: 25,
        end_date: moment(new Date('2020-10-15T13:26:19.359Z')),
      }

      return supertest(app)
        .post('/api/goals')
        .set('Authorization', makeAuthHeader(testUsers[0]))
        .send(newTestGoal)
        .expect(201, {message: 'Goal succesfully added'})
        .then(response => {
          return supertest(app)
            .get(`/api/goals/${goalId}`)
            .set('Authorization', makeAuthHeader(testUsers[0]))
            .expect(200)
            .then(response => {
              response.body.date_created = new Date(response.body.date_created).toLocaleString();
              newTestGoal = {
                ...newTestGoal,
                id: 1,
                user_id: 1,
                current_amount: 0,
                end_date: moment(new Date('2020-10-15T13:26:19.359Z')).format(),
                date_created: new Date().toLocaleString(),
                completed: false,
              }
              expect(response.body).to.eql(newTestGoal);
            });
        });
    });
  });

  describe('PATCH /goals endpoint', () => {
    beforeEach('Insert users into db', () => seedUsersTable(db, testUsers));
    beforeEach('Insert goals into db', () => seedGoalsTable(db, testGoals));

    it('Responds with 201', () => {
      const goalId = 1;
      let updateTestGoal = {
        name: 'Bicycle',
        goal_amount: 400,
        contribution_amount: 100,
        end_date: moment(new Date('2020-10-15T13:26:19.359Z')),
      }

      return supertest(app)
        .patch(`/api/goals/${goalId}`)
        .set('Authorization', makeAuthHeader(testUsers[0]))
        .send(updateTestGoal)
        .expect(201, {message: 'Goal succesfully updated'})
        .then(response => {
          return supertest(app)
            .get(`/api/goals/${goalId}`)
            .set('Authorization', makeAuthHeader(testUsers[0]))
            .expect(200)
            .then(response => {
              response.body.date_created = new Date(response.body.date_created).toLocaleString();
              updateTestGoal = {
                ...updateTestGoal,
                id: 1,
                user_id: 1,
                current_amount: 100,
                end_date: moment(new Date('2020-10-15T13:26:19.359Z')).format(),
                date_created: new Date().toLocaleString(),
                completed: false,
              }
              expect(response.body).to.eql(updateTestGoal);
            });
        });
    });
  });

  describe('DELETE /goals endpoint', () => {
    beforeEach('Insert users into db', () => seedUsersTable(db, testUsers));
    beforeEach('Insert goals into db', () => seedGoalsTable(db, testGoals));

    it('Responds with 201', () => {
      const goalId = 1;
      return supertest(app)
        .delete(`/api/goals/${goalId}`)
        .set('Authorization', makeAuthHeader(testUsers[0]))
        .expect(200, {message: 'Goal succesfully deleted'})
        .then(() => {
          return supertest(app)
            .get(`/api/goals/${goalId}`)
            .set('Authorization', makeAuthHeader(testUsers[0]))
            .expect(400, {error: 'Invalid goal ID'})
        }); 
    });
  });
});
