const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const roleGuard = require('../middleware/roleGuard');
const tc = require('../controllers/teacherController');

router.use(verifyToken, roleGuard('teacher'));

router.get('/classes', tc.getAssignedClasses);
router.get('/dashboard', tc.getDashboard);
router.post('/session/start', tc.startSession);
router.put('/session/:id/close', tc.closeSession);
router.get('/session/:id/attendance', tc.getSessionAttendance);
router.get('/reports', tc.getReports);

module.exports = router;
