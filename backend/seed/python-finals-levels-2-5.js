import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../src/config/db.js';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { LearningPath } from '../src/models/LearningPath.js';
import { Quiz } from '../src/models/Quiz.js';
import { Question } from '../src/models/Question.js';

/**
 * Adds Levels 2–5 final assessments to the "Python Mastery: Zero to
 * Programmer" learning path — 30 questions each:
 *
 *   Level 2 — Data, Structures & Core Semantics   (slicing, mutation, dicts,
 *             sets, tuples, comprehensions, sorting, truthiness)
 *   Level 3 — Functions, Scope & Program Design   (LEGB, defaults, *args,
 *             closures, lambda/map/filter, generators, recursion)
 *   Level 4 — OOP, Errors & Python Internals      (dunders, inheritance,
 *             iterators, context managers, exception hierarchy, imports)
 *   Level 5 — Real-World Python & Debugging       (bug-spotting, code review
 *             judgment, edge cases, performance intuition, capstone traces)
 *
 * Each quiz is a path final (learningPath set, mission: null) with its level
 * number, so level N unlocks only after every lesson checkpoint AND every
 * lower-level published final are passed (sequenceGate.quizLock).
 *
 * Questions live under a per-level topic so cleanup stays scoped — re-seeding
 * one level never touches another level's questions. All snippets are pure
 * standard Python — students must mentally execute or reason about real code.
 *
 * Idempotent: re-running deletes each selected level's quiz (by slug) and its
 * questions (by topic) and recreates them. Attempts already taken are NOT
 * touched — re-seeding after students have attempted should be avoided anyway.
 *
 * Run from backend/:  node seed/python-finals-levels-2-5.js
 *                 or  node seed/python-finals-levels-2-5.js --level=3
 * Pass --draft to create everything unpublished (invisible to students).
 */

const PUBLISH = !process.argv.includes('--draft');
const LEVEL_ARG = process.argv.find((a) => a.startsWith('--level='));
const ONLY_LEVEL = LEVEL_ARG ? Number(LEVEL_ARG.split('=')[1]) : null;

const PATH_SLUG = 'python-mastery';

