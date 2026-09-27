const Teacher = require('../models/Teacher');
const crudFactory = require('./crudFactory');

module.exports = crudFactory(Teacher);
