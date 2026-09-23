import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../src/config/db.js';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { LearningPath } from '../src/models/LearningPath.js';
import { Mission } from '../src/models/Mission.js';
import { Quiz } from '../src/models/Quiz.js';
import { Question } from '../src/models/Question.js';

/**
 * Seeds "Python Mastery: Zero to Programmer" — a complete 10-lesson Python
 * course that ramps from absolute beginner to writing real programs.
 * Structure follows the AI Mastery path and standard curricula (python.org
 * tutorial, CS50P, Automate the Boring Stuff): concept → code example →
 * common-trap callout → checkpoint quiz per lesson, then a 30-question
 * final assessment sampled evenly across all lessons.
 *
 * Questions favour predict-the-output / trace-the-code / spot-the-bug over
 * recall — students must mentally run the code, so answers aren't a
 * quick search away.
 *
 * Idempotent: re-running deletes and recreates this path's own missions and
 * checkpoint/final quizzes only; bank questions are upserted by text.
 * Run from backend/:
 *   node seed/python-mastery-path.js   or   npm run seed:python-path
 */

const PATH_SLUG = 'python-mastery';
const TOPIC = 'Python Programming';

const h = (content) => ({ type: 'heading', content });
const t = (content) => ({ type: 'text', content });
const c = (content) => ({ type: 'callout', content });
const code = (content) => ({ type: 'code', content });

// New question shorthand: q(text, options, correctIndex, explanation, difficulty)
const q = (text, opts, correct, exp, diff = 'medium') => ({ t: text, opts, correct, exp, diff });

