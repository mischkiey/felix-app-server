const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../config');

const REGEX_UPPER_LOWER_NUMBER_SPECIAL = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&])[\S]+/;
const REGEX_UPPER_LOWER_NUMBER_DASH_HYPHEN = /(?=.*[!@#\$%\^&])[\S]+/;

const UsersService = {
  createJwt(subject, payload) {
    return jwt.sign(payload, config.JWT_SECRET, {
      subject,
      algorithm: 'HS256',
    });
  },
  verifyJwt(token) {
    return jwt.verify(token, config.JWT_SECRET, {
      algorithms: ['HS256'],
    });
  },
  getUserWithUsername(db, username) {
    return db('users')
      .where({ username })
      .first()
      .catch((error) => error);
  },

  getUserWithEmail(db, email) {
    return db('users')
      .where({ email })
      .first()
      .catch((error) => error);
  },

  getUserWithId(db, id) {
    return db('users')
      .where({ id })
      .first()
      .catch((error) => error);
  },

  validatePassword(password) {
    if (password.length < 8) {
      return 'Password must be longer than 8 characters';
    }
    if (password.length > 20) {
      return 'Password must be less than 20 characters';
    }
    if (password.startsWith(' ') || password.endsWith(' ')) {
      return 'Password must not start or end with empty spaces';
    }
    if (!REGEX_UPPER_LOWER_NUMBER_SPECIAL.test(password)) {
      return 'Password must contain one upper case, lower case, number and special character';
    }
    return null;
  },

  validateUsername(username) {
    if (REGEX_UPPER_LOWER_NUMBER_DASH_HYPHEN.test(username)) {
      return 'Username cannot contain special characters except - and _';
    }
    return null;
  },

  createUser(db, newUser) {
    return db
      .insert(newUser)
      .into('users')
      .returning('*')
      .then(([user]) => user);
  },

  hashPassword(password) {
    return bcrypt.hash(password, 12);
  },

  unhashPassword(password, hash) {
    return bcrypt.compare(password, hash);
  },
};
module.exports = UsersService;
