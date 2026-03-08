const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const roleGuard = require('../middleware/roleGuard');
const wa = require('../controllers/webauthnController');

router.use(verifyToken, roleGuard('student'));

router.post('/register-options', wa.registerOptions);
router.post('/register-verify', wa.registerVerify);
router.post('/auth-options', wa.authOptions);
router.post('/auth-verify', wa.authVerify);

module.exports = router;
