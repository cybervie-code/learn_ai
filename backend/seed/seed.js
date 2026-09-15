import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { College } from '../src/models/College.js';
import { Department } from '../src/models/Department.js';
import { Cohort } from '../src/models/Cohort.js';
import { Competency } from '../src/models/Competency.js';
import { LearningPath } from '../src/models/LearningPath.js';
import { Mission } from '../src/models/Mission.js';
import { Quiz } from '../src/models/Quiz.js';
import { Question } from '../src/models/Question.js';
import { Badge } from '../src/models/Badge.js';

async function seed() {
  console.log('Connecting to database...');
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    College.deleteMany({}),
    Department.deleteMany({}),
    Cohort.deleteMany({}),
    Competency.deleteMany({}),
    LearningPath.deleteMany({}),
    Mission.deleteMany({}),
    Quiz.deleteMany({}),
    Question.deleteMany({}),
    Badge.deleteMany({}),
  ]);

  // ---- Superadmin ----
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(process.env.SUPERADMIN_PASSWORD || 'ChangeMe123!', salt);
  const superadmin = await User.create({
    email: process.env.SUPERADMIN_EMAIL || 'admin@cybervie.in',
    name: 'Cybervie Superadmin',
    password: hashedPassword,
    platformRole: 'superadmin',
    role: 'student',
    status: 'active',
  });
  console.log('Created superadmin:', superadmin.email);

  // ---- College ----
  const college = await College.create({
    name: 'Indian Institute of Technology Demo',
    legalName: 'Indian Institute of Technology Demo',
    shortCode: 'IITD',
    website: 'https://demo.iitd.ac.in',
    city: 'New Delhi',
    state: 'Delhi',
    aicteId: 'AICTE-DEMO-001',
    lifecycle: 'fully-active',
    status: 'active',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    subscription: { plan: 'pro', status: 'active', seatLimit: 500, seatsUsed: 0 },
    domains: [{
      domain: 'demo.iitd.ac.in',
      verificationMethod: 'manual',
      verified: true,
      verifiedAt: new Date(),
      verifiedBy: superadmin._id,
    }],
    owner: null,
  });
  console.log('Created college:', college.name);

  // ---- Departments ----
  const cseDept = await Department.create({ name: 'Computer Science & Engineering', code: 'CSE', college: college._id });
  const eceDept = await Department.create({ name: 'Electronics & Communication', code: 'ECE', college: college._id });
  console.log('Created departments');

  // ---- Cohorts ----
  const cohort1 = await Cohort.create({
    name: 'CSE 2023-2027',
    college: college._id,
    department: cseDept._id,
    programme: 'B.Tech',
    branch: 'CSE',
    academicYear: '2023-2024',
    semester: 5,
    graduationYear: 2027,
  });
  console.log('Created cohort');

  // ---- College Admin ----
  const adminPassword = await bcrypt.hash('Admin123!', salt);
  const collegeAdmin = await User.create({
    email: 'admin@demo.iitd.ac.in',
    name: 'College Admin',
    password: adminPassword,
    role: 'college-admin',
    platformRole: null,
    college: college._id,
    department: cseDept._id,
    status: 'active',
  });
  college.owner = collegeAdmin._id;
  college.admins = [collegeAdmin._id];
  await college.save();
  console.log('Created college admin:', collegeAdmin.email);

  // ---- Faculty ----
  const facultyPassword = await bcrypt.hash('Faculty123!', salt);
  const faculty = await User.create({
    email: 'faculty@demo.iitd.ac.in',
    name: 'Dr. AI Faculty',
    password: facultyPassword,
    role: 'faculty',
    college: college._id,
    department: cseDept._id,
    status: 'active',
  });
  console.log('Created faculty:', faculty.email);

  // ---- Students ----
  const students = [];
  const studentNames = ['Aarav Sharma', 'Priya Patel', 'Arjun Kumar', 'Sneha Reddy', 'Rahul Verma', 'Ananya Singh', 'Vikram Gupta', 'Pooja Nair'];
  for (let i = 0; i < studentNames.length; i++) {
    const studentPassword = await bcrypt.hash('Student123!', salt);
    const student = await User.create({
      email: `student${i + 1}@demo.iitd.ac.in`,
      name: studentNames[i],
      password: studentPassword,
      role: 'student',
      college: college._id,
      department: cseDept._id,
      cohort: cohort1._id,
      rollNumber: `CSE23${String(i + 1).padStart(3, '0')}`,
      programme: 'B.Tech',
      branch: 'CSE',
      graduationYear: 2027,
      currentSemester: 5,
      status: 'active',
      learningXP: Math.floor(Math.random() * 500) + 50,
      streak: { current: Math.floor(Math.random() * 10), longest: Math.floor(Math.random() * 20), lastActiveDate: new Date() },
    });
    students.push(student);
  }
  console.log(`Created ${students.length} students`);

  // ---- Competencies ----
  const competencies = await Competency.create([
    { name: 'AI Fundamentals', code: 'AI-FOUND-01', dimension: 'ai-techniques', level: 'understand', order: 1 },
    { name: 'Generative AI Concepts', code: 'AI-GEN-01', dimension: 'ai-techniques', level: 'understand', order: 2 },
    { name: 'Prompt Engineering', code: 'AI-PROMPT-01', dimension: 'ai-system-design', level: 'apply', order: 3 },
    { name: 'AI Ethics & Bias', code: 'AI-ETHICS-01', dimension: 'ethics-of-ai', level: 'understand', order: 4 },
    { name: 'AI Security Basics', code: 'AI-SEC-01', dimension: 'ai-security', level: 'understand', order: 5 },
    { name: 'Cyber Hygiene', code: 'CYBER-HYG-01', dimension: 'ai-security', level: 'understand', order: 6 },
    { name: 'LLM Hallucinations', code: 'AI-LLM-01', dimension: 'ai-techniques', level: 'understand', order: 7 },
    { name: 'Responsible AI Usage', code: 'AI-RESP-01', dimension: 'human-centered-mindset', level: 'apply', order: 8 },
  ]);
  console.log('Created competencies');

  // ---- Questions ----
  const questions = [];

  // Question 1
  const q1 = await Question.create({
    questionType: 'single-choice',
    difficulty: 'easy',
    cognitiveLevel: 'understand',
    competency: competencies[0]._id,
    topic: 'AI Fundamentals',
    subtopic: 'What is AI',
    track: 'foundation',
    estimatedTime: 45,
    status: 'published',
    publishedAt: new Date(),
    versions: [{
      version: 1,
      questionText: 'Which statement best describes Artificial Intelligence?',
      options: [
        { key: 'A', text: 'AI is a programming language used for data analysis', isCorrect: false, explanation: 'AI is not a programming language. It is a field of computer science.' },
        { key: 'B', text: 'AI is the simulation of human intelligence processes by machines, especially computer systems', isCorrect: true, explanation: 'Correct. AI involves machines simulating human-like reasoning, learning, and decision-making.' },
        { key: 'C', text: 'AI is a type of computer hardware designed for gaming', isCorrect: false, explanation: 'AI is software and algorithms, not hardware.' },
        { key: 'D', text: 'AI is only used in robotics', isCorrect: false, explanation: 'AI is used in many domains beyond robotics: NLP, vision, recommendation systems, etc.' },
      ],
      explanation: 'Artificial Intelligence refers to the simulation of human intelligence in machines. It encompasses learning, reasoning, problem-solving, perception, and language understanding.',
      author: superadmin._id,
      reviewer: superadmin._id,
      approvedAt: new Date(),
      createdAt: new Date(),
    }],
    currentVersion: 1,
  });
  questions.push(q1);

  // Question 2
  const q2 = await Question.create({
    questionType: 'single-choice',
    difficulty: 'easy',
    cognitiveLevel: 'understand',
    competency: competencies[0]._id,
    topic: 'AI Fundamentals',
    subtopic: 'ML vs AI',
    track: 'foundation',
    estimatedTime: 45,
    status: 'published',
    publishedAt: new Date(),
    versions: [{
      version: 1,
      questionText: 'What is the relationship between AI and Machine Learning?',
      options: [
        { key: 'A', text: 'Machine Learning is a subset of AI that enables systems to learn from data', isCorrect: true, explanation: 'Correct. ML is a subset of AI where systems learn patterns from data instead of being explicitly programmed.' },
        { key: 'B', text: 'AI is a subset of Machine Learning', isCorrect: false, explanation: 'It is the opposite: ML is a subset of AI.' },
        { key: 'C', text: 'AI and Machine Learning are the same thing', isCorrect: false, explanation: 'AI is broader; ML is one approach within AI. Other approaches include rule-based systems and search algorithms.' },
        { key: 'D', text: 'Machine Learning replaces the need for AI', isCorrect: false, explanation: 'ML is part of AI, not a replacement for it.' },
      ],
      explanation: 'Machine Learning is a subset of Artificial Intelligence. While AI is the broader concept of machines simulating human intelligence, ML specifically focuses on algorithms that learn patterns from data.',
      author: superadmin._id,
      reviewer: superadmin._id,
      approvedAt: new Date(),
      createdAt: new Date(),
    }],
    currentVersion: 1,
  });
  questions.push(q2);

  // Question 3
  const q3 = await Question.create({
    questionType: 'single-choice',
    difficulty: 'medium',
    cognitiveLevel: 'understand',
    competency: competencies[6]._id,
    topic: 'LLM Hallucinations',
    subtopic: 'Causes',
    track: 'foundation',
    estimatedTime: 60,
    status: 'published',
    publishedAt: new Date(),
    versions: [{
      version: 1,
      questionText: 'An LLM generates a confident but factually incorrect answer about a historical event. What is this phenomenon called?',
      options: [
        { key: 'A', text: 'Overfitting', isCorrect: false, explanation: 'Overfitting is a training problem where a model memorizes training data. This is different from generating false information.' },
        { key: 'B', text: 'Hallucination', isCorrect: true, explanation: 'Correct. Hallucination is when an LLM generates plausible-sounding but factually incorrect information with high confidence.' },
        { key: 'C', text: 'Data poisoning', isCorrect: false, explanation: 'Data poisoning is a malicious attack on training data, not a natural model behavior.' },
        { key: 'D', text: 'Gradient explosion', isCorrect: false, explanation: 'Gradient explosion is a training instability, not an inference-time behavior.' },
      ],
      explanation: 'Hallucination occurs because LLMs generate text based on statistical patterns rather than factual knowledge. They predict the most likely next token, which can produce fluent but incorrect text. Mitigation strategies include RAG, fact-checking, and grounding.',
      author: superadmin._id,
      reviewer: superadmin._id,
      approvedAt: new Date(),
      createdAt: new Date(),
    }],
    currentVersion: 1,
  });
  questions.push(q3);

  // Question 4
  const q4 = await Question.create({
    questionType: 'single-choice',
    difficulty: 'medium',
    cognitiveLevel: 'apply',
    competency: competencies[2]._id,
    topic: 'Prompt Engineering',
    subtopic: 'Best Practices',
    track: 'foundation',
    estimatedTime: 60,
    status: 'published',
    publishedAt: new Date(),
    versions: [{
      version: 1,
      questionText: 'Which prompt is most likely to produce a useful, well-structured response from an LLM?',
      options: [
        { key: 'A', text: 'Tell me about AI', isCorrect: false, explanation: 'This is too vague. The LLM does not know the desired depth, format, or focus area.' },
        { key: 'B', text: 'Explain how transformer architectures work, focusing on self-attention. Use 3 sections with examples. Target audience: CS undergraduates.', isCorrect: true, explanation: 'Correct. This prompt specifies topic, focus, format, and audience, giving the LLM clear constraints.' },
        { key: 'C', text: 'AI stuff now', isCorrect: false, explanation: 'This is too vague and informal to produce a structured response.' },
        { key: 'D', text: 'Write everything about AI in one sentence', isCorrect: false, explanation: 'The constraint of one sentence for a vast topic will produce a superficial or incomplete answer.' },
      ],
      explanation: 'Effective prompts include: clear task definition, specific scope, desired format, target audience, and constraints. The more context you provide, the more useful the output.',
      author: superadmin._id,
      reviewer: superadmin._id,
      approvedAt: new Date(),
      createdAt: new Date(),
    }],
    currentVersion: 1,
  });
  questions.push(q4);

  // Question 5
  const q5 = await Question.create({
    questionType: 'single-choice',
    difficulty: 'medium',
    cognitiveLevel: 'understand',
    competency: competencies[4]._id,
    topic: 'AI Security',
    subtopic: 'Prompt Injection',
    track: 'ai-security',
    estimatedTime: 60,
    status: 'published',
    publishedAt: new Date(),
    versions: [{
      version: 1,
      questionText: 'A user tricks an LLM-based chatbot into ignoring its safety instructions by embedding hidden commands in a document the bot processes. What type of attack is this?',
      options: [
        { key: 'A', text: 'Direct prompt injection', isCorrect: false, explanation: 'Direct prompt injection is when the attacker directly inputs malicious instructions to the LLM.' },
        { key: 'B', text: 'Indirect prompt injection', isCorrect: true, explanation: 'Correct. Indirect prompt injection embeds malicious instructions in content the LLM processes (documents, web pages, emails).' },
        { key: 'C', text: 'Data poisoning', isCorrect: false, explanation: 'Data poisoning modifies training data, not inference-time input.' },
        { key: 'D', text: 'Denial of service', isCorrect: false, explanation: 'DoS attacks overwhelm systems with requests, not manipulate their behavior.' },
      ],
      explanation: 'Indirect prompt injection is a critical AI security risk (OWASP LLM Top 10). The attacker embeds instructions in data the LLM ingests, causing it to execute unintended actions. Defenses include input sanitization, output filtering, and limiting agent permissions.',
      author: superadmin._id,
      reviewer: superadmin._id,
      approvedAt: new Date(),
      createdAt: new Date(),
    }],
    currentVersion: 1,
  });
  questions.push(q5);

  // Question 6
  const q6 = await Question.create({
    questionType: 'single-choice',
    difficulty: 'easy',
    cognitiveLevel: 'understand',
    competency: competencies[3]._id,
    topic: 'AI Ethics',
    subtopic: 'Bias',
    track: 'foundation',
    estimatedTime: 50,
    status: 'published',
    publishedAt: new Date(),
    versions: [{
      version: 1,
      questionText: 'An AI hiring tool systematically ranks resumes from certain universities lower. What is the most likely cause?',
      options: [
        { key: 'A', text: 'The AI has a personal preference against those universities', isCorrect: false, explanation: 'AI does not have personal preferences. It reflects patterns in its training data.' },
        { key: 'B', text: 'Training data bias - the historical hiring data reflected past discriminatory patterns', isCorrect: true, explanation: 'Correct. AI learns from historical data. If past hiring was biased, the AI reproduces that bias.' },
        { key: 'C', text: 'The model architecture is flawed', isCorrect: false, explanation: 'While architecture matters, systematic bias in outputs is most commonly caused by biased training data.' },
        { key: 'D', text: 'The AI is malfunctioning', isCorrect: false, explanation: 'This is not a malfunction - the AI is working as designed, but the design learned from biased data.' },
      ],
      explanation: 'AI bias occurs when training data reflects historical inequalities or prejudices. The model learns these patterns and reproduces them. Mitigation requires diverse training data, bias auditing, and fairness-aware algorithms.',
      author: superadmin._id,
      reviewer: superadmin._id,
      approvedAt: new Date(),
      createdAt: new Date(),
    }],
    currentVersion: 1,
  });
  questions.push(q6);

  // Question 7
  const q7 = await Question.create({
    questionType: 'single-choice',
    difficulty: 'medium',
    cognitiveLevel: 'understand',
    competency: competencies[1]._id,
    topic: 'Generative AI',
    subtopic: 'How LLMs Work',
    track: 'foundation',
    estimatedTime: 60,
    status: 'published',
    publishedAt: new Date(),
    versions: [{
      version: 1,
      questionText: 'How does a Large Language Model (LLM) generate text?',
      options: [
        { key: 'A', text: 'By looking up answers in a pre-built database of facts', isCorrect: false, explanation: 'LLMs do not look up answers. They generate text based on learned patterns.' },
        { key: 'B', text: 'By predicting the most likely next token based on learned patterns and context', isCorrect: true, explanation: 'Correct. LLMs generate text token by token, predicting the most probable next token given the context.' },
        { key: 'C', text: 'By copying text from its training data verbatim', isCorrect: false, explanation: 'LLMs generate novel text based on patterns, not by copying training data (except in rare cases of memorization).' },
        { key: 'D', text: 'By using a search engine to find relevant information', isCorrect: false, explanation: 'Standard LLMs do not search the internet. RAG systems combine LLMs with search, but the LLM itself generates based on learned patterns.' },
      ],
      explanation: 'LLMs generate text autoregressively: they predict one token at a time based on the probability distribution learned during training. The context window provides the model with previous tokens to condition its predictions.',
      author: superadmin._id,
      reviewer: superadmin._id,
      approvedAt: new Date(),
      createdAt: new Date(),
    }],
    currentVersion: 1,
  });
  questions.push(q7);

  // Question 8
  const q8 = await Question.create({
    questionType: 'single-choice',
    difficulty: 'hard',
    cognitiveLevel: 'analyze',
    competency: competencies[1]._id,
    topic: 'Generative AI',
    subtopic: 'RAG',
    track: 'technical',
    estimatedTime: 75,
    status: 'published',
    publishedAt: new Date(),
    versions: [{
      version: 1,
      questionText: 'A company wants their AI assistant to answer questions using their internal documents accurately and with citations. Which approach should they use?',
      options: [
        { key: 'A', text: 'Fine-tune the LLM on all internal documents', isCorrect: false, explanation: 'Fine-tuning teaches style/patterns but does not guarantee factual accuracy or citations. It is also expensive to update.' },
        { key: 'B', text: 'Use Retrieval-Augmented Generation (RAG) to retrieve relevant documents and ground the LLM response', isCorrect: true, explanation: 'Correct. RAG retrieves relevant documents, provides them as context to the LLM, and generates grounded answers with traceable sources.' },
        { key: 'C', text: 'Increase the model size to improve accuracy', isCorrect: false, explanation: 'A bigger model does not know your internal documents and still hallucinates without grounding.' },
        { key: 'D', text: 'Use a longer prompt with all documents pasted in', isCorrect: false, explanation: 'Context windows are limited and pasting all documents is impractical, expensive, and does not scale.' },
      ],
      explanation: 'RAG (Retrieval-Augmented Generation) combines a retrieval system (search over a vector database of documents) with an LLM. The retriever finds relevant chunks, the LLM generates an answer grounded in those chunks, enabling citations and reducing hallucinations.',
      author: superadmin._id,
      reviewer: superadmin._id,
      approvedAt: new Date(),
      createdAt: new Date(),
    }],
    currentVersion: 1,
  });
  questions.push(q8);

  console.log(`Created ${questions.length} questions`);

  // ---- Quiz ----
  const quiz = await Quiz.create({
    title: 'AI Fundamentals Quiz',
    description: 'Test your understanding of AI fundamentals, generative AI, and responsible usage.',
    type: 'mission-quiz',
    status: 'published',
    isPublished: true,
    difficulty: 'beginner',
    estimatedMinutes: 10,
    author: superadmin._id,
    rules: {
      mode: 'learning',
      shuffleQuestions: true,
      shuffleOptions: true,
      showExplanations: true,
      showResults: 'immediate',
      passingScore: 60,
      allowRetry: true,
      maxAttempts: 0,
    },
    questions: questions.map((q, i) => ({ question: q._id, points: 10, order: i })),
    totalQuestions: questions.length,
    totalPoints: questions.length * 10,
  });
  console.log('Created quiz:', quiz.title);

  // ---- Learning Path ----
  const path = await LearningPath.create({
    title: 'AI Ready Student',
    slug: 'ai-ready-student',
    description: 'Master the fundamentals of AI, understand how generative AI works, and learn to use AI responsibly. This is the foundation track for every B.Tech student.',
    track: 'foundation',
    difficulty: 'beginner',
    estimatedHours: 8,
    icon: '🧠',
    isPublished: true,
    isFeatured: true,
    order: 1,
    competencies: [competencies[0]._id, competencies[1]._id, competencies[2]._id, competencies[3]._id, competencies[6]._id, competencies[7]._id],
    tags: ['AI', 'Foundations', 'Generative AI', 'Ethics'],
    targetBranches: [],
  });
  console.log('Created learning path:', path.title);

  // ---- Missions ----
  const mission1 = await Mission.create({
    title: 'What is Artificial Intelligence?',
    slug: 'what-is-ai',
    description: 'Understand what AI is, how it differs from ML and automation, and where it is used in everyday life.',
    learningPath: path._id,
    order: 1,
    estimatedMinutes: 12,
    difficulty: 'beginner',
    icon: '🤖',
    isPublished: true,
    status: 'published',
    xpReward: 50,
    quiz: quiz._id,
    competencies: [competencies[0]._id],
    learningObjectives: [
      'Define Artificial Intelligence and its scope',
      'Distinguish AI from Machine Learning and automation',
      'Identify AI applications in daily life',
    ],
    contentBlocks: [
      { type: 'heading', content: 'What is Artificial Intelligence?', order: 0 },
      { type: 'text', content: 'Artificial Intelligence (AI) is the simulation of human intelligence processes by machines, especially computer systems. These processes include learning, reasoning, problem-solving, perception, and language understanding.', order: 1 },
      { type: 'callout', content: 'Key Insight: AI is not a single technology. It is a broad field that includes Machine Learning, Natural Language Processing, Computer Vision, Robotics, and more.', order: 2 },
      { type: 'heading', content: 'AI vs ML vs Automation', order: 3 },
      { type: 'text', content: 'Automation follows pre-defined rules. Machine Learning learns patterns from data. AI is the umbrella field that encompasses both and more.', order: 4 },
      { type: 'heading', content: 'AI in Everyday Life', order: 5 },
      { type: 'text', content: 'You interact with AI daily: recommendation systems on YouTube and Netflix, Google Search, Siri and Alexa, spam filters, face recognition, and Google Maps routing.', order: 6 },
    ],
    author: superadmin._id,
  });

  const mission2 = await Mission.create({
    title: 'How Generative AI Works',
    slug: 'how-generative-ai-works',
    description: 'Understand how Large Language Models generate text, what tokens are, and why AI can hallucinate.',
    learningPath: path._id,
    order: 2,
    estimatedMinutes: 15,
    difficulty: 'beginner',
    icon: '✨',
    isPublished: true,
    status: 'published',
    xpReward: 60,
    competencies: [competencies[1]._id, competencies[6]._id],
    learningObjectives: [
      'Explain how LLMs generate text token by token',
      'Understand what tokens and context windows are',
      'Identify why hallucinations occur',
    ],
    contentBlocks: [
      { type: 'heading', content: 'How LLMs Generate Text', order: 0 },
      { type: 'text', content: 'Large Language Models generate text by predicting the most likely next token (word piece) based on patterns learned during training. They do not look up answers in a database - they generate based on statistical probabilities.', order: 1 },
      { type: 'callout', content: 'Think of it like: The model has read billions of pages of text and learned which words tend to follow which. It uses this knowledge to predict what comes next.', order: 2 },
      { type: 'heading', content: 'Tokens and Context Windows', order: 3 },
      { type: 'text', content: 'A token is a piece of text - roughly 3/4 of a word. The context window is how many tokens the model can consider at once. Larger context windows allow the model to process longer documents.', order: 4 },
      { type: 'heading', content: 'Why Hallucinations Happen', order: 5 },
      { type: 'text', content: 'Because LLMs generate based on probability, not fact, they can produce fluent but incorrect text. This is called hallucination. Mitigation strategies include RAG (Retrieval-Augmented Generation), fact-checking, and clear prompting.', order: 6 },
    ],
    author: superadmin._id,
  });

  // Update path with missions
  path.missions = [
    { mission: mission1._id, order: 1 },
    { mission: mission2._id, order: 2 },
  ];
  await path.save();
  console.log('Created missions');

  // ---- Badges ----
  await Badge.create([
    { name: 'First Steps', slug: 'first-steps', description: 'Complete your first mission', icon: '🎯', category: 'completion', rarity: 'common', criteria: { type: 'mission-complete', threshold: 1 } },
    { name: 'AI Explorer', slug: 'ai-explorer', description: 'Complete 5 missions', icon: '🧭', category: 'completion', rarity: 'common', criteria: { type: 'mission-complete', threshold: 5 } },
    { name: 'Bias Detective', slug: 'bias-detective', description: 'Master the AI Ethics & Bias competency', icon: '🔍', category: 'mastery', rarity: 'rare', criteria: { type: 'score-threshold', threshold: 80 }, competency: competencies[3]._id },
    { name: 'Prompt Engineer', slug: 'prompt-engineer', description: 'Master the Prompt Engineering competency', icon: '💬', category: 'mastery', rarity: 'rare', criteria: { type: 'score-threshold', threshold: 80 }, competency: competencies[2]._id },
    { name: '7-Day Streak', slug: '7-day-streak', description: 'Maintain a 7-day learning streak', icon: '🔥', category: 'streak', rarity: 'rare', criteria: { type: 'streak', threshold: 7 } },
    { name: 'AI Security Guardian', slug: 'ai-security-guardian', description: 'Master the AI Security Basics competency', icon: '🛡️', category: 'mastery', rarity: 'epic', criteria: { type: 'score-threshold', threshold: 80 }, competency: competencies[4]._id },
  ]);
  console.log('Created badges');

  console.log('\n========================================');
  console.log('Seed completed successfully!');
  console.log('========================================');
  console.log('\nLogin credentials:');
  console.log(`  Superadmin:  ${superadmin.email} / ${process.env.SUPERADMIN_PASSWORD || 'ChangeMe123!'}`);
  console.log(`  College Admin: admin@demo.iitd.ac.in / Admin123!`);
  console.log(`  Faculty: faculty@demo.iitd.ac.in / Faculty123!`);
  console.log(`  Student: student1@demo.iitd.ac.in / Student123!`);
  console.log(`  Verified domain: demo.iitd.ac.in`);
  console.log('\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