const LESSONS = [
  {
    slug: 'python-first-steps',
    title: 'Python: First Steps',
    description:
      'Why Python dominates, writing your first program, how print() and variables work, and the habits that make code readable from day one.',
    icon: '\u{1F40D}',
    difficulty: 'beginner',
    estimatedMinutes: 15,
    xpReward: 50,
    objectives: [
      'Write and run a first Python program with print()',
      'Create and use variables, and follow naming rules',
      'Explain what makes Python "interpreted" and readable',
    ],
    reuse: [],
    questions: [
      q('You write: name = "Asha" then print(name). What appears?',
        ['"name"', '"Asha"', 'name', 'Asha'],
        3, 'Correct. print() outputs the value stored in the variable — the text Asha, without quotes. Quotes belong to the string literal, not the output.', 'easy'),
      q('Which of these is a VALID Python variable name?',
        ['2nd_place', 'my-score', 'total_marks', 'class'],
        2, 'Correct. Names can use letters, digits and underscores but cannot start with a digit, contain hyphens, or be a reserved word like class.', 'easy'),
      q('x = 10 then x = x + 5 — what does x hold now?',
        ['10', '5', '15', 'An error — x was already used'],
        2, 'Correct. Reassignment replaces the old value: x + 5 evaluates to 15 and is stored back into x.', 'easy'),
      q('score = 95 followed by Score = 80 — how many variables exist?',
        ['One — they are the same variable', 'Two — Python names are case-sensitive', 'Zero — this causes an error', 'One, holding 80'],
        1, 'Correct. Python is case-sensitive: score and Score are two different variables holding different values — a classic beginner trap.', 'medium'),
      q('age = "20" stores what kind of value?',
        ['A number, because 20 is numeric', 'A string, because of the quotes', 'An integer automatically', 'An error'],
        1, 'Correct. Quotation marks make it a string "20", not the number 20. age + 5 would fail — you would need int(age) first.', 'medium'),
    ],
    content: [
      t('Python is the most popular first language in the world — and for good reason. Instagram, Spotify, Netflix, NASA and most AI systems all run on it. This lesson gets you from zero to writing real code in fifteen minutes.'),
      h('Your first program'),
      t('A Python program is a text file of instructions, executed top to bottom. The classic first program is one line:'),
      code('print("Hello, world!")'),
      t('print() displays whatever you give it. Give it text in quotes and it shows the text. Give it a variable and it shows the value inside. Python is an interpreted language — you write code and run it directly; there is no separate compile step like in C or Java. That is why Python feels instant and is perfect for learning.'),
      h('Variables: labelled boxes for values'),
      t('A variable stores a value so you can use it later. You create one with = — called assignment:'),
      code('name = "Asha"      # a string (text)\nage = 20            # an integer (whole number)\ncgpa = 8.7          # a float (decimal number)\npassed = True       # a boolean (True/False)'),
      t('The # starts a comment — Python ignores everything after it. Comments are notes for humans; use them to explain WHY, not to narrate what the code obviously does.'),
      c('Naming rules: letters, digits and underscores only; cannot start with a digit; cannot be a reserved word (class, for, if...). Convention: use snake_case like total_marks. And remember — Python is case-sensitive: Score and score are different variables.'),
      h('Variables can change — that is the point'),
      t('Assignment is not a one-time deal. A variable holds whatever you most recently put in it:'),
      code('score = 10\nscore = score + 5   # read old score (10), add 5, store 15\nprint(score)        # 15'),
      c('Common trap: x = x + 5 looks like broken math but is normal code. Read = as "gets", not "equals". Python first evaluates the right side, then stores the result in the left.'),
      h('Why readability is Python\u2019s superpower'),
      t('Python was designed to read almost like English. Compare the same task in two languages and Python usually needs half the lines. That is not just comfort — readable code means fewer bugs, easier teamwork, and faster learning. It is why Python owns data science, AI, automation and web backends.'),
      c('Try it yourself: write three lines — store your name, your age, and your college in variables, then print all three.'),
    ],
  },
  {
    slug: 'numbers-strings-input',
    title: 'Numbers, Strings & Talking to the User',
    description:
      'int vs float, arithmetic operators including // and %, string methods and f-strings, and reading user input with input() — plus the type-conversion trap every beginner hits.',
    icon: '\u{1F522}',
    difficulty: 'beginner',
    estimatedMinutes: 15,
    xpReward: 50,
    objectives: [
      'Use arithmetic operators including floor division and modulus',
      'Format output with f-strings and manipulate strings',
      'Read input() and convert types correctly',
    ],
    reuse: [],
    questions: [
      q('What does 17 // 5 evaluate to in Python?',
        ['3.4', '3', '4', '2'],
        1, 'Correct. // is floor division — it divides and drops the decimal part. 17 / 5 gives 3.4; 17 // 5 gives 3.', 'medium'),
      q('What does 17 % 5 evaluate to?',
        ['3', '2', '3.4', '0'],
        1, 'Correct. % is the modulus operator — the remainder after division. 17 = 5\u00D73 + 2, so the remainder is 2. Modulus is how you test even/odd: n % 2 == 0.', 'medium'),
      q('marks = "85" then print(marks + 5) — what happens?',
        ['Prints 90', 'Prints "855"', 'TypeError — cannot add int to string', 'Prints 855 without quotes'],
        2, 'Correct. "85" is a string; adding 5 raises TypeError. Fix with int(marks) + 5. This is the #1 bug when using input(), which always returns a string.', 'medium'),
      q('name = "riya" — what does name.upper() produce, and does name change?',
        ['"RIYA" and name becomes "RIYA"', '"RIYA" but name stays "riya"', 'Error — strings have no methods', '"Riya" and name stays "riya"'],
        1, 'Correct. String methods RETURN a new string — strings are immutable. To keep the change you must write name = name.upper().', 'hard'),
      q('For f-string: age = 20; print(f"Next year: {age + 1}") outputs:',
        ['Next year: {age + 1}', 'Next year: 21', 'Next year: age + 1', 'Syntax error'],
        1, 'Correct. Inside an f-string, {expression} is evaluated as real Python — age + 1 computes 21 and is inserted into the text.', 'medium'),
    ],
    content: [
      t('Programs that only print fixed text are boring. This lesson makes yours interactive — doing real arithmetic and asking the user questions — and teaches you the type system that trips up every beginner once.'),
      h('int, float and the operators that matter'),
      t('Integers are whole numbers; floats have decimals. The arithmetic operators are +, -, *, / plus three Python favourites:'),
      code('17 / 5    # 3.4   \u2014 true division, always gives float\n17 // 5   # 3     \u2014 floor division, drops the remainder\n17 % 5    # 2     \u2014 modulus, the remainder itself\n2 ** 10   # 1024  \u2014 power, 2 to the 10th'),
      c('Modulus is secretly everywhere: n % 2 == 0 tests even numbers, minutes % 60 wraps a clock, index % n cycles through n options.'),
      h('Strings: text you can transform'),
      t('Strings are text in quotes. They come loaded with methods — functions attached to the value itself:'),
      code('name = "  riya sharma  "\nname.strip()      # "riya sharma"  \u2014 trims spaces\nname.upper()      # "  RIYA SHARMA  "\nname.replace("riya", "R.")  # "  R. sharma  "\nlen("hello")      # 5  \u2014 len() counts characters'),
      c('Critical trap: strings are immutable. name.upper() does NOT change name — it returns a NEW string. To keep the result: name = name.upper().'),
      h('f-strings: the modern way to format output'),
      t('An f-string is a string prefixed with f that evaluates {expressions} inside it:'),
      code('name = "Asha"\nscore = 87\nprint(f"{name} scored {score}/100")\n# Asha scored 87/100\n\nprint(f"Next year: {score + 1}")  # full expressions work too'),
      t('Prefer f-strings over the older "text" + str(x) concatenation — cleaner, faster, harder to get wrong.'),
      h('input() and the conversion trap'),
      t('input() pauses the program, shows a prompt, and returns whatever the user typed — ALWAYS as a string:'),
      code('age = input("Your age: ")     # user types 20\nprint(type(age))                  # <class \u2018str\u2019> \u2014 NOT a number!\n\nage = int(input("Your age: "))    # convert immediately\nprint(age + 1)                    # 21 \u2014 now arithmetic works'),
      c('The classic bug: age = input(...) then age + 5 crashes with TypeError. Fix: wrap with int() or float() at the moment of input. When input can be bad, int() raises ValueError — Lesson 10 shows how to handle that gracefully.'),
    ],
  },
  {
    slug: 'decisions-if-elif-else',
    title: 'Making Decisions: if, elif, else',
    description:
      'Boolean logic, comparison operators, and branching code with if/elif/else — including indentation rules, truthiness, and the = vs == trap.',
    icon: '\u{1F500}',
    difficulty: 'beginner',
    estimatedMinutes: 15,
    xpReward: 60,
    objectives: [
      'Write if/elif/else branches with correct indentation',
      'Use comparison and logical operators (and, or, not)',
      'Explain truthiness and avoid the = vs == bug',
    ],
    reuse: [],
    questions: [
      q('x = 7\nif x > 10:\n    print("big")\nelse:\n    print("small")\nWhat prints?',
        ['big', 'small', 'Nothing — 7 is neither', 'Error'],
        1, 'Correct. The condition x > 10 is False, so Python runs the else branch and prints small.', 'easy'),
      q('Which condition is True when marks is exactly 40?',
        ['marks > 40', 'marks >= 40', 'marks < 40', 'marks != 40'],
        1, 'Correct. >= means greater-than-or-equal — 40 qualifies. Boundary conditions like this are the most common source of off-by-one logic bugs.', 'easy'),
      q('if x = 5: inside an if statement produces:',
        ['True, because 5 is truthy', 'An assignment inside a condition — valid', 'SyntaxError — conditions need ==', 'False'],
        2, 'Correct. = assigns; == compares. Python protects you — assignment inside a condition is a syntax error, unlike C/JavaScript where it silently assigns.', 'medium'),
      q('What does bool("") evaluate to — and what does it mean?',
        ['True — it exists', 'False — empty string is falsy', 'Error — cannot convert', 'False — all strings are False'],
        1, 'Correct. Empty string, 0, 0.0, None, [] and {} are all "falsy" — treated as False in conditions. Everything else is truthy. if name: checks "did the user type anything?"', 'medium'),
      q('age = 20; has_id = True — what does (age >= 18 and has_id) evaluate to?',
        ['True', 'False', '20', 'Error'],
        0, 'Correct. and requires BOTH sides true. 20 >= 18 is True and has_id is True, so the whole expression is True — the "and" of two trues.', 'easy'),
    ],
    content: [
      t('So far your programs run the same way every time. Real programs decide: block or allow, pass or fail, discount or full price. This lesson gives Python a brain.'),
      h('The if statement — and Python\u2019s famous indentation'),
      t('Python has no curly braces. The indented block under if is what runs when the condition is True — indentation IS the syntax:'),
      code('age = int(input("Age: "))\n\nif age >= 18:\n    print("You can vote")        # runs only if True\n    print("Check the register")  # still inside the if\nprint("Done")                    # always runs \u2014 not indented'),
      c('Indentation is not style here — it is meaning. Mixing tabs and spaces or inconsistent indentation is a top beginner error. Use 4 spaces, always.'),
      h('elif and else: chains of choices'),
      t('elif (else-if) checks the next condition only when earlier ones failed; else is the catch-all:'),
      code('marks = int(input("Marks: "))\n\nif marks >= 90:\n    grade = "A"\nelif marks >= 75:\n    grade = "B"\nelif marks >= 40:\n    grade = "C"\nelse:\n    grade = "F"'),
      t('Python checks top to bottom and stops at the first True — order matters. A mark of 92 matches the first branch and never reaches the others.'),
      h('Comparisons and logic'),
      t('Comparisons produce booleans: == equal, != not equal, >, <, >=, <=. Combine them with and, or, not:'),
      code('age = 20\nhas_id = True\n\nage >= 18 and has_id   # True \u2014 both must hold\nage < 13 or age > 65   # False \u2014 either is enough\nnot has_id             # False \u2014 flips the value'),
      c('The classic trap: if marks == 40 or 50 or 60 does NOT do what you think — Python reads it as (marks == 40) or (50) or (60), and 50 is truthy so it is always True. Write marks in (40, 50, 60).'),
      h('Truthiness: conditions without comparisons'),
      t('Python treats values as "truthy" or "falsy". Falsy: False, 0, 0.0, "", [], {}, None. Everything else is truthy. So if cart: means "if the cart is not empty" — idiomatic, clean Python.'),
      c('But beware: if user_input: treats 0 the same as "nothing entered". When zero is a valid value, write if user_input is not None: to be precise.'),
    ],
  },
  {
    slug: 'loops-for-while',
    title: 'Repetition Power: for & while Loops',
    description:
      'Looping with for + range(), while loops, break/continue/else, accumulators — and how to avoid infinite loops.',
    icon: '\u{1F501}',
    difficulty: 'beginner',
    estimatedMinutes: 20,
    xpReward: 60,
    objectives: [
      'Write for loops over ranges and collections',
      'Write while loops that always terminate',
      'Use break and continue, and build accumulators',
    ],
    reuse: [],
    questions: [
      q('for i in range(3): print(i) — what prints?',
        ['1 2 3', '0 1 2', '0 1 2 3', '3'],
        1, 'Correct. range(3) produces 0, 1, 2 — it starts at 0 and stops BEFORE the end value. This trips everyone at first: range(n) gives exactly n values starting from 0.', 'easy'),
      q('total = 0\nfor n in [10, 20, 30]:\n    total += n\nWhat is total after the loop?',
        ['10', '30', '60', '0'],
        2, 'Correct. This is the accumulator pattern: start at 0, add each item. 10+20+30 = 60. total += n is shorthand for total = total + n.', 'easy'),
      q('for i in range(5):\n    if i == 3:\n        break\n    print(i)\nWhat is the LAST number printed?',
        ['5', '4', '3', '2'],
        3, 'Correct. break exits the loop entirely when i reaches 3 — so 0,1,2 print and 3 never reaches print(). The loop stops instantly.', 'medium'),
      q('Same loop but continue instead of break — what happens at i == 3?',
        ['Loop stops', '3 is skipped, 4 still prints', 'Error', '3 prints twice'],
        1, 'Correct. continue skips to the next iteration — 3 is skipped but 4 still prints. break escapes; continue skips one round.', 'medium'),
      q('n = 1\nwhile n < 100:\n    n += 1\nHow many times does the loop body run?',
        ['100', '99', '98', 'Infinite — while never stops'],
        1, 'Correct. n goes 1\u21922\u2192...\u2192100. The body runs while n < 100, i.e., for n = 1..99 = 99 times. If you forgot n += 1 inside, it would loop forever — the while-loop killer bug.', 'medium'),
    ],
    content: [
      t('Loops are why computers are worth having: they do in milliseconds what would take you hours. This lesson covers Python\u2019s two loops — for (repeat over a sequence) and while (repeat until a condition fails).'),
      h('for loops and range()'),
      t('for iterates over each item in a sequence — a list, a string, or a range of numbers:'),
      code('for i in range(5):        # 0, 1, 2, 3, 4\n    print(i)\n\nfor ch in "abc":            # \u2018a\u2019, \u2018b\u2019, \u2018c\u2019\n    print(ch)\n\nfor price in [199, 299, 49]:  # each list item\n    print(price)'),
      c('range() memorisation anchor: range(5) = 0..4, range(2, 8) = 2..7, range(0, 10, 2) = 0,2,4,6,8. The stop value is never included — always.'),
      h('The accumulator pattern — the most important loop idiom'),
      t('Almost every real loop does one of three things: totals values, counts matches, or builds a result. All three use the same skeleton:'),
      code('total = 0                      # 1. start empty\nfor price in [199, 299, 49]:     # 2. visit each item\n    total += price               # 3. fold it in\nprint(total)                     # 547'),
      code('count = 0\nfor mark in [45, 82, 91, 38, 67]:\n    if mark >= 40:\n        count += 1               # count the passes\nprint(count)                     # 4'),
      h('while: repeat until'),
      t('while keeps running as long as its condition stays True — perfect when you don\u2019t know how many iterations you need:'),
      code('balance = 1000\nyears = 0\nwhile balance < 2000:\n    balance *= 1.08     # 8% yearly growth\n    years += 1\nprint(years)            # how many years to double'),
      c('The killer bug: a while loop whose condition can never become False runs forever. Always verify something inside moves toward termination — like balance growing or n += 1.'),
      h('break and continue'),
      t('break exits the loop immediately — used for early exit once you found what you wanted. continue skips the rest of this iteration and moves to the next item:'),
      code('for n in range(100):\n    if n % 7 == 0 and n % 5 == 0:\n        print(n)      # 35 — first multiple of 7 and 5\n        break         # stop searching, job done'),
      c('Rule of thumb: for = "for each item" (known sequence), while = "until something happens" (unknown count). Picking the right one is half of writing clean loops.'),
    ],
  },
  {
    slug: 'lists-and-tuples',
    title: 'Lists & Tuples: Python\u2019s Workhorses',
    description:
      'Indexing and slicing, append/remove/sort, mutability, list-vs-tuple, and the aliasing bug that corrupts data silently.',
    icon: '\u{1F4CB}',
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    xpReward: 70,
    objectives: [
      'Index and slice lists including negative indices',
      'Use core list methods: append, remove, sort, pop',
      'Explain mutability and the aliasing trap',
    ],
    reuse: [],
    questions: [
      q('nums = [10, 20, 30, 40] — what is nums[1]?',
        ['10', '20', '30', 'Error'],
        1, 'Correct. Python indexes from 0: nums[0] is 10, nums[1] is 20. First element = index 0 — the rule behind a thousand off-by-one bugs.', 'easy'),
      q('nums = [10, 20, 30, 40] — what is nums[-1]?',
        ['Error — negative index', '10', '40', '0'],
        2, 'Correct. Negative indices count from the end: -1 is the last element (40), -2 is 30. nums[-1] is the idiomatic way to grab the last item.', 'easy'),
      q('nums = [10, 20, 30, 40, 50] — what does nums[1:4] return?',
        ['[10, 20, 30, 40]', '[20, 30, 40]', '[20, 30, 40, 50]', '[30]'],
        1, 'Correct. Slicing start:end includes start but EXCLUDES end — same rule as range(). Index 1 through 3 gives [20, 30, 40].', 'medium'),
      q('a = [1, 2, 3]\nb = a\nb.append(4)\nWhat is a now?',
        ['[1, 2, 3]', '[1, 2, 3, 4]', 'Error', '[4]'],
        1, 'Correct — and this surprises everyone. b = a copies the REFERENCE, not the list — both names point to the same list in memory. To actually copy: b = a.copy() or b = a[:].', 'hard'),
      q('marks = [55, 82, 38, 91] — after marks.sort(), what is marks[0]?',
        ['55', '38', '91', 'A new sorted list'],
        1, 'Correct. sort() sorts IN PLACE — it modifies marks itself and returns None. Assigning sorted_marks = marks.sort() leaves sorted_marks as None — use sorted(marks) for a new list.', 'hard'),
    ],
    content: [
      t('One variable, one value — fine for calculators. Real programs juggle hundreds of values: all marks, all users, all transactions. Lists are how Python holds collections, and they are the most-used structure in the language.'),
      h('Creating and indexing'),
      t('A list is an ordered sequence in square brackets. Indexing grabs one item — counting starts at 0, and negative indices count backwards from the end:'),
      code('nums = [10, 20, 30, 40]\n\nnums[0]    # 10 \u2014 first\nnums[1]    # 20\nnums[-1]   # 40 \u2014 last\nnums[-2]   # 30 \u2014 second from end\nlen(nums)  # 4'),
      c('nums[4] here raises IndexError — valid indices are 0..3 (or -1..-4). "Index out of range" is the most common error you will see this week.'),
      h('Slicing: cutting out sections'),
      t('list[start:end] produces a NEW list containing start up to but NOT including end — exactly like range():'),
      code('nums = [10, 20, 30, 40, 50]\n\nnums[1:4]    # [20, 30, 40]\nnums[:3]     # [10, 20, 30]   \u2014 from the start\nnums[2:]     # [30, 40, 50]   \u2014 to the end\nnums[::-1]   # [50, 40, 30, 20, 10] \u2014 reversed!'),
      h('Methods that change the list'),
      code('cart = ["book", "pen"]\n\ncart.append("bag")     # add to end \u2192 ["book","pen","bag"]\ncart.remove("pen")     # remove first match by VALUE\ncart.pop()             # remove & return last item\ncart.sort()            # sort in place\n"bag" in cart          # True \u2014 membership test'),
      c('Two traps in one line: sort() works in place and returns None — never write x = x.sort(). And remove() matches by value, pop() by position.'),
      h('Mutability and the aliasing trap'),
      t('Lists are mutable — changeable in place. That creates Python\u2019s sneakiest beginner bug:'),
      code('a = [1, 2, 3]\nb = a          # b does NOT copy the list!\nb.append(4)\nprint(a)       # [1, 2, 3, 4] \u2014 a changed too!\n\nb = a.copy()   # the fix: make a real copy'),
      t('b = a copies the reference — both names point at the same object. This is THE most important concept in this lesson: assignment never copies containers.'),
      h('Tuples: lists that cannot change'),
      t('A tuple uses parentheses and is immutable — no append, no reassignment of items:'),
      code('point = (10, 20)\npoint[0]      # 10\npoint[0] = 5  # TypeError \u2014 tuples are frozen\n\n# Tuple unpacking \u2014 a Python favourite:\nx, y = point           # x=10, y=20\nname, age = ("Asha", 20)'),
      c('Use tuples for fixed records — coordinates, RGB colours, (name, roll) pairs — and as dictionary keys. Use lists for collections that grow and change. Immutability is a feature: it prevents accidental modification.'),
    ],
  },
  {
    slug: 'dictionaries-and-sets',
    title: 'Dictionaries & Sets: Structured Data',
    description:
      'Key-value storage with dicts, safe access with .get(), iterating keys/values/items, counting patterns, and when sets beat lists.',
    icon: '\u{1F5C3}',
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    xpReward: 70,
    objectives: [
      'Create, read, update dicts and iterate with .items()',
      'Choose between dict[key] and dict.get(key)',
      'Use sets for uniqueness and membership tests',
    ],
    reuse: [],
    questions: [
      q('student = {"name": "Asha", "age": 20} — what does student["age"] return?',
        ['"age"', '20', '("age", 20)', 'Error'],
        1, 'Correct. A dict maps keys to values — indexing by key "age" retrieves 20, like a real dictionary: look up the word, get the meaning.', 'easy'),
      q('student = {"name": "Asha"} — what does student["gpa"] do?',
        ['Returns None', 'Returns 0', 'Raises KeyError', 'Creates the key'],
        2, 'Correct. Accessing a missing key with [] raises KeyError. For safe lookup use student.get("gpa") which returns None, or student.get("gpa", 0) for a default.', 'medium'),
      q('counts = {}\nfor w in ["a","b","a"]:\n    counts[w] = counts.get(w, 0) + 1\nWhat is counts at the end?',
        ['{"a": 2, "b": 1}', '{"a": 1, "b": 1}', '{"a": 3}', 'Error'],
        0, 'Correct — this is the word-count idiom you will use forever: get(key, 0) returns the current count or 0, then +1. "a" appeared twice, "b" once.', 'hard'),
      q('for k, v in scores.items(): iterates over what?',
        ['Keys only', 'Values only', 'Key-value pairs', 'Indices'],
        2, 'Correct. .items() yields (key, value) tuples — unpacked straight into k, v. .keys() gives keys, .values() gives values. Plain for k in dict also gives keys.', 'medium'),
      q('emails = ["a@x.com", "b@x.com", "a@x.com"] — how many unique emails, and the fastest way?',
        ['2 — use a for loop with .count()', '2 — set(emails)', '3 — dict(emails)', '2 — emails.unique()'],
        1, 'Correct. Sets store unique items — set(emails) gives {"a@x.com","b@x.com"} and len() gives 2. There is no .unique() method. Set membership tests are also far faster than lists.', 'medium'),
    ],
    content: [
      t('Lists answer "what is item number 3?" But real data is looked up by name, ID, or email — not position. Dictionaries answer "what is the value FOR this key?" and they power everything from JSON APIs to user profiles.'),
      h('Dict basics: keys \u2192 values'),
      code('student = {\n    "name": "Asha",\n    "age": 20,\n    "branch": "CSE",\n}\n\nstudent["name"]        # "Asha"\nstudent["age"] = 21    # update existing key\nstudent["gpa"] = 8.9   # add a new key\ndel student["branch"]  # remove a key'),
      c('Keys must be immutable (strings, numbers, tuples) and unique — a repeated key silently overwrites. Values can be anything, including lists and other dicts.'),
      h('The get() safety net'),
      t('dict[key] crashes with KeyError when the key is missing. dict.get(key) returns None instead, and get(key, default) returns your default:'),
      code('inventory = {"apples": 40}\n\ninventory["mangoes"]        # KeyError \u2014 crash\ninventory.get("mangoes")    # None \u2014 safe\ninventory.get("mangoes", 0) # 0 \u2014 safe with default'),
      h('The counting idiom — learn it once, use it forever'),
      t('The single most useful dict pattern counts occurrences. get() with a default makes it two lines:'),
      code('votes = ["a", "b", "a", "c", "b", "a"]\ncounts = {}\nfor v in votes:\n    counts[v] = counts.get(v, 0) + 1\n# {"a": 3, "b": 2, "c": 1}'),
      t('Same pattern, different clothes: count word frequencies, group students by branch, track login attempts per user. If you remember one thing from this lesson, remember counts.get(v, 0) + 1.'),
      h('Iterating dicts'),
      code('for name in scores:            # keys (same as .keys())\nfor mark in scores.values():   # values\nfor name, mark in scores.items():  # pairs \u2014 most common\n    print(name, mark)'),
      h('Sets: uniqueness machines'),
      t('A set is an unordered collection of unique items — duplicates silently disappear, and membership tests are near-instant even on millions of items:'),
      code('tags = {"python", "coding", "python"}   # {"python","coding"}\nemails = set(email_list)                     # dedupe in one line\n\nblocked = {"spam@x.com", "fake@y.com"}\nsender in blocked     # instant True/False\n\na = {1, 2, 3};  b = {2, 3, 4}\na & b   # {2, 3}    intersection\na | b   # {1,2,3,4} union'),
      c('Choosing the right structure: list = ordered duplicates allowed; dict = lookup by key; set = uniqueness + fast membership; tuple = fixed record. Choosing well is what makes code simple.'),
    ],
  },
  {
    slug: 'functions',
    title: 'Functions: Reusable Logic',
    description:
      'def, parameters and arguments, return values vs printing, scope, default and keyword arguments — the skill that turns scripts into programs.',
    icon: '\u{1F527}',
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    xpReward: 70,
    objectives: [
      'Define and call functions with parameters',
      'Explain return vs print and why it matters',
      'Use default/keyword arguments and respect scope',
    ],
    reuse: [],
    questions: [
      q('def greet(name):\n    return "Hi " + name\n\nx = greet("Asha") — what is x?',
        ['"Hi Asha" is printed, x is None', 'x is "Hi Asha"', 'Error — no print called', 'x is "name"'],
        1, 'Correct. return hands a value back to the caller, so x stores "Hi Asha". Nothing is printed — return and print are different things, the #1 confusion in this lesson.', 'easy'),
      q('def f():\n    print(42)\n\nresult = f() — what is result?',
        ['42', 'None', '0', 'Error'],
        1, 'Correct. A function with no return statement returns None. The 42 was printed to the screen — not handed back. Printing shows a value; returning passes it onward.', 'medium'),
      q('def add(a, b=10):\n    return a + b\n\nadd(5) returns:',
        ['Error — missing argument', '15', '5', '10'],
        1, 'Correct. b=10 is a default parameter — used when the caller omits it. add(5) uses a=5, b=10 \u2192 15. add(5, 2) would give 7.', 'medium'),
      q('def f():\n    x = 99\nf()\nprint(x) — what happens?',
        ['Prints 99', 'Prints None', 'NameError — x is local to f', 'Prints 0'],
        2, 'Correct. Variables created inside a function are local — they vanish when the function ends. x only exists during the call. This isolation is a feature: functions cannot accidentally corrupt your variables.', 'medium'),
      q('def total(*nums):\n    return sum(nums)\n\ntotal(1, 2, 3, 4) returns:',
        ['Error — too many arguments', '10', '(1, 2, 3, 4)', '24'],
        1, 'Correct. *nums collects any number of positional arguments into a tuple — sum((1,2,3,4)) is 10. This is how print() accepts unlimited items.', 'hard'),
    ],
    content: [
      t('Copy-pasting the same code three times means three places to fix every bug. Functions solve this: name a block of logic once, call it anywhere. This is the lesson where scripts start becoming programs.'),
      h('def, parameters, and calling'),
      code('def greet(name):            # name is a PARAMETER\n    return "Hi " + name       # give a value back\n\nmessage = greet("Asha")       # "Asha" is the ARGUMENT\nprint(message)                # Hi Asha'),
      t('def creates the function — the body does not run yet. Calling greet("Asha") runs it with name bound to "Asha". Parameters are the blanks; arguments are what you fill them with.'),
      h('return vs print: the confusion that matters'),
      t('print() shows a value to a human. return gives a value back to the code — storable, reusable, chainable. A function that only prints cannot be reused:'),
      code('def area_bad(l, w):\n    print(l * w)          # shows it, but nothing gets it back\n\ndef area_good(l, w):\n    return l * w          # caller can store/compare/reuse\n\na = area_good(4, 5)\ntotal = area_good(4, 5) + area_good(2, 3)   # 26'),
      c('And the flip side: a function with no return gives back None. result = f() where f only printed means result is None — a bug that confuses everyone once.'),
      h('Scope: the walls around functions'),
      t('Variables created inside a function are local — invisible outside and destroyed when the call ends. Variables outside are global — readable inside (but assignment inside creates a NEW local):'),
      code('tax = 0.18              # global\n\ndef price(cost):\n    return cost * (1 + tax)   # reads global tax \u2014 fine\n\ndef broken():\n    total = 99                # local \u2014 dies with the call\n\nbroken()\nprint(total)                  # NameError'),
      c('Why scope is good: two functions can both use a variable called i without interfering. Keep data flowing through parameters and returns, not shared globals — that is how professionals write testable code.'),
      h('Defaults, keywords, and *args'),
      code('def power(base, exp=2):         # default value\n    return base ** exp\n\npower(5)          # 25 \u2014 exp defaults to 2\npower(5, 3)       # 125\npower(exp=3, base=5)  # 125 \u2014 keyword args, any order\n\ndef total(*nums):                # any count of args\n    return sum(nums)\ntotal(1, 2, 3, 4)   # 10'),
      c('Design tip: a good function does ONE thing, has a clear name (verb: calculate_, is_, get_), and returns rather than prints. If you cannot name it without "and", split it.'),
    ],
  },
  {
    slug: 'strings-and-files',
    title: 'Strings & Files: Real-World Text',
    description:
      'String slicing and methods that matter, splitting and joining, reading/writing files safely with with, and parsing real text data.',
    icon: '\u{1F4C4}',
    difficulty: 'intermediate',
    estimatedMinutes: 15,
    xpReward: 70,
    objectives: [
      'Slice and transform strings confidently',
      'Split/join strings to parse structured text',
      'Read and write files using the with statement',
    ],
    reuse: [],
    questions: [
      q('s = "programming" — what is s[0:7]?',
        ['"programm"', '"program"', '"rogram"', '"programmi"'],
        1, 'Correct. Same slicing rule as lists: start included, end excluded. s[0:7] is characters 0\u20136 = "program" (7 letters).', 'medium'),
      q('line = "a,b,c" — what does line.split(",") return?',
        ['"a b c"', '["a", "b", "c"]', '("a", "b", "c")', '"abc"'],
        1, 'Correct. split() cuts a string into a LIST at each separator — the core of parsing CSV lines, sentences, log entries. The reverse is ",".join(list).', 'medium'),
      q('csv = "Asha,20,CSE" — after parts = csv.split(","), what is parts[1]?',
        ['"Asha"', '20', '"20"', '"CSE"'],
        2, 'Correct. parts is ["Asha","20","CSE"] — and "20" is a STRING because split() never converts types. parts[1] + 1 would crash; int(parts[1]) + 1 works.', 'hard'),
      q('Why is "with open(...)" preferred over plain open()?',
        ['It is faster', 'It auto-closes the file even if errors occur', 'It reads larger files', 'It encrypts the file'],
        1, 'Correct. with guarantees the file is closed when the block exits — even on an exception. Leaked file handles corrupt data and exhaust resources.', 'medium'),
      q('f.write("hello") to a file opened with mode "w" on an existing file will:',
        ['Append to the end', 'Erase the file then write', 'Fail — file exists', 'Write at the end only'],
        1, 'Correct. "w" truncates the file to empty first — a classic data-loss trap. Use mode "a" to append, or "x" to fail if the file already exists.', 'medium'),
    ],
    content: [
      t('Almost every real program touches text — names, CSV exports, log files, configs, JSON. This lesson combines string mastery with file handling: the two skills behind "real-world" Python.'),
      h('Strings are sequences — slice them like lists'),
      code('s = "programming"\n\ns[0]      # "p"\ns[-1]     # "g"\ns[0:7]    # "program"\ns[:4]     # "prog"\ns[::-1]   # "gnimmargorp" \u2014 reversed\nlen(s)    # 11'),
      c('Remember immutability: s[0] = "P" fails — you cannot edit a string in place. You always build a new one: s = "P" + s[1:].'),
      h('The methods you will actually use'),
      code('s = "  Asha Sharma  "\n\ns.strip()               # "Asha Sharma"\ns.lower()               # "  asha sharma  "\ns.replace("Asha", "R.") # "  R. Sharma  "\ns.startswith("  A")     # True\ns.find("Sharma")        # index or -1\n\n"python" in s           # False \u2014 membership test\n",".join(["a","b"])     # "a,b" \u2014 the join idiom'),
      h('split(): parsing structured text'),
      t('split() is how raw text becomes data. A CSV line, a sentence, a log entry — one call and it is a list you can loop over:'),
      code('line = "Asha,20,CSE,8.9"\nparts = line.split(",")\n# ["Asha", "20", "CSE", "8.9"]\n\nname, age, branch, gpa = line.split(",")   # unpack in one line\nage = int(age)                              # convert after splitting!'),
      c('Trap to internalise: split() always returns strings. "20" is text — convert with int()/float() before arithmetic. Half of all beginner file-parsing bugs are this one line.'),
      h('Files: the with statement'),
      code('# Reading — safe pattern, file auto-closes\nwith open("marks.txt") as f:\n    for line in f:\n        print(line.strip())\n\n# Writing\nwith open("out.txt", "w") as f:    # "w" erases! "a" appends\n    f.write("first line\\n")\n\n# Read everything at once\nwith open("data.txt") as f:\n    text = f.read()'),
      c('File modes that matter: "r" read (default), "w" write-and-ERASE, "a" append, "x" create-or-fail. Choose "w" carelessly and the old file is gone — no undo.'),
      h('Putting it together: a tiny log parser'),
      code('errors = 0\nwith open("app.log") as f:\n    for line in f:\n        if "ERROR" in line:\n            errors += 1\nprint(f"{errors} errors found")'),
      t('Four lines and you have something genuinely useful — this exact shape (open \u2192 loop lines \u2192 test each \u2192 count) underlies grep, log analysis, and half of data cleaning.'),
    ],
  },
  {
    slug: 'oop-classes-objects',
    title: 'OOP: Classes & Objects',
    description:
      'Classes as blueprints, __init__ and self, methods, attributes vs local variables, and inheritance — enough OOP to read and write real code.',
    icon: '\u{1F3D7}',
    difficulty: 'advanced',
    estimatedMinutes: 25,
    xpReward: 80,
    objectives: [
      'Define a class with __init__, attributes and methods',
      'Explain what self means and why it is required',
      'Use inheritance to extend a base class',
    ],
    reuse: [],
    questions: [
      q('class Dog:\n    def __init__(self, name):\n        self.name = name\n\nd = Dog("Rex") — what is d.name?',
        ['"name"', '"Rex"', 'Error — self.name is invalid', 'None'],
        1, 'Correct. __init__ runs automatically when Dog("Rex") is called. self is the new object; self.name = "Rex" stores the attribute ON that object.', 'medium'),
      q('In a method def bark(self): what does self represent?',
        ['The class itself', 'The specific object the method was called on', 'A reserved constant', 'The module'],
        1, 'Correct. When you call rex.bark(), Python passes rex as self — so the method knows WHICH object\u2019s data to use. That is why every method takes self first.', 'hard'),
      q('class Counter:\n    def __init__(self):\n        self.n = 0\n    def bump(self):\n        self.n += 1\n\nc = Counter(); c.bump(); c.bump() — what is c.n?',
        ['0', '1', '2', 'Error'],
        2, 'Correct. The object keeps its own state across calls: __init__ set n=0, each bump() incremented it. This is the essence of OOP — data and behaviour travel together.', 'medium'),
      q('class Cat(Animal): — what does this line declare?',
        ['Cat contains an Animal object', 'Cat inherits everything from Animal', 'Animal copies from Cat', 'A syntax error'],
        1, 'Correct. Cat(Animal) means Cat inherits Animal\u2019s methods and attributes, then can add or override its own. Reuse without copy-paste — the core promise of inheritance.', 'medium'),
      q('Two objects d1 = Dog("A") and d2 = Dog("B") share:',
        ['The same name attribute', 'The same self', 'The same class blueprint but separate attribute values', 'Nothing at all'],
        2, 'Correct. A class is the blueprint; objects are the buildings. Same methods, same attribute NAMES — but d1.name is "A" and d2.name is "B". Independent state, shared behaviour.', 'easy'),
    ],
    content: [
      t('So far your programs are scripts: do this, then that. Object-oriented programming packages data and the functions that operate on it into objects — and it is how every framework, library and large codebase is organised.'),
      h('A class is a blueprint; an object is what you build from it'),
      code('class Dog:\n    def __init__(self, name):     # runs at creation\n        self.name = name          # attribute stored ON the object\n\n    def bark(self):               # a method\n        return f"{self.name} says woof"\n\nrex = Dog("Rex")       # __init__ runs, name="Rex"\nbruno = Dog("Bruno")   # separate object, separate name\nprint(rex.bark())      # Rex says woof'),
      t('__init__ is the constructor — Python calls it automatically when you create an object. Whatever you attach to self lives on that object forever.'),
      h('self, demystified'),
      t('Every method takes self as its first parameter — it is how the method knows which object\u2019s data to touch. rex.bark() is really Dog.bark(rex) behind the scenes. self = "this specific object":'),
      code('class BankAccount:\n    def __init__(self, owner, balance=0):\n        self.owner = owner\n        self.balance = balance\n\n    def deposit(self, amount):\n        self.balance += amount   # this account\u2019s balance\n\na = BankAccount("Asha", 500)\nb = BankAccount("Ravi")\na.deposit(200)\nprint(a.balance, b.balance)   # 700  0 \u2014 independent state'),
      c('Mental model: attributes (self.x) are what an object KNOWS; methods are what it can DO. BankAccount knows owner and balance; it can deposit and withdraw.'),
      h('Why OOP exists at all'),
      t('Without classes, related data and logic scatter across loose variables and functions. With classes, a Student object carries name, marks AND the logic to compute grade — one package, reusable and testable. Frameworks like Django, Flask, pandas are all built on this pattern.'),
      h('Inheritance: extend, don\u2019t rewrite'),
      code('class Animal:\n    def __init__(self, name):\n        self.name = name\n    def speak(self):\n        return "..."\n\nclass Dog(Animal):               # Dog IS-A Animal\n    def speak(self):             # override parent behaviour\n        return "woof"\n\nclass Cat(Animal):\n    def speak(self):\n        return "meow"\n\npets = [Dog("Rex"), Cat("Tom")]\nfor p in pets:\n    print(p.speak())     # woof / meow \u2014 same call, different behaviour'),
      t('This is polymorphism: one interface (speak), many implementations. The loop does not care what kind of animal each object is — inheritance keeps the code clean.'),
      c('Beginner rule: use OOP when you have entities with state + behaviour (accounts, students, orders). Do not force classes onto simple scripts — a function is often enough. OOP is a tool, not a religion.'),
    ],
  },
  {
    slug: 'errors-modules-real-world',
    title: 'Errors, Modules & Real-World Python',
    description:
      'try/except for graceful failure, reading tracebacks, importing modules and the standard library, pip + virtual environments, and list comprehensions.',
    icon: '\u{1F680}',
    difficulty: 'advanced',
    estimatedMinutes: 20,
    xpReward: 80,
    objectives: [
      'Catch exceptions with try/except/else/finally',
      'Read a traceback and fix the real error',
      'Import modules and know the essentials of the standard library',
    ],
    reuse: [],
    questions: [
      q('try:\n    n = int("abc")\nexcept ValueError:\n    n = 0\nWhat is n?',
        ['"abc"', '0', 'Error — ValueError not caught', 'None'],
        1, 'Correct. int("abc") raises ValueError, the except ValueError block catches it, and n gets 0. The program continues instead of crashing — graceful failure.', 'easy'),
      q('Which is the BEST except clause?',
        ['except: (bare — catch everything)', 'except Exception:', 'except ValueError: (the specific error you expect)', 'try without except'],
        2, 'Correct. Catch the specific error you expect — a bare except: also swallows typos and bugs you never anticipated, hiding real problems. Specific is professional.', 'hard'),
      q('import math — how do you call the square-root function?',
        ['sqrt(16)', 'math.sqrt(16)', 'import math.sqrt(16)', 'math->sqrt(16)'],
        1, 'Correct. Plain import math gives the namespace — you qualify as math.sqrt(16). The alternative from math import sqrt lets you call sqrt(16) directly.', 'easy'),
      q('A traceback ends with "TypeError: unsupported operand" — where do you look FIRST?',
        ['The last line and the line number it points to', 'The first line of the file', 'The longest line', 'The import section'],
        0, 'Correct. Read tracebacks bottom-up: the last line names the error type, and the line just above shows the exact code that failed. The traceback is a map — learn to read it.', 'medium'),
      q('squares = [x*x for x in range(5)] — what is squares?',
        ['[1, 4, 9, 16, 25]', '[0, 1, 4, 9, 16]', '[0, 1, 2, 3, 4]', 'A generator object'],
        1, 'Correct. This is a list comprehension — a loop compressed to one line. range(5) gives 0..4; x*x squares each: [0,1,4,9,16].', 'medium'),
    ],
    content: [
      t('The difference between a script and software is what happens when things go wrong. This final lesson covers failing gracefully, the module system that makes Python powerful, and the comprehension syntax that makes it elegant.'),
      h('try/except: failing without crashing'),
      t('User types "abc" where you expected a number, a file is missing, a server is down — exceptions are normal events, not bugs. try/except lets you plan for them:'),
      code('try:\n    age = int(input("Age: "))\nexcept ValueError:\n    print("That is not a number")\n    age = None\n\n# Full shape:\ntry:\n    data = open("marks.txt").read()\nexcept FileNotFoundError:\n    print("File missing")\nelse:\n    print("Loaded OK")        # runs only if NO error\nfinally:\n    print("Always runs")      # cleanup either way'),
      c('Golden rule: catch the specific exception (ValueError, FileNotFoundError), never bare except:. A bare except swallows everything — including bugs you need to see — and turns a findable problem into a mystery.'),
      h('Reading a traceback'),
      t('When code crashes, Python prints a traceback — a report of WHERE it failed. Read it bottom to top: the last line names the exception (TypeError, KeyError...), the lines above point at the exact file and line number. The traceback is not the enemy — it is the map.'),
      code('Traceback (most recent call last):\n  File "app.py", line 7, in <module>\n    total = marks / count\nZeroDivisionError: division by zero\n\n\u2192 line 7 divided by zero. Fix the divisor, not the symptom.'),
      h('Modules: standing on giants\u2019 shoulders'),
      t('import brings in ready-made power — your own files or the standard library that ships with Python:'),
      code('import math\nmath.sqrt(16)          # 4.0\n\nfrom random import choice, randint\nchoice(["a", "b"])     # random pick\nrandint(1, 6)          # dice roll\n\nimport datetime, json, os, re, csv   # essentials to explore'),
      c('Standard library greatest hits: math, random, datetime, json (APIs!), csv, os/pathlib (files), re (patterns), collections (Counter \u2014 the counting idiom, built-in). Know they exist before you reinvent them.'),
      h('pip and virtual environments'),
      t('Beyond the standard library, pip installs from PyPI — 500,000+ packages: pip install requests pandas. A virtual environment (python -m venv .venv) isolates each project\u2019s packages so versions never collide — use one for every real project.'),
      h('List comprehensions: Python\u2019s signature move'),
      code('# The loop way\nevens = []\nfor x in range(10):\n    if x % 2 == 0:\n        evens.append(x)\n\n# The comprehension way \u2014 same thing, one line\nevens = [x for x in range(10) if x % 2 == 0]\nsquares = [x*x for x in range(5)]\nnames = [n.strip().lower() for n in raw_names]'),
      c('Comprehensions read left-to-right: "give me x*x for each x where condition". Dict/set versions exist too: {w: len(w) for w in words}. When the logic gets long, drop back to a normal loop — readability wins.'),
      h('Where next'),
      t('You now have the complete foundation: variables, types, decisions, loops, collections, functions, files, classes, errors and modules. Next steps that build directly on this: pandas for data, requests for APIs, Flask/Django for web, pytest for testing. The best way forward is a small project — automate something in your own life.'),
    ],
  },
];

