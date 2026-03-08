const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const roleGuard = require('../middleware/roleGuard');
const hod = require('../controllers/hodController');

router.use(verifyToken, roleGuard('hod'));

// Classes
router.post('/classes', hod.createClass);
router.get('/classes', hod.getClasses);
router.delete('/classes/:id', hod.deleteClass);

// Subjects
router.post('/subjects', hod.createSubject);
router.get('/subjects', hod.getSubjects);
router.delete('/subjects/:id', hod.deleteSubject);

// Users
router.post('/users', hod.addUser);
router.get('/users', hod.getUsers);
router.put('/users/:id', hod.updateUser);
router.delete('/users/:id', hod.deleteUser);

// Mappings
router.post('/mappings', hod.createMapping);
router.get('/mappings', hod.getMappings);
router.delete('/mappings/:id', hod.deleteMapping);

// Enrollments
router.post('/enrollments', hod.createEnrollment);
router.get('/enrollments', hod.getEnrollments);
router.delete('/enrollments/:id', hod.deleteEnrollment);

// Sessions
router.post('/session/start', hod.startSession);
router.put('/session/:id/close', hod.closeSession);

// Reports
router.get('/attendance/report', hod.getAttendanceReport);
router.get('/dashboard', hod.getDashboardStats);

module.exports = router;
