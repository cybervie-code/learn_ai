import { Assignment } from '../models/Assignment.js';
import { Quiz } from '../models/Quiz.js';
import { User } from '../models/User.js';
import { Attempt } from '../models/Attempt.js';
import { sendSuccess } from '../utils/sendResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// Faculty: create assignment
export const createAssignment = asyncHandler(async (req, res) => {
  const { title, description, quiz: quizId, cohorts, departments, targetAllCollege, startDate, dueDate, endDate, weight, isGraded, allowLateSubmission, latePenalty } = req.body;

  if (!title || !quizId || !dueDate) throw ApiError.badRequest('Title, quiz, and due date are required');
  if (!req.user.college) throw ApiError.badRequest('You are not associated with a college');

  // Verify quiz exists and is published
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw ApiError.notFound('Quiz not found');

  const assignment = new Assignment({
    title,
    description: description || '',
    college: req.user.college,
    createdBy: req.user._id,
    quiz: quizId,
    cohorts: cohorts || [],
    departments: departments || [],
    targetAllCollege: targetAllCollege || false,
    startDate: startDate || new Date(),
    dueDate,
    endDate: endDate || null,
    weight: weight || 0,
    isGraded: isGraded !== false,
    allowLateSubmission: allowLateSubmission || false,
    latePenalty: latePenalty || 0,
    status: 'published',
  });

  // Calculate total assigned
  let assignedCount = 0;
  if (targetAllCollege) {
    assignedCount = await User.countDocuments({ college: req.user.college, role: 'student', status: 'active' });
  } else if (cohorts?.length) {
    assignedCount = await User.countDocuments({ college: req.user.college, role: 'student', status: 'active', cohort: { $in: cohorts } });
  } else if (departments?.length) {
    assignedCount = await User.countDocuments({ college: req.user.college, role: 'student', status: 'active', department: { $in: departments } });
  }
  assignment.stats.totalAssigned = assignedCount;

  await assignment.save();
  sendSuccess(res, assignment, 'Assignment created', 201);
});

// List assignments (faculty sees their own, students see assigned to them)
export const listAssignments = asyncHandler(async (req, res) => {
  const query = { status: 'published' };

  if (req.user.role === 'student') {
    query.$or = [
      { targetAllCollege: true, college: req.user.college },
      { cohorts: req.user.cohort },
      { departments: req.user.department },
    ];
  } else if (req.user.role === 'faculty' || req.user.role === 'college-admin') {
    query.college = req.user.college;
    if (req.user.role === 'faculty') {
      query.createdBy = req.user._id;
    }
  }

  const assignments = await Assignment.find(query)
    .sort({ dueDate: 1 })
    .populate('quiz', 'title totalQuestions totalPoints estimatedMinutes')
    .populate('cohorts', 'name programme branch')
    .populate('createdBy', 'name')
    .lean();

  // For students: add submission status
  if (req.user.role === 'student') {
    for (const assignment of assignments) {
      const attempt = await Attempt.findOne({
        user: req.user._id,
        assignment: assignment._id,
        status: 'finalised',
      }).select('percentage correctCount createdAt');
      assignment.mySubmission = attempt || null;
    }
  }

  sendSuccess(res, assignments, 'Assignments fetched');
});

// Get a single assignment
export const getAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate('quiz', 'title description totalQuestions totalPoints rules estimatedMinutes')
    .populate('cohorts', 'name programme branch')
    .populate('departments', 'name code')
    .populate('createdBy', 'name');

  if (!assignment) throw ApiError.notFound('Assignment not found');
  sendSuccess(res, assignment, 'Assignment fetched');
});

// Get assignment results (faculty)
export const getAssignmentResults = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) throw ApiError.notFound('Assignment not found');

  const attempts = await Attempt.find({
    assignment: assignment._id,
    status: 'finalised',
  })
    .populate('user', 'name rollNumber branch cohort')
    .select('user percentage correctCount incorrectCount skippedCount earnedPoints totalPoints submittedAt')
    .sort({ percentage: -1 });

  const stats = {
    totalAssigned: assignment.stats.totalAssigned,
    totalSubmitted: attempts.length,
    averageScore: attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
      : 0,
    highestScore: attempts.length > 0 ? Math.max(...attempts.map((a) => a.percentage)) : 0,
    lowestScore: attempts.length > 0 ? Math.min(...attempts.map((a) => a.percentage)) : 0,
  };

  sendSuccess(res, { assignment, attempts, stats }, 'Assignment results fetched');
});