// s = scenario/code shown above the question, q = the question itself,
// opts = option texts, correct = indexes of correct options, exp = explanation
const LEVELS = [
  {
    level: 2,
    slug: 'python-level2-final-assessment',
    title: 'Python Mastery — Level 2 Final: Data & Structures',
    topic: 'Python Level 2 — Data & Structures',
    difficulty: 'intermediate',
    timeLimit: 2400,
    estimatedMinutes: 40,
    maxAttempts: 3,
    description:
      'Level 2 final: 30 questions on Python data structures and core semantics — slicing, mutability, dictionaries, sets, tuples, comprehensions and truthiness. 40 minutes, 60% to pass, −25% per wrong answer, max 3 attempts. Answers are not released after submission. Unlocks after the Level 1 final.',
    questions: [
      {
        concept: 'String slicing', diff: 'easy',
        s: 'word = "CYBERVIE"\nresult = word[2:6]',
        q: 'What does result hold?',
        opts: ['"BERV"', '"BER"', '"ERVI"', '"BERVIE"'],
        correct: [0],
        exp: 'Slice [2:6] takes indexes 2,3,4,5 → B,E,R,V → "BERV". The end index is exclusive.',
      },
      {
        concept: 'Negative indexing', diff: 'easy',
        s: 'scores = [55, 72, 88, 91, 64]\nlast_but_one = scores[-2]',
        q: 'What is last_but_one?',
        opts: ['64', '91', '72', 'IndexError'],
        correct: [1],
        exp: 'Index -1 is the last element (64), so -2 is the second-to-last → 91.',
      },
      {
        concept: 'Slice stepping', diff: 'medium',
        s: 'nums = [1, 2, 3, 4, 5, 6]\nprint(nums[1::2])',
        q: 'What is printed?',
        opts: ['[2, 4, 6]', '[1, 3, 5]', '[2, 4]', '[1, 2, 3, 4, 5, 6]'],
        correct: [0],
        exp: 'Start at index 1, step by 2 → indexes 1,3,5 → [2, 4, 6].',
      },
      {
        concept: 'Reverse slicing', diff: 'easy',
        s: 's = "level"\nprint(s[::-1])',
        q: 'What is printed?',
        opts: ['"level"', '"leve"', '"evel"', 'TypeError — strings cannot be sliced backwards'],
        correct: [0],
        exp: 'Step -1 walks the string backwards; "level" reversed is still "level" (a palindrome).',
      },
      {
        concept: 'List aliasing trap', diff: 'medium',
        s: 'a = [1, 2, 3]\nb = a\nb.append(4)\nprint(a)',
        q: 'What is printed and why?',
        opts: [
          '[1, 2, 3, 4] — b is the same list object as a',
          '[1, 2, 3] — b was copied when assigned',
          '[1, 2, 3, 4] — a was copied back into b',
          'Error — you cannot append through an alias',
        ],
        correct: [0],
        exp: 'b = a binds a second name to the SAME list object. Mutating through either name affects the one shared list.',
      },
      {
        concept: 'Making an independent copy', diff: 'medium',
        s: 'A student writes:\noriginal = [5, 6, 7]\nbackup = original\n\nthen modifies backup and is surprised original changed too.',
        q: 'Which change gives backup its own list so original stays untouched?',
        opts: [
          'backup = original[:]',
          'backup = original + 0',
          'backup = str(original)',
          'It is impossible — lists cannot be copied',
        ],
        correct: [0],
        exp: 'Slicing the whole list (original[:]) — or original.copy() / list(original) — creates a new list object.',
      },
      {
        concept: 'append vs extend', diff: 'medium',
        s: 'lst = [1, 2]\nlst.append([3, 4])\nprint(len(lst))',
        q: 'What is printed?',
        opts: ['3', '4', '2', 'TypeError'],
        correct: [0],
        exp: 'append adds ONE element — the whole inner list — so len becomes 3: [1, 2, [3, 4]].',
      },
      {
        concept: 'extend behaviour', diff: 'easy',
        s: 'lst = [1, 2]\nlst.extend([3, 4])\nlst.extend("ab")\nprint(lst)',
        q: 'What is printed?',
        opts: [
          "[1, 2, 3, 4, 'a', 'b']",
          '[1, 2, [3, 4], "ab"]',
          '[1, 2, 3, 4, "ab"]',
          'TypeError — extend takes a list only',
        ],
        correct: [0],
        exp: 'extend iterates its argument — a list adds 2 items, a string adds its characters one by one.',
      },
      {
        concept: 'list() on a string', diff: 'easy',
        s: 'chars = list("code")',
        q: 'What is chars?',
        opts: ["['c', 'o', 'd', 'e']", "['code']", '"code"', 'TypeError'],
        correct: [0],
        exp: 'list() iterates the string, producing one element per character.',
      },
      {
        concept: 'sort() returns None', diff: 'medium',
        s: 'nums = [3, 1, 2]\nresult = nums.sort()\nprint(result, nums)',
        q: 'What is printed?',
        opts: [
          'None [1, 2, 3]',
          '[1, 2, 3] [1, 2, 3]',
          'None [3, 1, 2]',
          '[1, 2, 3] [3, 1, 2]',
        ],
        correct: [0],
        exp: 'list.sort() sorts IN PLACE and returns None. Use sorted(nums) if you need a sorted copy returned.',
      },
      {
        concept: 'dict.get default', diff: 'easy',
        s: 'inventory = {"apples": 4, "bananas": 2}\nprint(inventory.get("mangoes", 0))',
        q: 'What is printed?',
        opts: ['0', 'None', 'KeyError', '"mangoes"'],
        correct: [0],
        exp: 'dict.get returns the supplied default (0) for a missing key instead of raising KeyError.',
      },
      {
        concept: 'Missing dict key', diff: 'easy',
        s: 'inventory = {"apples": 4}\nprint(inventory["mangoes"])',
        q: 'What happens?',
        opts: ['KeyError is raised', 'Prints None', 'Prints 0', 'The key is created with value None'],
        correct: [0],
        exp: 'Square-bracket access on a missing key raises KeyError — unlike .get(), it has no default.',
      },
      {
        concept: 'Iterating a dict', diff: 'medium',
        s: 'prices = {"pen": 10, "book": 40}\nfor item in prices:\n    print(item)',
        q: 'What does the loop print?',
        opts: [
          'pen then book — dicts iterate over keys',
          '10 then 40 — dicts iterate over values',
          'pen 10 then book 40 — dicts iterate over pairs',
          'TypeError — dicts are not iterable',
        ],
        correct: [0],
        exp: 'Iterating a dict yields its KEYS. Use .items() for key+value pairs or .values() for values.',
      },
      {
        concept: 'The counting idiom', diff: 'medium',
        s: 'counts = {}\nfor w in ["red", "blue", "red", "green", "blue", "red"]:\n    counts[w] = counts.get(w, 0) + 1\nprint(counts)',
        q: 'What is printed?',
        opts: [
          "{'red': 3, 'blue': 2, 'green': 1}",
          "{'red': 1, 'blue': 1, 'green': 1}",
          'KeyError on the first iteration',
          "{'red': 2, 'blue': 2, 'green': 1}",
        ],
        correct: [0],
        exp: 'get(w, 0) supplies 0 for unseen words — the classic word-count pattern.',
      },
      {
        concept: 'Set deduplication', diff: 'easy',
        s: 'ids = [3, 1, 3, 2, 1, 3]\nprint(set(ids))',
        q: 'What is printed?',
        opts: ['{1, 2, 3}', '[1, 2, 3]', '{3, 1, 3, 2, 1, 3}', 'TypeError'],
        correct: [0],
        exp: 'Sets store unique elements only — duplicates are dropped (order is not guaranteed but the values are {1,2,3}).',
      },
      {
        concept: 'Set intersection', diff: 'medium',
        s: 'morning = {"ash", "ram", "zoe"}\nevening = {"ram", "mia", "zoe"}\nprint(morning & evening)',
        q: 'What is printed?',
        opts: [
          "{'ram', 'zoe'}",
          "{'ash', 'ram', 'zoe', 'mia'}",
          "{'ash', 'mia'}",
          'SyntaxError — & is not valid on sets',
        ],
        correct: [0],
        exp: '& is set intersection — members present in BOTH sets.',
      },
      {
        concept: 'Set indexing', diff: 'medium',
        s: 'unique = {10, 20, 30}\nprint(unique[0])',
        q: 'What happens?',
        opts: [
          'TypeError — sets are unordered and do not support indexing',
          'Prints 10',
          'Prints the smallest element',
          'Prints {10, 20, 30}',
        ],
        correct: [0],
        exp: 'Sets have no order, so indexing makes no sense — Python raises TypeError.',
      },
      {
        concept: 'Tuple immutability', diff: 'easy',
        s: 'point = (3, 4)\npoint[0] = 9',
        q: 'What happens?',
        opts: ['TypeError — tuples are immutable', 'point becomes (9, 4)', 'Nothing — it silently fails', 'SyntaxError'],
        correct: [0],
        exp: 'Tuples cannot be modified after creation — assignment to an element raises TypeError.',
      },
      {
        concept: 'Mutable object inside a tuple', diff: 'hard',
        s: 'record = ([1, 2], "open")\nrecord[0].append(3)\nprint(record)',
        q: 'What is printed?',
        opts: [
          '([1, 2, 3], "open")',
          'TypeError — tuples are immutable',
          '([1, 2], "open") — the append is ignored',
          '([3], "open")',
        ],
        correct: [0],
        exp: 'The tuple cannot change WHICH objects it holds, but a mutable object inside it (the list) can still change its own contents.',
      },
      {
        concept: 'List comprehension', diff: 'easy',
        s: 'squares = [x * x for x in range(5)]',
        q: 'What is squares?',
        opts: ['[0, 1, 4, 9, 16]', '[1, 4, 9, 16, 25]', '[0, 1, 2, 3, 4]', '[25]'],
        correct: [0],
        exp: 'range(5) yields 0–4, each squared → [0, 1, 4, 9, 16].',
      },
      {
        concept: 'Comprehension with filter', diff: 'medium',
        s: 'marks = [45, 82, 67, 38, 91]\npassed = [m for m in marks if m >= 60]',
        q: 'What is passed?',
        opts: ['[82, 67, 91]', '[45, 82, 67, 38, 91]', '[82, 91]', '[45, 38]'],
        correct: [0],
        exp: 'The if clause filters: only 82, 67 and 91 are >= 60.',
      },
      {
        concept: 'Dict comprehension', diff: 'medium',
        s: 'names = ["ada", "grace", "alan"]\nlengths = {n: len(n) for n in names}',
        q: 'What is lengths?',
        opts: [
          "{'ada': 3, 'grace': 5, 'alan': 4}",
          "{3: 'ada', 5: 'grace', 4: 'alan'}",
          "['ada': 3, 'grace': 5, 'alan': 4]",
          'SyntaxError',
        ],
        correct: [0],
        exp: 'Dict comprehensions map each key expression to its value expression — name → its length.',
      },
      {
        concept: 'join vs split', diff: 'easy',
        s: 'line = "2024,exam,passed"\nparts = line.split(",")\nback = "|".join(parts)',
        q: 'What is back?',
        opts: ['"2024|exam|passed"', '"2024,exam,passed"', '["2024", "exam", "passed"]', 'TypeError'],
        correct: [0],
        exp: 'split breaks on the delimiter into a list; "|".join reassembles using the pipe.',
      },
      {
        concept: 'String methods do not mutate', diff: 'medium',
        s: 'name = "  python  "\nname.strip()\nname.upper()\nprint(name)',
        q: 'What is printed?',
        opts: [
          '"  python  " — both results were discarded',
          '"PYTHON"',
          '"python"',
          '"  PYTHON  "',
        ],
        correct: [0],
        exp: 'Strings are immutable — strip() and upper() RETURN new strings; ignoring the return values leaves name unchanged.',
      },
      {
        concept: 'The in operator', diff: 'easy',
        s: 'print("py" in "python")\nprint(3 in [1, 2, 3])\nprint("a" in {"a": 1, "b": 2})',
        q: 'What are the three results?',
        opts: ['True True True', 'True True False', 'False True True', 'True False True'],
        correct: [0],
        exp: 'in checks substring for strings, membership for lists, and KEYS for dicts — all three are True.',
      },
      {
        concept: 'Nested list indexing', diff: 'easy',
        s: 'grid = [[1, 2], [3, 4], [5, 6]]\nprint(grid[1][0] + grid[2][1])',
        q: 'What is printed?',
        opts: ['9', '7', '4', 'TypeError'],
        correct: [0],
        exp: 'grid[1][0] is 3 and grid[2][1] is 6 → 3 + 6 = 9.',
      },
      {
        concept: 'remove vs pop', diff: 'medium',
        s: 'nums = [10, 20, 30]\nnums.remove(20)\nprint(nums)\nprint(nums.pop(0))',
        q: 'What are the two outputs?',
        opts: [
          '[10, 30] then 10',
          '[10, 30] then 20',
          '[20, 30] then 10',
          '[10, 20, 30] then 30',
        ],
        correct: [0],
        exp: 'remove(20) deletes by VALUE leaving [10, 30]; pop(0) removes by INDEX and returns it → 10.',
      },
      {
        concept: 'Built-in aggregations', diff: 'easy',
        s: 'marks = [70, 85, 60, 90]\nprint(len(marks), max(marks), min(marks), sum(marks))',
        q: 'What is printed?',
        opts: ['4 90 60 305', '4 90 60 300', '3 90 60 305', '90 60 305 4'],
        correct: [0],
        exp: 'len=4, max=90, min=60, sum=70+85+60+90=305.',
      },
      {
        concept: '== vs is', diff: 'hard',
        s: 'a = [1, 2]\nb = [1, 2]\nprint(a == b, a is b)',
        q: 'What is printed?',
        opts: [
          'True False',
          'True True',
          'False False',
          'False True',
        ],
        correct: [0],
        exp: '== compares VALUES (equal contents → True); is compares IDENTITY (two distinct list objects → False).',
      },
      {
        concept: 'Sorting keys', diff: 'hard', multi: true,
        s: 'A leaderboard stores {"mia": 88, "leo": 95, "zoe": 91}. A student wants the names ordered from highest to lowest score. Two snippets work.',
        q: 'Which TWO produce ["leo", "zoe", "mia"]? Select TWO.',
        opts: [
          '[k for k, v in sorted(scores.items(), key=lambda kv: kv[1], reverse=True)]',
          'sorted(scores, key=scores.get, reverse=True)',
          'sorted(scores, reverse=True)',
          'sorted(scores.values(), reverse=True)',
        ],
        correct: [0, 1],
        exp: 'Option 3 sorts names alphabetically reversed (ignores scores); option 4 returns the scores, not names.',
      },
    ],
  },
  {
    level: 3,
    slug: 'python-level3-final-assessment',
    title: 'Python Mastery — Level 3 Final: Functions & Design',
    topic: 'Python Level 3 — Functions & Design',
    difficulty: 'intermediate',
    timeLimit: 2400,
    estimatedMinutes: 40,
    maxAttempts: 3,
    description:
      'Level 3 final: 30 questions on functions and program design — scope and LEGB, default-argument traps, *args/**kwargs, return semantics, lambdas, map/filter, closures, generators and recursion. 40 minutes, 60% to pass, −25% per wrong answer, max 3 attempts. Unlocks after the Level 2 final.',
    questions: [
      {
        concept: 'print vs return', diff: 'easy',
        s: 'def add(a, b):\n    print(a + b)\n\nresult = add(2, 3)\nprint(result)',
        q: 'What is the second line printed?',
        opts: ['None', '5', '2', 'Error'],
        correct: [0],
        exp: 'The function displays 5 but returns nothing — functions without return give back None.',
      },
      {
        concept: 'First return wins', diff: 'medium',
        s: 'def check(n):\n    if n > 0:\n        return "pos"\n    return "non-pos"\n    return "unreachable"\n\nprint(check(5), check(-1))',
        q: 'What is printed?',
        opts: ['pos non-pos', 'pos unreachable', 'unreachable non-pos', 'SyntaxError — multiple returns'],
        correct: [0],
        exp: 'return exits the function immediately; the third line is dead code. Multiple returns are legal.',
      },
      {
        concept: 'Local shadows global', diff: 'medium',
        s: 'count = 10\n\ndef reset():\n    count = 0\n\nreset()\nprint(count)',
        q: 'What is printed?',
        opts: ['10', '0', 'UnboundLocalError', 'None'],
        correct: [0],
        exp: 'Assigning inside the function creates a NEW local count; the global stays 10 (no global keyword used).',
      },
      {
        concept: 'Reading globals is fine', diff: 'medium',
        s: 'rate = 1.1\n\ndef apply(x):\n    return x * rate\n\nprint(apply(10))',
        q: 'What is printed?',
        opts: ['11.0', 'NameError — rate not declared global', '10', 'None'],
        correct: [0],
        exp: 'Functions can READ globals freely (LEGB lookup). Only REASSIGNING them needs the global keyword.',
      },
      {
        concept: 'UnboundLocalError', diff: 'hard',
        s: 'total = 5\n\ndef bump():\n    total = total + 1\n\nbump()',
        q: 'What happens?',
        opts: [
          'UnboundLocalError — total is local everywhere in bump because it is assigned',
          'total becomes 6',
          'total becomes 1',
          'SyntaxError',
        ],
        correct: [0],
        exp: 'Python decides scope at compile time: since total is assigned in bump, it is local — reading it before assignment raises UnboundLocalError.',
      },
      {
        concept: 'Mutable default trap', diff: 'hard',
        s: 'def log(entry, entries=[]):\n    entries.append(entry)\n    return entries\n\nprint(log("a"))\nprint(log("b"))',
        q: 'What is printed?',
        opts: [
          '["a"] then ["a", "b"]',
          '["a"] then ["b"]',
          '["a", "b"] twice',
          'TypeError — mutable defaults are banned',
        ],
        correct: [0],
        exp: 'The default list is created ONCE at definition time and shared across calls — the classic Python gotcha. Use entries=None and create the list inside.',
      },
      {
        concept: '*args collects a tuple', diff: 'easy',
        s: 'def total(*nums):\n    return sum(nums)\n\nprint(total(1, 2, 3))',
        q: 'What is printed?',
        opts: ['6', '(1, 2, 3)', '123', 'TypeError — too many arguments'],
        correct: [0],
        exp: '*nums gathers any number of positional args into a tuple (1, 2, 3) → sum = 6.',
      },
      {
        concept: '**kwargs collects a dict', diff: 'medium',
        s: 'def show(**info):\n    print(info)\n\nshow(name="ada", age=36)',
        q: 'What is printed?',
        opts: [
          "{'name': 'ada', 'age': 36}",
          "('ada', 36)",
          'name=ada age=36',
          'TypeError — unexpected keyword arguments',
        ],
        correct: [0],
        exp: '**info gathers keyword arguments into a dictionary.',
      },
      {
        concept: 'Keyword arguments out of order', diff: 'medium',
        s: 'def describe(pet, owner):\n    return f"{pet} belongs to {owner}"\n\nprint(describe(owner="Ravi", pet="Milo"))',
        q: 'What is printed?',
        opts: [
          '"Milo belongs to Ravi"',
          '"Ravi belongs to Milo"',
          'TypeError — wrong argument order',
          'SyntaxError',
        ],
        correct: [0],
        exp: 'Keyword arguments bind by NAME, not position — order does not matter.',
      },
      {
        concept: 'Unpacking a call', diff: 'medium',
        s: 'def area(w, h):\n    return w * h\n\nsize = [4, 5]\nprint(area(*size))',
        q: 'What is printed?',
        opts: ['20', '[4, 5]', 'TypeError', '9'],
        correct: [0],
        exp: 'f(*list) unpacks the list into positional arguments — same as area(4, 5).',
      },
      {
        concept: 'Lambda basics', diff: 'easy',
        s: 'triple = lambda n: n * 3\nprint(triple(4))',
        q: 'What is printed?',
        opts: ['12', '64', '4', 'SyntaxError — lambdas need def'],
        correct: [0],
        exp: 'A lambda is an anonymous one-expression function — triple(4) returns 12.',
      },
      {
        concept: 'map', diff: 'medium',
        s: 'nums = [1, 2, 3]\nprint(list(map(lambda x: x + 10, nums)))',
        q: 'What is printed?',
        opts: ['[11, 12, 13]', '[1, 2, 3, 10]', '36', '[10, 20, 30]'],
        correct: [0],
        exp: 'map applies the function to every element; it is lazy so list() materialises it.',
      },
      {
        concept: 'filter', diff: 'medium',
        s: 'nums = [4, 9, 2, 7]\nprint(list(filter(lambda x: x % 2 == 0, nums)))',
        q: 'What is printed?',
        opts: ['[4, 2]', '[9, 7]', '[4, 9, 2, 7]', 'False True False False'],
        correct: [0],
        exp: 'filter keeps only elements where the predicate is truthy — the evens 4 and 2.',
      },
      {
        concept: 'sorted with key', diff: 'medium',
        s: 'words = ["kiwi", "banana", "fig", "cherry"]\nprint(sorted(words, key=len))',
        q: 'What is printed?',
        opts: [
          "['fig', 'kiwi', 'banana', 'cherry']",
          "['banana', 'cherry', 'fig', 'kiwi']",
          "['kiwi', 'banana', 'fig', 'cherry']",
          'TypeError — len is not callable here',
        ],
        correct: [0],
        exp: 'key=len sorts by word length: fig(3) < kiwi(4) < banana(6) = cherry(6); equal lengths keep original order.',
      },
      {
        concept: 'Closure', diff: 'hard',
        s: 'def counter():\n    n = 0\n    def inc():\n        nonlocal n\n        n += 1\n        return n\n    return inc\n\nc = counter()\nc()\nprint(c())',
        q: 'What is printed?',
        opts: ['2', '1', '0', 'NameError'],
        correct: [0],
        exp: 'inc remembers the enclosing variable n (a closure); two calls leave it at 2. nonlocal lets it rebind the outer name.',
      },
      {
        concept: 'Function factory', diff: 'medium',
        s: 'def multiplier(factor):\n    return lambda x: x * factor\n\ndouble = multiplier(2)\nprint(double(9))',
        q: 'What is printed?',
        opts: ['18', '11', '9', 'TypeError'],
        correct: [0],
        exp: 'multiplier returns a function capturing factor=2; double(9) → 18.',
      },
      {
        concept: 'Generator basics', diff: 'medium',
        s: 'def gen():\n    yield 1\n    yield 2\n    yield 3\n\nprint(list(gen()))',
        q: 'What is printed?',
        opts: ['[1, 2, 3]', '6', '1', 'generator object — nothing prints'],
        correct: [0],
        exp: 'yield makes the function a generator; list() pulls every yielded value.',
      },
        {
        concept: 'Generator laziness', diff: 'hard',
        s: 'def nums():\n    n = 0\n    while True:\n        yield n\n        n += 1\n\ng = nums()\nprint(next(g), next(g))',
        q: 'What is printed?',
        opts: ['0 1', 'infinite loop crash', '1 2', 'StopIteration'],
        correct: [0],
        exp: 'Generators run only until the next yield — an infinite generator is fine because values are produced on demand.',
      },
      {
        concept: 'StopIteration', diff: 'hard',
        s: 'g = (x for x in [10])\nprint(next(g))\nprint(next(g))',
        q: 'What happens on the second next()?',
        opts: ['StopIteration is raised', 'Prints None', 'Prints 10 again', 'IndexError'],
        correct: [0],
        exp: 'An exhausted generator raises StopIteration when next() is called again.',
      },
      {
        concept: 'Recursion trace', diff: 'medium',
        s: 'def fact(n):\n    if n <= 1:\n        return 1\n    return n * fact(n - 1)\n\nprint(fact(4))',
        q: 'What is printed?',
        opts: ['24', '10', '4', 'RecursionError'],
        correct: [0],
        exp: 'fact(4) = 4*3*2*1 = 24 — the base case stops the chain.',
      },
      {
        concept: 'Missing base case', diff: 'easy',
        s: 'def countdown(n):\n    print(n)\n    countdown(n - 1)\n\ncountdown(3)',
        q: 'What happens?',
        opts: [
          'RecursionError — maximum recursion depth exceeded',
          'Prints 3 2 1 0 then stops',
          'Runs forever',
          'SyntaxError',
        ],
        correct: [0],
        exp: 'No base case → Python hits its recursion limit (~1000 frames) and raises RecursionError rather than running forever.',
      },
      {
        concept: 'finally always runs', diff: 'medium',
        s: 'def f():\n    try:\n        return "try"\n    finally:\n        print("cleanup")\n\nprint(f())',
        q: 'What is printed, in order?',
        opts: [
          'cleanup then "try"',
          '"try" then cleanup',
          'Only "try"',
          'Only cleanup',
        ],
        correct: [0],
        exp: 'The finally block executes BEFORE the function actually returns — cleanup prints first, then the return value.',
      },
      {
        concept: 'Functions are objects', diff: 'medium',
        s: 'def hello():\n    return "hi"\n\nalias = hello\nprint(alias())',
        q: 'What is printed?',
        opts: ['"hi"', 'Error — functions cannot be assigned', 'alias', 'None'],
        correct: [0],
        exp: 'Functions are first-class objects — alias references the same function and can be called.',
      },
      {
        concept: 'Pass-by-assignment: mutation', diff: 'hard',
        s: 'def touch(lst):\n    lst.append(99)\n\ndef retag(lst):\n    lst = [0]\n\nx = [1]\ntouch(x)\nretag(x)\nprint(x)',
        q: 'What is printed?',
        opts: ['[1, 99]', '[0]', '[1]', '[1, 99, 0]'],
        correct: [0],
        exp: 'Mutating the shared object (append) is visible to the caller; rebinding the local name (lst = [0]) is not.',
      },
      {
        concept: 'Immutable argument', diff: 'medium',
        s: 'def grow(n):\n    n = n + 5\n    return n\n\nx = 10\ngrow(x)\nprint(x)',
        q: 'What is printed?',
        opts: ['10', '15', 'None', 'Error'],
        correct: [0],
        exp: 'Ints are immutable — the function rebinds its own local n; caller x stays 10.',
      },
      {
        concept: 'enumerate', diff: 'easy',
        s: 'for i, ch in enumerate("ab", start=1):\n    print(i, ch, end=" ")',
        q: 'What is printed?',
        opts: ['1 a 2 b', '0 a 1 b', 'a 1 b 2', 'TypeError'],
        correct: [0],
        exp: 'enumerate yields (index, value) pairs; start=1 begins counting at 1.',
      },
      {
        concept: 'zip stops at shortest', diff: 'medium',
        s: 'names = ["a", "b", "c"]\nages = [20, 30]\nprint(list(zip(names, ages)))',
        q: 'What is printed?',
        opts: [
          "[('a', 20), ('b', 30)]",
          "[('a', 20), ('b', 30), ('c', None)]",
          "[('a', 20), ('b', 30), ('c', 30)]",
          'ValueError — lengths differ',
        ],
        correct: [0],
        exp: 'zip stops when the SHORTEST input is exhausted — "c" is silently dropped.',
      },
      {
        concept: 'any and all', diff: 'medium',
        s: 'checks = [True, True, False]\nflags = [0, "", None]\nprint(all(checks), any(flags))',
        q: 'What is printed?',
        opts: ['False False', 'False True', 'True False', 'True True'],
        correct: [0],
        exp: 'all() needs every item truthy (False present → False); any() needs at least one truthy (all falsy → False).',
      },
      {
        concept: 'Docstrings', diff: 'easy',
        s: 'A teammate reviews this function:\n\ndef area(r):\n    """Return the area of a circle with radius r."""\n    return 3.14159 * r * r',
        q: 'What is the purpose of the triple-quoted string?',
        opts: [
          'It is a docstring — documentation accessible via help() and __doc__',
          'It is a comment Python ignores completely',
          'It sets the return type of the function',
          'It is a multi-line string assigned to r',
        ],
        correct: [0],
        exp: 'A string literal as the first statement is the docstring — stored on the function object, not a runtime comment.',
      },
      {
        concept: 'Scope: nested read', diff: 'hard', multi: true,
        s: 'x = "outer"\n\ndef f():\n    print(x)\n\ndef g():\n    x = "inner"\n    print(x)\n\nf()\ng()\nprint(x)',
        q: 'Which TWO statements are true? Select TWO.',
        opts: [
          'f() prints "outer"',
          'g() prints "inner"',
          'After g() runs, the global x is "inner"',
          'f() raises NameError',
        ],
        correct: [0, 1],
        exp: 'g() creates its own local x — the global remains "outer" throughout.',
      },
    ],
  },
  {
    level: 4,
    slug: 'python-level4-final-assessment',
    title: 'Python Mastery — Level 4 Final: OOP, Errors & Internals',
    topic: 'Python Level 4 — OOP, Errors & Internals',
    difficulty: 'advanced',
    timeLimit: 2400,
    estimatedMinutes: 40,
    maxAttempts: 2,
    description:
      'Level 4 final: 30 questions on object-oriented Python and internals — dunder methods, class vs instance attributes, inheritance and super(), iterators, context managers, the exception hierarchy and imports. 40 minutes, 60% to pass, −25% per wrong answer, max 2 attempts. Unlocks after the Level 3 final.',
    questions: [
      {
        concept: '__init__ runs on creation', diff: 'easy',
        s: 'class Robot:\n    def __init__(self, name):\n        self.name = name\n        print("booting", name)\n\nr = Robot("Wall-E")',
        q: 'What happens when Robot("Wall-E") runs?',
        opts: [
          '__init__ executes immediately and prints "booting Wall-E"',
          'Nothing until r.name is accessed',
          'SyntaxError — self must be named this',
          'A class attribute name is created on Robot',
        ],
        correct: [0],
        exp: '__init__ is invoked automatically by the constructor call — it initializes the new instance.',
      },
      {
        concept: 'What self means', diff: 'easy',
        s: 'class Counter:\n    def __init__(self):\n        self.n = 0\n    def bump(self):\n        self.n += 1\n\nc = Counter()\nc.bump()\nprint(c.n)',
        q: 'What role does self play in bump?',
        opts: [
          'It is the instance the method was called on — c.n becomes 1',
          'It is a keyword that returns the class',
          'It is the module the class lives in',
          'It is optional and unused here',
        ],
        correct: [0],
        exp: 'Python passes the instance as the first argument automatically — c.bump() means bump(c).',
      },
      {
        concept: 'Class vs instance attribute', diff: 'medium',
        s: 'class Tag:\n    label = "default"\n\na = Tag()\nb = Tag()\na.label = "custom"\nprint(a.label, b.label, Tag.label)',
        q: 'What is printed?',
        opts: [
          'custom default default',
          'custom custom custom',
          'custom default custom',
          'default default default',
        ],
        correct: [0],
        exp: 'Assigning a.label creates an INSTANCE attribute shadowing the class one — b and the class still see "default".',
      },
      {
        concept: 'Shared mutable class attribute', diff: 'hard',
        s: 'class Cart:\n    items = []\n\nc1 = Cart()\nc2 = Cart()\nc1.items.append("book")\nprint(c2.items)',
        q: 'What is printed?',
        opts: [
          '["book"] — items is shared class state',
          '[] — each cart has its own list',
          'AttributeError',
          '["book", "book"]',
        ],
        correct: [0],
        exp: 'items lives on the CLASS, not each instance — both carts see the same list. Instance lists belong in __init__.',
      },
      {
        concept: '__str__ vs __repr__', diff: 'medium',
        s: 'class Point:\n    def __init__(self, x):\n        self.x = x\n    def __str__(self):\n        return f"P({self.x})"\n\nprint(Point(5))',
        q: 'What is printed?',
        opts: ['P(5)', '<Point object at 0x...>', '5', 'TypeError'],
        correct: [0],
        exp: 'print() calls str() which uses __str__ if defined — friendly representation wins.',
      },
      {
        concept: '__len__ protocol', diff: 'medium',
        s: 'class Bag:\n    def __init__(self, items):\n        self.items = items\n    def __len__(self):\n        return len(self.items)\n\nprint(len(Bag(["a", "b", "c"])))',
        q: 'What is printed?',
        opts: ['3', 'Bag object', 'TypeError — len needs a list', '0'],
        correct: [0],
        exp: 'len(obj) calls obj.__len__() — implementing it makes your object work with builtin len.',
      },
      {
        concept: '__eq__ custom equality', diff: 'hard',
        s: 'class Coin:\n    def __init__(self, cents):\n        self.cents = cents\n    def __eq__(self, other):\n        return self.cents == other.cents\n\nprint(Coin(50) == Coin(50), Coin(50) is Coin(50))',
        q: 'What is printed?',
        opts: ['True False', 'True True', 'False False', 'TypeError'],
        correct: [0],
        exp: '__eq__ makes == compare by cents; is still compares identity — two distinct objects.',
      },
      {
        concept: 'Method override', diff: 'easy',
        s: 'class Animal:\n    def speak(self):\n        return "..."\n\nclass Dog(Animal):\n    def speak(self):\n        return "woof"\n\nprint(Dog().speak())',
        q: 'What is printed?',
        opts: ['"woof"', '"..."', 'TypeError', 'woof then ...'],
        correct: [0],
        exp: 'The subclass method overrides the parent — Python finds speak on Dog first.',
      },
      {
        concept: 'super() call', diff: 'medium',
        s: 'class Person:\n    def __init__(self, name):\n        self.name = name\n\nclass Student(Person):\n    def __init__(self, name, year):\n        super().__init__(name)\n        self.year = year\n\ns = Student("Ana", 2)\nprint(s.name, s.year)',
        q: 'What is printed?',
        opts: ['Ana 2', 'TypeError — super needs arguments', 'name 2', 'Ana None'],
        correct: [0],
        exp: 'super() delegates to the parent __init__, which sets name; the subclass adds year.',
      },
      {
        concept: 'isinstance vs type', diff: 'medium',
        s: 'class Animal: pass\nclass Dog(Animal): pass\n\nd = Dog()\nprint(isinstance(d, Animal), type(d) is Animal)',
        q: 'What is printed?',
        opts: ['True False', 'True True', 'False True', 'False False'],
        correct: [0],
        exp: 'isinstance respects the inheritance chain (a Dog IS an Animal); type() is exact-match only.',
      },
      {
        concept: 'Method resolution order', diff: 'hard',
        s: 'class A:\n    def who(self):\n        return "A"\n\nclass B(A):\n    def who(self):\n        return "B"\n\nclass C(A):\n    pass\n\nclass D(B, C):\n    pass\n\nprint(D().who())',
        q: 'What is printed?',
        opts: ['"B"', '"A"', '"C"', 'TypeError — ambiguous inheritance'],
        correct: [0],
        exp: 'MRO for D(B, C) is D → B → C → A: B\'s who is found first.',
      },
      {
        concept: 'Name mangling', diff: 'hard',
        s: 'class Vault:\n    def __init__(self):\n        self.__code = 42\n\nv = Vault()\nprint(v.__code)',
        q: 'What happens?',
        opts: [
          'AttributeError — __code was renamed to _Vault__code',
          'Prints 42 — double underscore is truly private',
          'SyntaxError',
          'Prints None',
        ],
        correct: [0],
        exp: 'Python "mangles" __code to _Vault__code — a convention against accidental access, not true privacy.',
      },
      {
        concept: '@property', diff: 'medium',
        s: 'class Circle:\n    def __init__(self, r):\n        self.r = r\n    @property\n    def area(self):\n        return 3.14 * self.r ** 2\n\nc = Circle(2)\nprint(round(c.area))',
        q: 'Why does c.area work without parentheses?',
        opts: [
          '@property exposes the method as an attribute → 12.56 ≈ 13',
          'Python auto-calls every method on access',
          'area is a class variable',
          'It does not work — TypeError',
        ],
        correct: [0],
        exp: 'property turns a method into attribute-like access — c.area runs the method and returns 12.56.',
      },
      {
        concept: 'Iterator protocol', diff: 'medium',
        s: 'it = iter([7, 8])\nprint(next(it), next(it))',
        q: 'What happens on a third next(it)?',
        opts: ['StopIteration is raised', 'Returns None', 'Restarts at 7', 'IndexError'],
        correct: [0],
        exp: 'Exhausted iterators raise StopIteration — the same signal for loops use internally.',
      },
      {
        concept: 'What for really does', diff: 'hard',
        s: 'A junior asks: "how does for x in [1,2,3] actually work?"',
        q: 'Which description is correct?',
        opts: [
          'Python calls iter() on the list to get an iterator, then next() repeatedly until StopIteration',
          'Python indexes the list with a hidden counter from 0 to len-1',
          'Python converts the list to a generator first',
          'It depends on whether the list is sorted',
        ],
        correct: [0],
        exp: 'The iterator protocol — iter() + next() + StopIteration — is the mechanism behind every for loop.',
      },
      {
        concept: 'with statement', diff: 'easy',
        s: 'with open("data.txt") as f:\n    text = f.read()',
        q: 'What does with guarantee here?',
        opts: [
          'f.close() runs automatically even if an exception occurs inside the block',
          'The file is read faster',
          'The file is deleted after reading',
          'Nothing — it is just style',
        ],
        correct: [0],
        exp: 'Context managers run cleanup (__exit__) on exit — including exception paths.',
      },
      {
        concept: 'Specific before general except', diff: 'medium',
        s: 'try:\n    x = 1 / 0\nexcept ZeroDivisionError:\n    print("div")\nexcept Exception:\n    print("gen")',
        q: 'What is printed?',
        opts: ['"div"', '"gen"', 'Both', 'SyntaxError'],
        correct: [0],
        exp: 'Python checks except clauses in order; ZeroDivisionError matches first.',
      },
      {
        concept: 'Except order bug', diff: 'hard',
        s: 'try:\n    x = 1 / 0\nexcept Exception:\n    print("gen")\nexcept ZeroDivisionError:\n    print("div")',
        q: 'What is printed?',
        opts: [
          '"gen" — the broad handler runs first and catches everything',
          '"div"',
          'SyntaxError — wrong order',
          'Both lines',
        ],
        correct: [0],
        exp: 'Exception is a superclass of ZeroDivisionError and appears first, so "div" is unreachable.',
      },
      {
        concept: 'else in try/except', diff: 'medium',
        s: 'try:\n    n = int("42")\nexcept ValueError:\n    print("bad")\nelse:\n    print("ok", n)',
        q: 'What is printed?',
        opts: ['ok 42', 'bad', 'ok 42 then bad', 'Nothing'],
        correct: [0],
        exp: 'The else block runs only when NO exception was raised — int("42") succeeds.',
      },
      {
        concept: 'Matching exception types', diff: 'medium',
        s: 'def parse(s):\n    return int(s)\n\nfor val in ["5", "x", "0"]:\n    try:\n        print(parse(val), end=" ")\n    except ValueError:\n        print("?", end=" ")',
        q: 'What is printed?',
        opts: ['5 ? 0', '5 x 0', 'ValueError on "x" crashes the loop', '5 0'],
        correct: [0],
        exp: 'int("x") raises ValueError which is caught — the loop continues and prints ?.',
      },
      {
        concept: 'Choosing the right exception type', diff: 'easy',
        s: 'data = {"a": 1}\nprint(data["b"])',
        q: 'Which exception does this raise?',
        opts: ['KeyError', 'IndexError', 'ValueError', 'AttributeError'],
        correct: [0],
        exp: 'Missing dict key → KeyError. IndexError is for sequences, ValueError for bad values.',
      },
      {
        concept: 'AttributeError', diff: 'easy',
        s: 'nums = [1, 2, 3]\nnums.push(4)',
        q: 'Which exception is raised?',
        opts: [
          'AttributeError — lists have no push method',
          'TypeError',
          'NameError',
          'It works — push is an alias of append',
        ],
        correct: [0],
        exp: 'Accessing a non-existent attribute/method raises AttributeError. The list method is append.',
      },
      {
        concept: 'Raising exceptions', diff: 'medium',
        s: 'def set_age(age):\n    if age < 0:\n        raise ValueError("age cannot be negative")\n    return age',
        q: 'Why is raise better than returning -1 for an invalid age?',
        opts: [
          'It forces the caller to deal with the error instead of silently propagating a bogus value',
          'It runs faster',
          'It prints a nicer message',
          'raise is required for negative numbers',
        ],
        correct: [0],
        exp: 'Sentinel return values get silently used downstream; an exception cannot be accidentally ignored.',
      },
      {
        concept: 'Custom exception', diff: 'medium',
        s: 'class InsufficientFunds(Exception):\n    pass\n\ndef withdraw(amount):\n    raise InsufficientFunds("low balance")\n\ntry:\n    withdraw(100)\nexcept InsufficientFunds as e:\n    print("caught:", e)',
        q: 'What is printed?',
        opts: [
          'caught: low balance',
          'TypeError — custom exceptions need more code',
          'Nothing — raise exits the program',
          'SyntaxError',
        ],
        correct: [0],
        exp: 'Subclassing Exception creates a domain-specific error type; as e binds the message.',
      },
      {
        concept: 'except with a tuple', diff: 'medium',
        s: 'try:\n    int("abc") + [1][5]\nexcept (ValueError, IndexError) as e:\n    print("handled:", type(e).__name__)',
        q: 'What is printed?',
        opts: [
          'handled: ValueError',
          'handled: IndexError',
          'Both errors are reported',
          'TypeError',
        ],
        correct: [0],
        exp: 'int("abc") fails first with ValueError — the tuple form catches either type.',
      },
      {
        concept: 'Import styles', diff: 'easy',
        s: 'import math\nprint(math.floor(3.7))\n\nfrom math import ceil\nprint(ceil(3.2))',
        q: 'What is printed?',
        opts: ['3 then 4', '4 then 3', '3 then 3', 'ImportError'],
        correct: [0],
        exp: 'floor rounds down to 3, ceil rounds up to 4 — both import styles are valid.',
      },
      {
        concept: '__name__ == "__main__"', diff: 'medium',
        s: 'A file tool.py has at the bottom:\n\nif __name__ == "__main__":\n    main()',
        q: 'What does this guard prevent?',
        opts: [
          'main() running when the file is IMPORTED by another module — it only runs when executed directly',
          'Other files from reading the code',
          'main() running twice',
          'The file being imported at all',
        ],
        correct: [0],
        exp: 'On import, __name__ is the module name, not "__main__" — the block stays dormant.',
      },
      {
        concept: 'Circular import symptom', diff: 'hard',
        s: 'a.py imports b.py at the top; b.py imports a.py at the top. Running a.py gives "partially initialized module" or an AttributeError on a name that clearly exists.',
        q: 'What is the cleanest fix?',
        opts: [
          'Restructure so the shared names live in a third module both import, or move one import inside the function that needs it',
          'Wrap every import in try/except',
          'Rename one of the files',
          'Import both modules twice',
        ],
        correct: [0],
        exp: 'Circular imports mean one module is seen half-executed; extracting shared code or deferring the import breaks the cycle.',
      },
      {
        concept: 'Introspection helpers', diff: 'medium', multi: true,
        s: 'obj = "hello"',
        q: 'Which TWO lines check safely whether obj has a method named upper and then call it? Select TWO.',
        opts: [
          'hasattr(obj, "upper") then obj.upper()',
          'getattr(obj, "upper", None) is not None then obj.upper()',
          'obj.upper exists() then call it',
          'type(obj.upper) == "method" is required first',
        ],
        correct: [0, 1],
        exp: 'hasattr/getattr-with-default are the two standard safe-introspection patterns.',
      },
      {
        concept: 'json round-trip', diff: 'medium',
        s: 'import json\ns = json.dumps({"n": [1, 2]})\nback = json.loads(s)\nprint(back["n"][1])',
        q: 'What is printed?',
        opts: ['2', '[1, 2]', '"n"', 'TypeError — loads returns a string'],
        correct: [0],
        exp: 'dumps serialises to a JSON string; loads reconstructs the dict — back["n"][1] is 2.',
      },
    ],
  },
  {
    level: 5,
    slug: 'python-level5-final-assessment',
    title: 'Python Mastery — Level 5 Final: Real-World Judgment',
    topic: 'Python Level 5 — Real-World Python',
    difficulty: 'advanced',
    timeLimit: 2400,
    estimatedMinutes: 40,
    maxAttempts: 2,
    description:
      'Level 5 final: 30 questions on real-world Python judgment — spotting bugs, choosing the right structure, edge cases, performance intuition and capstone code traces. 40 minutes, 60% to pass, −25% per wrong answer, max 2 attempts. Unlocks after the Level 4 final.',
    questions: [
      {
        concept: 'Off-by-one', diff: 'medium',
        s: 'def sum_first_n(nums, n):\n    total = 0\n    for i in range(1, n + 1):\n        total += nums[i]\n    return total',
        q: 'What is wrong with this function?',
        opts: [
          'It skips index 0 and goes out of bounds when n == len(nums) — should use range(n) or slicing',
          'total should be a list',
          'range cannot take variables',
          'Nothing — it is correct',
        ],
        correct: [0],
        exp: 'range(1, n+1) starts at 1 (missing nums[0]) and ends at n (one past the last index for a full list).',
      },
      {
        concept: 'Missing increment', diff: 'easy',
        s: 'i = 0\nwhile i < 5:\n    print(i)',
        q: 'What does this loop do?',
        opts: [
          'Prints 0 forever — i never changes',
          'Prints 0 1 2 3 4',
          'Prints 0 then exits',
          'SyntaxError',
        ],
        correct: [0],
        exp: 'The condition never becomes False — an infinite loop, the classic forgotten i += 1.',
      },
      {
        concept: '= vs == bug', diff: 'easy',
        s: 'level = 3\nif level = 5:\n    print("max")',
        q: 'What happens?',
        opts: [
          'SyntaxError — assignment is not an expression here',
          'Prints max',
          'Prints nothing',
          'level becomes 5 and prints max',
        ],
        correct: [0],
        exp: 'Python refuses assignment inside if conditions (unlike C/JS) — the walrus := exists for intentional cases.',
      },
      {
        concept: 'Mutating while iterating', diff: 'hard',
        s: 'nums = [1, 2, 3, 4, 5]\nfor x in nums:\n    if x % 2 == 0:\n        nums.remove(x)\nprint(nums)',
        q: 'What is printed, and why is it surprising?',
        opts: [
          '[1, 3, 4, 5] — removing 2 shifts 4 left so the loop skips it',
          '[1, 3, 5] — all evens removed as intended',
          '[1, 2, 3, 4, 5] — remove is deferred',
          'RuntimeError always',
        ],
        correct: [0],
        exp: 'Removing during iteration shifts later elements left; the index advances anyway and 4 gets skipped. Iterate over a copy or build a new list.',
      },
      {
        concept: 'Shallow copy of nested lists', diff: 'hard',
        s: 'a = [[1, 2], [3, 4]]\nb = a[:]\nb[0].append(9)\nprint(a)',
        q: 'What is printed?',
        opts: [
          '[[1, 2, 9], [3, 4]] — the slice copies the outer list but inner lists are still shared',
          '[[1, 2], [3, 4]] — the slice made a full copy',
          'TypeError',
          '[[9], [3, 4]]',
        ],
        correct: [0],
        exp: 'a[:] is a SHALLOW copy — new outer list, same inner list objects. Nested structures need copy.deepcopy.',
      },
      {
        concept: 'Float equality', diff: 'medium',
        s: 'total = 0.1 + 0.2\nprint(total == 0.3)',
        q: 'What is printed, and what is the right fix?',
        opts: [
          'False — floats are binary-approximate; compare with math.isclose() or a tolerance',
          'True — Python handles decimals exactly',
          'False — fix by using // division',
          'True — but only in Python 3.12+',
        ],
        correct: [0],
        exp: '0.1+0.2 is 0.30000000000000004 in binary floating point. Never compare floats with == — use isclose.',
      },
      {
        concept: 'Division operators', diff: 'easy',
        s: 'print(7 / 2, 7 // 2, 7 % 2)',
        q: 'What is printed?',
        opts: ['3.5 3 1', '3.5 3.5 1', '3 3 1', '3.5 4 1'],
        correct: [0],
        exp: '/ true division → 3.5; // floor division → 3; % remainder → 1.',
      },
      {
        concept: 'input() type bug', diff: 'easy',
        s: 'age = input("Age: ")  # user types 20\nnext_year = age + 1',
        q: 'What happens?',
        opts: [
          'TypeError — input() returns str, so + 1 fails; needs int(age)',
          'next_year is 21',
          'next_year is "201"',
          'ValueError',
        ],
        correct: [0],
        exp: 'input() always yields a string. "20" + 1 is str+int → TypeError (Python will not concatenate implicitly).',
      },
      {
        concept: 'Choosing the right structure', diff: 'medium',
        s: 'A teacher must look up students by roll number (1,00,000 records, thousands of lookups per second). Currently rolls are in a list and checked with `roll in rolls`.',
        q: 'Which change gives the biggest speed-up?',
        opts: [
          'Store rolls in a set — membership tests become O(1) instead of scanning the list',
          'Sort the list first, then use `in`',
          'Convert to a tuple — tuples are faster',
          'Use two loops to check halves in parallel',
        ],
        correct: [0],
        exp: '`in` on a list is O(n) per lookup; a hash set is ~O(1). Sorting alone does not change `in`\'s linear scan.',
      },
      {
        concept: 'Tuple as record', diff: 'medium',
        s: 'A function needs to return a fixed (row, col) position that callers should not modify.',
        q: 'Which return type best expresses that intent?',
        opts: [
          'A tuple — immutable and positional',
          'A list — flexible',
          'A string "row,col" — compact',
          'A set — unique',
        ],
        correct: [0],
        exp: 'Tuples signal "fixed record": ordered, immutable, unpackable — the idiomatic choice.',
      },
      {
        concept: 'Sorting dict by value', diff: 'medium',
        s: 'scores = {"mia": 88, "leo": 95, "zoe": 91}',
        q: 'Which line gives names sorted by score, highest first?',
        opts: [
          'sorted(scores, key=scores.get, reverse=True)',
          'sorted(scores.values(), reverse=True)',
          'sorted(scores, reverse=True)',
          'scores.sort(reverse=True)',
        ],
        correct: [0],
        exp: 'sorted over a dict yields keys; key=scores.get orders them by their values. Option 4 — dicts have no .sort().',
      },
      {
        concept: 'String building in loops', diff: 'medium',
        s: 'parts = []\nfor w in words:           # 50,000 words\n    parts.append(w + ",")\nout = "".join(parts)',
        q: 'Why is join preferred over out += w in the loop?',
        opts: [
          'Each += rebuilds the whole string (O(n²) total); join allocates once (O(n))',
          'join adds commas automatically',
          '+= is deprecated',
          'join is the only option that works on lists',
        ],
        correct: [0],
        exp: 'Strings are immutable — repeated concatenation copies everything each time. Accumulate parts, join once.',
      },
      {
        concept: 'f-string formatting', diff: 'easy',
        s: 'pi = 3.14159\nprint(f"{pi:.2f}")',
        q: 'What is printed?',
        opts: ['3.14', '3.14159', '3.1', 'SyntaxError'],
        correct: [0],
        exp: ':.2f formats to two decimal places.',
      },
      {
        concept: 'Short-circuit guard', diff: 'medium',
        s: 'def first_char(s):\n    if s and s[0] == "a":\n        return True\n    return False\n\nprint(first_char(""), first_char("apple"))',
        q: 'Why does s and ... matter here?',
        opts: [
          'It guards s[0] — an empty string is falsy, so indexing is skipped before it can crash',
          'It converts s to bool permanently',
          'It is redundant — s[0] on "" returns ""',
          'It makes the function faster only',
        ],
        correct: [0],
        exp: 'and short-circuits: when s is falsy, s[0] is never evaluated — avoiding IndexError.',
      },
      {
        concept: 'or-default idiom', diff: 'medium',
        s: 'name = ""\ndisplay = name or "Guest"\nprint(display)',
        q: 'What is printed, and why?',
        opts: [
          '"Guest" — or returns the first truthy operand',
          '"" — name was already assigned',
          'True — or returns a boolean',
          'SyntaxError',
        ],
        correct: [0],
        exp: 'Python\'s or returns an OPERAND, not a boolean — "" is falsy so it yields "Guest".',
      },
      {
        concept: 'Chained comparison', diff: 'easy',
        s: 'x = 7\nprint(0 <= x < 10)',
        q: 'What is printed?',
        opts: ['True', 'SyntaxError', 'False', '1'],
        correct: [0],
        exp: 'Python chains comparisons mathematically — equivalent to (0 <= x) and (x < 10).',
      },
      {
        concept: 'is None idiom', diff: 'easy',
        s: 'def find(key):\n    if key is None:\n        return "missing"\n    return "found"',
        q: 'Why is `is None` preferred over `== None` here?',
        opts: [
          'None is a singleton — identity is the correct, un-overridable test; __eq__ could be customised to lie',
          'is runs faster only',
          '== None raises TypeError',
          'No difference — both are identical',
        ],
        correct: [0],
        exp: 'A class can define __eq__ to claim equality with None; `is` checks the one true None object.',
      },
      {
        concept: 'Bare except', diff: 'medium',
        s: 'try:\n    risky()\nexcept:\n    pass',
        q: 'Why is a bare except dangerous?',
        opts: [
          'It swallows EVERYTHING — including KeyboardInterrupt and bugs you never anticipated, hiding failures silently',
          'It is slower than except Exception',
          'It is a SyntaxError in Python 3',
          'It only catches ValueError',
        ],
        correct: [0],
        exp: 'Bare except catches BaseException — even system exits and Ctrl-C — and pass erases all evidence. Catch the narrowest type you expect.',
      },
      {
        concept: 'Narrow try blocks', diff: 'medium',
        s: 'def load(raw):\n    try:\n        n = int(raw)\n        result = 100 / n\n    except ValueError:\n        result = None\n    return result',
        q: 'What is the subtle bug?',
        opts: [
          'A ZeroDivisionError from 100/0 (when raw is "0") escapes — the except only names ValueError; keep risky ops inside but catch the right types',
          'int() never raises ValueError',
          'result is undefined on the error path',
          'try blocks can only hold one statement',
        ],
        correct: [0],
        exp: 'Two different failures hide in one try: int() → ValueError and division → ZeroDivisionError. Either catch both or move the division out/into its own guard.',
      },
      {
        concept: 'Edge-case thinking', diff: 'medium', multi: true,
        s: 'def average(nums):\n    return sum(nums) / len(nums)',
        q: 'Which TWO inputs break or misbehave? Select TWO.',
        opts: [
          'average([]) — division by zero',
          'average(["3"]) — sum fails on strings',
          'average([0]) — returns 0, fine',
          'average([5, 10]) — returns 7.5, fine',
        ],
        correct: [0, 1],
        exp: 'Empty list → ZeroDivisionError; string element → TypeError inside sum. Both need guarding.',
      },
      {
        concept: 'round() banker\'s rounding', diff: 'hard',
        s: 'print(round(2.5), round(3.5))',
        q: 'What is printed?',
        opts: ['2 4', '3 4', '2 3', '3 3'],
        correct: [0],
        exp: 'Python rounds half to EVEN (banker\'s rounding): 2.5→2, 3.5→4 — a famous surprise.',
      },
      {
        concept: 'Truthiness of strings', diff: 'medium',
        s: 'raw = "False"\nif raw:\n    print("truthy")',
        q: 'What is printed and why?',
        opts: [
          'truthy — every non-empty string is truthy regardless of content',
          'Nothing — "False" is falsy',
          'TypeError',
          'False',
        ],
        correct: [0],
        exp: 'Only the EMPTY string is falsy. "False", "0", " " are all non-empty → truthy.',
      },
      {
        concept: 'int() on bad input', diff: 'easy',
        s: 'qty = "12.5"\ntotal = int(qty)',
        q: 'What happens?',
        opts: [
          'ValueError — int() does not parse decimal strings; use float() first or int(float(qty))',
          'total is 12',
          'total is 12.5',
          'SyntaxError',
        ],
        correct: [0],
        exp: 'int() only accepts integer-formatted strings; "12.5" needs float() or a two-step conversion.',
      },
      {
        concept: 'Deep capstone trace', diff: 'hard',
        s: 'def tally(rows):\n    out = {}\n    for name, pts in rows:\n        out[name] = out.get(name, 0) + pts\n    top = sorted(out.items(), key=lambda kv: kv[1], reverse=True)\n    return top[0][0]\n\nrows = [("a", 3), ("b", 5), ("a", 2), ("b", 1), ("c", 6)]\nprint(tally(rows))',
        q: 'What is printed?',
        opts: ['"c"', '"b"', '"a"', 'KeyError'],
        correct: [1],
        exp: 'Totals: a=5, b=6, c=6. sorted() is stable — equal values keep input order, and b was inserted before c — so the order is [b, c, a] and top[0][0] returns "b".',
      },
      {
        concept: 'Testing mindset', diff: 'medium',
        s: 'def grade(score):\n    if score >= 90: return "A"\n    if score >= 80: return "B"\n    if score >= 70: return "C"\n    return "F"',
        q: 'A teammate says testing only grade(95) is enough. Which input best exposes boundary bugs?',
        opts: [
          'grade(90) and grade(89) — the exact pass/fail boundary',
          'grade(100) — the maximum',
          'grade(50) — the middle',
          'grade("A") — wrong type only',
        ],
        correct: [0],
        exp: 'Bugs live at boundaries: 90 must return A and 89 must return B — one wrong >= flips both.',
      },
      {
        concept: 'Assert vs exception', diff: 'medium',
        s: 'def process(data):\n    assert data is not None',
        q: 'Why is assert the wrong tool for validating USER input?',
        opts: [
          'Asserts can be globally disabled with python -O — validation silently vanishes in production',
          'assert is slower than raise',
          'assert only works on numbers',
          'It is the correct tool — no issue',
        ],
        correct: [0],
        exp: 'python -O strips assert statements entirely. User-facing validation must use raise/if, not assert.',
      },
      {
        concept: 'Safe indexing pattern', diff: 'medium', multi: true,
        s: 'You need the third element of a list that may be shorter.',
        q: 'Which TWO approaches are safe? Select TWO.',
        opts: [
          'if len(lst) >= 3: use lst[2]',
          'try: lst[2] / except IndexError',
          'lst[2] or None',
          'lst.get(2)',
        ],
        correct: [0, 1],
        exp: 'Index guard (LBYL) or try/except IndexError (EAFP) are the two idiomatic ways. lst[2] still raises before `or` helps, and lists have no .get().',
      },
      {
        concept: 'Walrus operator', diff: 'hard',
        s: 'data = input()\nif (n := len(data)) > 4:\n    print(n)',
        q: 'What does := do here?',
        opts: [
          'Assigns len(data) to n AND yields the value for the comparison in one step',
          'Compares n to len(data)',
          'Declares n as a global',
          'SyntaxError in Python 3',
        ],
        correct: [0],
        exp: 'The walrus operator assigns inside an expression — compute once, use twice.',
      },
      {
        concept: 'Dict merge with ** unpacking', diff: 'medium',
        s: 'base = {"a": 1, "b": 2}\nover = {"b": 9, "c": 3}\nmerged = {**base, **over}\nprint(merged)',
        q: 'What is merged?',
        opts: [
          "{'a': 1, 'b': 9, 'c': 3}",
          "{'a': 1, 'b': 2, 'c': 3}",
          "{'a': 1, 'b': 2, 'b': 9, 'c': 3}",
          'TypeError — ** cannot unpack dicts',
        ],
        correct: [0],
        exp: 'Later dicts win on key collisions during ** unpacking — the clean merge/override idiom.',
      },
      {
        concept: 'End-to-end reasoning', diff: 'hard',
        s: 'def dedupe(seq):\n    seen = set()\n    out = []\n    for x in seq:\n        if x not in seen:\n            seen.add(x)\n            out.append(x)\n    return out\n\nprint(dedupe([3, 1, 3, 2, 1]))',
        q: 'What is printed?',
        opts: [
          '[3, 1, 2] — first-occurrence order preserved',
          '{1, 2, 3} — a set',
          '[1, 2, 3] — sorted',
          '[3, 1, 3, 2, 1] — unchanged',
        ],
        correct: [0],
        exp: 'The set tracks membership for O(1) lookups while the list preserves first-seen order — the standard dedupe idiom.',
      },
    ],
  },
];

