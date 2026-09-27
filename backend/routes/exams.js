const Exam = require('../models/Exam');
const crudFactory = require('./crudFactory');

module.exports = crudFactory(Exam);