async function build() {
  await connectDB();

  const author = await User.findOne({ platformRole: 'superadmin' }) || await User.findOne();
  if (!author) throw new Error('No users found in database');
  console.log('Author:', author.email);

  // ---- Index existing bank questions by current questionText ----
  const bank = await Question.find({}).lean();
  const textToQ = new Map();
  for (const doc of bank) {
    const v = doc.versions?.find((x) => x.version === doc.currentVersion) || doc.versions?.[doc.versions.length - 1];
    if (v?.questionText) textToQ.set(v.questionText, doc);
  }

  // ---- Idempotent cleanup of this path's own content ----
  const missionSlugs = LESSONS.map((l) => l.slug);
  const existingPath = await LearningPath.findOne({ slug: PATH_SLUG });
  const staleMissions = await Mission.find({
    $or: [
      { slug: { $in: missionSlugs } },
      ...(existingPath ? [{ learningPath: existingPath._id }] : []),
    ],
  });
  const staleIds = staleMissions.map((m) => m._id);
  const staleQuizIds = staleMissions.map((m) => m.quiz).filter(Boolean);

  // Delete this script's checkpoint quizzes and previous final first.
  const qdel = await Quiz.deleteMany({
    $or: [
      { slug: /^python-checkpoint-/ },
      { slug: 'python-mastery-final-assessment' },
      { mission: { $in: staleIds }, title: / — Checkpoint$/ },
      ...(existingPath
        ? [
            { learningPath: existingPath._id, type: 'mission-quiz' },
            { learningPath: existingPath._id, mission: null },
          ]
        : []),
    ],
  });
  if (qdel.deletedCount) console.log(`Cleanup: removed ${qdel.deletedCount} stale checkpoint/final quizzes`);

  // Any quiz still linked to a stale mission that survived cleanup is
  // third-party content — convert to arena practice rather than delete it.
  await Quiz.updateMany(
    {
      $or: [
        { mission: { $in: staleIds } },
        { _id: { $in: staleQuizIds } },
      ],
    },
    { $set: { type: 'practice', mission: null, learningPath: null } },
  );
  if (staleIds.length) {
    const mres = await Mission.deleteMany({ _id: { $in: staleIds } });
    console.log(`Cleanup: removed ${mres.deletedCount} stale missions`);
  }
  if (existingPath) await existingPath.deleteOne();

  // ---- Learning path (missions attached after creation) ----
  const path = await LearningPath.create({
    title: 'Python Mastery: Zero to Programmer',
    slug: PATH_SLUG,
    description:
      'A complete Python course for absolute beginners — from your first print() through data structures, functions, files and OOP, to real-world skills like error handling and modules. Ten lessons, beginner to advanced.',
    track: 'technical',
    difficulty: 'beginner',
    estimatedHours: 4,
    icon: '\u{1F40D}',
    isPublished: true,
    isFeatured: true,
    order: 3,
    tags: ['Python', 'Programming', 'Coding', 'Data Structures', 'OOP', 'Scripting', 'Beginner Friendly'],
    targetBranches: [],
  });
  console.log('Created path:', path.title);

  // ---- Lessons ----
  let newQ = 0;
  let reusedQ = 0;
  const lessonQuestions = []; // per-lesson question docs, for the final exam
  for (const [i, lesson] of LESSONS.entries()) {
    const order = i + 1;

    // New questions for this lesson — upsert by questionText so re-runs
    // reuse previously authored questions instead of duplicating the bank.
    const toCreate = lesson.questions.filter((n) => !textToQ.has(n.t));
    const preExisting = lesson.questions
      .filter((n) => textToQ.has(n.t))
      .map((n) => textToQ.get(n.t));
    const created = await Question.create(toCreate.map((n) => ({
      questionType: 'single-choice',
      difficulty: n.diff,
      cognitiveLevel: n.diff === 'easy' ? 'remember' : n.diff === 'hard' ? 'analyze' : 'understand',
      topic: TOPIC,
      subtopic: lesson.title,
      track: 'technical',
      estimatedTime: 60,
      status: 'published',
      publishedAt: new Date(),
      versions: [{
        version: 1,
        questionText: n.t,
        options: n.opts.map((text, j) => ({
          key: 'ABCD'[j],
          text,
          isCorrect: j === n.correct,
          explanation: j === n.correct ? n.exp : '',
        })),
        explanation: n.exp,
        author: author._id,
        reviewer: author._id,
        approvedAt: new Date(),
        createdAt: new Date(),
      }],
      currentVersion: 1,
    })));
    newQ += created.length;
    created.forEach((d) => {
      const v = d.versions[d.versions.length - 1];
      textToQ.set(v.questionText, d);
    });

    const questions = [...preExisting, ...created];
    lessonQuestions.push(questions);

    const quiz = await Quiz.create({
      title: `${lesson.title} — Checkpoint`,
      slug: `python-checkpoint-${lesson.slug}`,
      description: `Checkpoint for Lesson ${order} of Python Mastery: Zero to Programmer. Covers ${lesson.title.toLowerCase()}.`,
      type: 'mission-quiz',
      status: 'published',
      isPublished: true,
      difficulty: lesson.difficulty,
      estimatedMinutes: Math.max(5, Math.round(questions.length * 1.2)),
      author: author._id,
      mission: null,
      learningPath: path._id,
      rules: {
        mode: 'learning',
        timeLimit: 0,
        maxAttempts: 0,
        shuffleQuestions: true,
        shuffleOptions: true,
        showExplanations: true,
        showResults: 'immediate',
        passingScore: 60,
        negativeMarking: 0.25,
        allowRetry: true,
      },
      questions: questions.map((qd, j) => ({ question: qd._id, points: 10, order: j })),
      totalQuestions: questions.length,
      totalPoints: questions.length * 10,
    });

    const mission = await Mission.create({
      title: lesson.title,
      slug: lesson.slug,
      description: lesson.description,
      learningPath: path._id,
      order,
      contentBlocks: lesson.content.map((block, j) => ({ ...block, order: j })),
      quiz: quiz._id,
      estimatedMinutes: lesson.estimatedMinutes,
      difficulty: lesson.difficulty,
      learningObjectives: lesson.objectives,
      isPublished: true,
      status: 'published',
      xpReward: lesson.xpReward,
      icon: lesson.icon,
      tags: ['Python', lesson.title],
      author: author._id,
    });

    await Quiz.findByIdAndUpdate(quiz._id, { mission: mission._id });
    await LearningPath.findByIdAndUpdate(path._id, {
      $push: { missions: { mission: mission._id, order } },
    });

    console.log(`  Lesson ${order}/${LESSONS.length}: ${lesson.title} — ${created.length} new questions`);
  }

  // ---- Final assessment: 30 questions sampled evenly across the lessons ----
  // Deterministic pick: first/middle/last of each lesson's question set, so
  // re-runs produce the same exam and every lesson is equally represented.
  const PER_LESSON = 3;
  const seen = new Set();
  const finalQuestions = [];
  for (const qs of lessonQuestions) {
    const n = qs.length;
    const picks = n <= PER_LESSON
      ? qs
      : Array.from({ length: PER_LESSON }, (_, k) => qs[Math.floor(((n - 1) * k) / (PER_LESSON - 1))]);
    for (const qd of picks) {
      const id = String(qd._id);
      if (!seen.has(id)) {
        seen.add(id);
        finalQuestions.push(qd);
      }
    }
  }

  await Quiz.create({
    title: 'Python Mastery: Final Assessment',
    slug: 'python-mastery-final-assessment',
    description: `Final exam for Python Mastery: Zero to Programmer — ${finalQuestions.length} questions drawn evenly from all ten lessons. 30 minutes, 60% to pass, −25% per wrong answer, maximum 3 attempts. Correct answers are not released after submission.`,
    type: 'assessment',
    status: 'published',
    isPublished: true,
    difficulty: 'intermediate',
    estimatedMinutes: 30,
    author: author._id,
    mission: null, // no mission = final assessment, not a checkpoint
    learningPath: path._id,
    level: 1,
    rules: {
      mode: 'assessment',
      timeLimit: 1800, // 30 minutes
      maxAttempts: 3,
      shuffleQuestions: true,
      shuffleOptions: true,
      showExplanations: true,
      showResults: 'manual',
      passingScore: 60,
      negativeMarking: 0.25,
      allowRetry: true,
    },
    questions: finalQuestions.map((qd, j) => ({ question: qd._id, points: 10, order: j })),
    totalQuestions: finalQuestions.length,
    totalPoints: finalQuestions.length * 10,
  });
  console.log(`  Final assessment: ${finalQuestions.length} questions across ${lessonQuestions.length} lessons`);

  // ---- Verify ----
  const finalPath = await LearningPath.findById(path._id).lean();
  const quizCount = await Quiz.countDocuments({ learningPath: path._id, mission: { $ne: null } });

  console.log('\nDone.');
  console.log(`  Path "${PATH_SLUG}": ${finalPath.missions.length} missions, ${quizCount} checkpoint quizzes + 1 final`);
  console.log(`  Questions: ${newQ} new authored, ${reusedQ} reused from bank`);

  await mongoose.disconnect();
}

build().catch(async (err) => {
  console.error('FAILED:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
