BEGIN;

TRUNCATE 
  "alerts",
  "expenses",
  "income",
  "goals",
  "users";

INSERT INTO "users" ("id", "first_name", "last_name", "username", "email", "password", "allowance", "balance", "total_saved")
VALUES
  (
    1,
    'john',
    'smith',
    'js123',
    'notarealemail@notrealmail.com',
    --password = "pass"
    '$2a$10$fCWkaGbt7ZErxaxclioLteLUgg4Q3Rp09WW0s/wSLxDKYsaGYUpjG',
    5121,
    100050,
    1045
  ),
  (
    2,
    'Jane',
    'Goodall',
    'realTarzan',
    'notarealemail@notrealmail.com',
    --password = "pass"
    '$2a$10$fCWkaGbt7ZErxaxclioLteLUgg4Q3Rp09WW0s/wSLxDKYsaGYUpjG',
    1000000,
    10000000,
    0 
  ),
  (
    3,
    'Chatchawan',
    'Suwaratana',
    'catLover27',
    'notarealemail@notrealmail.com',
    --password = "pass"
    '$2a$10$fCWkaGbt7ZErxaxclioLteLUgg4Q3Rp09WW0s/wSLxDKYsaGYUpjG',
    7817,
    23459,
    0 
  ),
  (
    4,
    'James',
    'Coffelt',
    'Big Papa',
    'notarealemail@notrealmail.com',
    --password = "pass"
    '$2a$10$fCWkaGbt7ZErxaxclioLteLUgg4Q3Rp09WW0s/wSLxDKYsaGYUpjG',
    56294,
    60059,
    2500
  ),
  (
    5,
    '-----',
    'M',
    'sumDude',
    'notarealemail@notrealmail.com',
    --password = "pass"
    '$2a$10$fCWkaGbt7ZErxaxclioLteLUgg4Q3Rp09WW0s/wSLxDKYsaGYUpjG',
    29278,
    30427,
    0
  ),
  (
    6,
    'Miki',
    'Francisco',
    'loveToCode',
    'notarealemail@notrealmail.com',
    --password = "pass"
    '$2a$10$fCWkaGbt7ZErxaxclioLteLUgg4Q3Rp09WW0s/wSLxDKYsaGYUpjG',
    84768,
    90268,
    10000
  ),
  (
    7,
    'Muhajir',
    'Sayer',
    'broke man',
    'notarealemail@notrealmail.com',
    --password = "pass"
    '$2a$10$fCWkaGbt7ZErxaxclioLteLUgg4Q3Rp09WW0s/wSLxDKYsaGYUpjG',
    1872,
    2927,
    0
  );

INSERT INTO "goals" ("id","name", "user_id", "goal_amount", "contribution_amount", "current_amount", "end_date")
VALUES 
  (
    1,
    'car',
    1,
    5000,
    2500,
    1045,
    '2020-10-05'
  ),
  (
    2,
    'boat',
    2,
    100000,
    10000,
    0,
    '2020-10-05'
  ),
  (
    3,
    'house',
    3,
    10000,
    5000,
    0,
    '2020-10-05'
  ),
  (
    4,
    'bike',
    4,
    50000,
    5000,
    2500,
    '2020-10-05'
  ),
  (
    5,
    'vacation',
    5,
    25000,
    10000,
    0,
    '2020-10-05'
  ),
  (
    6,
    'computer',
    6,
    100000,
    20000,
    10000,
    '2020-10-05'
  ),
  (
    7,
    'presents',
    7,
    10000,
    2500,
    0,
    '2020-10-05'
  );

INSERT INTO "income" ("id", "user_id", "name", "income_amount", "income_category", "date_created")
VALUES  
  (
    1,
    7,
    'job',
    24967,
    'paycheck',
    '2020-08-27'
  ),
  (
    2,
    7,
    'parents',
    11388,
    'other',
    '2020-08-29'
  );

INSERT INTO "expenses" ("id", "user_id", "name", "expense_amount", "expense_category", "date_created")
VALUES  
  (
    1,
    7,
    'rent',
    -40000,
    'bills',
    '2020-08-30'
  );

-- Because we explicitly set the id fields
-- Update the sequencer for future automatic id setting
SELECT setval('users_id_seq', (SELECT MAX(id) from users));
SELECT setval('goals_id_seq', (SELECT MAX(id) from goals));
SELECT setval('income_id_seq', (SELECT MAX(id) FROM income));
SELECT setval('expenses_id_seq', (SELECT MAX(id) FROM expenses));

COMMIT;