const express = require('express');
const { requireAuth } = require('../../middleware/jwtAuth');
const path = require('path');

const usersRouter = express.Router();

const {
  createUser,
  validatePassword,
  validateUsername,
  getUserWithUsername,
  getUserWithEmail,
  hashPassword,
  unhashPassword,
  getUserWithId,
  createJwt,
} = require('./UsersService.js');
const { convertToDollars } = require('../../helpers');

usersRouter.post('/register', async (req, res, next) => {
  const db = req.app.get('db');

  const { first_name, last_name, username, password, email } = req.body;

  // Check that fields exist
  // Not sure if this style is readable
  // Correct me if anything - Miki
  for (const field of [
    'first_name',
    'last_name',
    'username',
    'password',
    'email',
  ]) {
    if (!req.body[field]) {
      return res.status(400).json({
        error: `Missing ${field} in request body`,
      });
    }
  }

  try {
    // Check that password matches requirements
    const passwordError = validatePassword(password);

    // If password does not meet requirements, return error
    if (passwordError) {
      return res.status(400).json({
        error: passwordError,
      });
    }

      // Check that username matches requirements
      const usernameError = validateUsername(username);
  
      // If username does not meet requirements, return error
      if (usernameError) {
        return res.status(400).json({
          error: usernameError,
        });
      }

    // Check if username already exists in db
    const hasUsername = await getUserWithUsername(db, username);

    // If username is already taken return error
    if (hasUsername) {
      return res.status(400).json({
        error: 'Username unavailable',
      });
    }

    // Check if email already exists in db
    const hasEmail = await getUserWithEmail(db, email);

    // If email is already taken return error
    if (hasEmail) {
      return res.status(400).json({
        error: 'Email already in use',
      });
    }

    // Hash the user's password
    const hashedPassword = await hashPassword(password);

    // Build new user object
    const newUser = {
      first_name,
      last_name,
      username,
      password: hashedPassword,
      email,
    };

    // Insert new user object into database
    const user = await createUser(db, newUser);

    // Get user id and username from db to create jwt token
    const sub = user.username;
    const payload = { user_id: user.id };

    // Create and send jwt
    res.status(200).json({
      authToken: createJwt(sub, payload),
    });
  } catch (error) {
    next(error);
  }
});

usersRouter.post('/login', async (req, res, next) => {
  const db = req.app.get('db');

  const { username, password } = req.body;

  // Check that fields exist
  for (const field of ['username', 'password']) {
    if (!req.body[field]) {
      return res.status(400).json({
        error: `Missing ${field} in request body`,
      });
    }
  }

  try {
    // Get user object to check against POSTed username and password
    const hasUser = await getUserWithUsername(db, username);

    // If hasUser is undefined (username does not exist in db), return error
    if (!hasUser) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    // If password is wrong return error
    if (!(await unhashPassword(password, hasUser.password))) {
      return res.status(401).json({
        error: 'invalid credentials',
      });
    }

    // Get user id and username from db to create jwt token
    const sub = hasUser.username;
    const payload = { user_id: hasUser.id };

    // Create and send jwt
    res.status(200).json({
      authToken: createJwt(sub, payload),
    });
  } catch (error) {
    next(error);
  }
});

usersRouter.route('/').get(requireAuth, async (req, res, next) => {
  const db = req.app.get('db');
  const user_id = req.userId;

  try {
    const user = await getUserWithId(db, user_id); // Returns an array of user details obj
    user.allowance = convertToDollars(user.allowance);
    user.balance = convertToDollars(user.balance);
    user.total_saved = convertToDollars(user.total_saved);
    return res.json(user); // Returns a user obj
  } catch (error) {
    next(error);
  }
});

module.exports = usersRouter;
