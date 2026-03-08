const router = require('express').Router();
const { login, registerDepartment } = require('../controllers/authController');

router.post('/login', login);
router.post('/register-department', registerDepartment);

module.exports = router;
