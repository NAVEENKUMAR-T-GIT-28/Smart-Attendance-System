const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const roleGuard = require('../middleware/roleGuard');
const sc = require('../controllers/studentController');

router.use(verifyToken, roleGuard('student'));

router.get('/subjects', sc.getSubjects);
router.get('/session/active', sc.getActiveSessions);
router.post('/attendance/mark', sc.markAttendance);
router.get('/attendance/my', sc.getMyAttendance);
router.get('/attendance/percentage', sc.getPercentage);
router.get('/dashboard', sc.getDashboard);

module.exports = router;