async function build() {
  await connectDB();

  const author = await User.findOne({ platformRole: 'superadmin' }) || await User.findOne();
  if (!author) throw new Error('No users found in database to set as author');

  const path = await LearningPath.findOne({ slug: PATH_SLUG });
  if (!path) throw new Error(`LearningPath "${PATH_SLUG}" not found — run seed/python-mastery-path.js first`);

  const selected = ONLY_LEVEL ? LEVELS.filter((l) => l.level === ONLY_LEVEL) : LEVELS;
  if (!selected.length) {
    throw new Error(`--level=${ONLY_LEVEL} does not match any defined level (2–5)`);
  }

  for (const lvl of selected) {
    console.log(`\n=== Level ${lvl.level}: ${lvl.title} ===`);

    if (lvl.questions.length !== 30) {
      throw new Error(`Level ${lvl.level} has ${lvl.questions.length} questions — expected 30`);
    }

    // ---- Idempotent cleanup: only this level's own quiz + questions ----
    const staleQuiz = await Quiz.findOne({ slug: lvl.slug });
    if (staleQuiz) {
      await staleQuiz.deleteOne();
      console.log(`  Cleanup: removed previous Level ${lvl.level} quiz`);
    }
    const staleQuestions = await Question.deleteMany({ topic: lvl.topic });
    if (staleQuestions.deletedCount) {
      console.log(`  Cleanup: removed ${staleQuestions.deletedCount} previous Level ${lvl.level} questions`);
    }

    // ---- Questions ----
    const docs = [];
    for (const [i, q] of lvl.questions.entries()) {
      docs.push(await Question.create({
        questionType: q.multi ? 'multiple-select' : 'single-choice',
        difficulty: q.diff,
        cognitiveLevel: q.diff === 'easy' ? 'apply' : 'analyze',
        topic: lvl.topic,
        subtopic: q.concept,
        track: 'technical',
        estimatedTime: 75,
        status: PUBLISH ? 'published' : 'draft',
        publishedAt: PUBLISH ? new Date() : undefined,
        tags: ['Python', 'Scenario', `Level ${lvl.level}`, q.concept],
        versions: [{
          version: 1,
          questionText: q.q,
          scenario: q.s,
          options: q.opts.map((text, j) => ({
            key: String.fromCharCode(65 + j),
            text,
            isCorrect: q.correct.includes(j),
          })),
          explanation: q.exp,
          author: author._id,
          createdAt: new Date(),
        }],
        currentVersion: 1,
      }));
      console.log(`  Q${i + 1}/${lvl.questions.length} ${q.multi ? '[select two] ' : ''}${q.concept}`);
    }

    // ---- Final assessment quiz (level N, mission: null) ----
    const quiz = await Quiz.create({
      title: lvl.title,
      slug: lvl.slug,
      description: lvl.description,
      type: 'assessment',
      status: PUBLISH ? 'published' : 'draft',
      isPublished: PUBLISH,
      level: lvl.level,
      difficulty: lvl.difficulty,
      estimatedMinutes: lvl.estimatedMinutes,
      author: author._id,
      mission: null, // no mission = path final assessment, not a checkpoint
      learningPath: path._id,
      rules: {
        mode: 'assessment',
        timeLimit: lvl.timeLimit,
        maxAttempts: lvl.maxAttempts,
        shuffleQuestions: true,
        shuffleOptions: true,
        showExplanations: true,
        showResults: 'manual',
        passingScore: 60,
        negativeMarking: 0.25,
        allowRetry: true,
      },
      questions: docs.map((d, j) => ({ question: d._id, points: 10, order: j })),
      totalQuestions: docs.length,
      totalPoints: docs.length * 10,
    });
    console.log(`  Created "${quiz.title}" — ${quiz.totalQuestions} questions, level ${quiz.level}`);
  }

  // ---- Keep the path's own metadata honest about all five finals ----
  await LearningPath.findByIdAndUpdate(path._id, {
    description:
      'A complete beginner-to-programmer journey in Python — syntax, decisions, loops, collections, functions, files and OOP. Finish all ten lessons, then prove it across five tiered final assessments: foundations at Level 1, data structures at Level 2, functions and design at Level 3, OOP and internals at Level 4, and real-world debugging judgment at Level 5.',
  });

  // ---- Verify wiring ----
  const finals = await Quiz.find({ learningPath: path._id, mission: null })
    .select('title level totalQuestions type status isPublished')
    .sort({ level: 1 })
    .lean();
  console.log('\nPath finals now:');
  for (const f of finals) {
    console.log(`  L${f.level ?? 1} ${f.title} — ${f.totalQuestions}q, ${f.type}, ${f.status}/${f.isPublished ? 'published' : 'unpublished'}`);
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

build().catch(async (err) => {
  console.error('FAILED:', err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
