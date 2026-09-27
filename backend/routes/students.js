const Student = require('../models/Student');
const crudFactory = require('./crudFactory');

module.exports = crudFactory(Student);
