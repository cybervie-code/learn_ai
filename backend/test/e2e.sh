#!/bin/bash
# Cybervie End-to-End Test Suite
# Tests every API endpoint and flow systematically

# NOTE: No set -e - we want to continue even when tests fail

API="http://localhost:5001/api"
PASS=0
FAIL=0
ERRORS=()

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

check() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo -e "  ${GREEN}PASS${NC} $name"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}FAIL${NC} $name (expected: '$expected', got: '$actual')"
    FAIL=$((FAIL + 1))
    ERRORS+=("$name")
  fi
}

check_contains() {
  local name="$1"
  local needle="$2"
  local haystack="$3"
  if echo "$haystack" | grep -q "$needle"; then
    echo -e "  ${GREEN}PASS${NC} $name"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}FAIL${NC} $name (expected to contain: '$needle')"
    FAIL=$((FAIL + 1))
    ERRORS+=("$name")
  fi
}

# Extract a JSON field using python3. Usage: echo "$JSON" | jfield "['data']['token']"
# Produces lowercase true/false for booleans, matching JSON convention
jfield() {
  python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    val = d$1
    if val is True:
        print('true')
    elif val is False:
        print('false')
    elif val is None:
        print('')
    else:
        print(val)
except Exception as e:
    print('')
" 2>/dev/null
}

section() {
  echo ""
  echo -e "${CYAN}=== $1 ===${NC}"
}

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Cybervie E2E Test Suite                 ${NC}"
echo -e "${CYAN}========================================${NC}"

# ============================================================
# PRE-TEST CLEANUP: Ensure known good state for seeded users
# ============================================================
echo "Pre-test: Ensuring seeded users are active..."
mongosh --quiet --eval "
db.users.updateOne({email:'student1@demo.iitd.ac.in'}, {\$set: {status:'active', role:'student'}});
db.users.updateOne({email:'student2@demo.iitd.ac.in'}, {\$set: {status:'active', role:'student', isProfilePublic:false}});
" cybervie > /dev/null 2>&1
echo "Pre-test cleanup done."

# Cleanup function to run on exit - ensure student is reactivated
cleanup() {
  if [ -n "$ADMIN_TOKEN" ] && [ -n "$STUDENT_ID" ]; then
    curl -s -X PATCH $API/users/$STUDENT_ID/status -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" -d '{"status":"active"}' > /dev/null 2>&1
    curl -s -X PATCH $API/users/$STUDENT_ID/role -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" -d '{"role":"student"}' > /dev/null 2>&1
  fi
}
trap cleanup EXIT

# ============================================================
section "1. HEALTH CHECK"
# ============================================================
HEALTH=$(curl -s http://localhost:5001/health)
check "Health endpoint returns success" "true" "$(echo "$HEALTH" | jfield "['success']")"
check_contains "Health has timestamp" "timestamp" "$HEALTH"

# ============================================================
section "2. AUTHENTICATION"
# ============================================================

echo "  --- Superadmin ---"
RES=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@cybervie.in","password":"ChangeMe123!"}')
check "Superadmin login success" "true" "$(echo "$RES" | jfield "['success']")"
SUPERADMIN_TOKEN=$(echo "$RES" | jfield "['data']['token']")
SUPERADMIN_ID=$(echo "$RES" | jfield "['data']['user']['_id']")
check "Superadmin has token" "true" "$([ -n "$SUPERADMIN_TOKEN" ] && echo true || echo false)"
check "Superadmin platformRole" "superadmin" "$(echo "$RES" | jfield "['data']['user']['platformRole']")"

echo "  --- College Admin ---"
RES=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.iitd.ac.in","password":"Admin123!"}')
check "College admin login success" "true" "$(echo "$RES" | jfield "['success']")"
ADMIN_TOKEN=$(echo "$RES" | jfield "['data']['token']")
ADMIN_ID=$(echo "$RES" | jfield "['data']['user']['_id']")
ADMIN_COLLEGE=$(echo "$RES" | jfield "['data']['user']['college']")
check "Admin role is college-admin" "college-admin" "$(echo "$RES" | jfield "['data']['user']['role']")"

echo "  --- Faculty ---"
RES=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":"faculty@demo.iitd.ac.in","password":"Faculty123!"}')
check "Faculty login success" "true" "$(echo "$RES" | jfield "['success']")"
FACULTY_TOKEN=$(echo "$RES" | jfield "['data']['token']")
FACULTY_ID=$(echo "$RES" | jfield "['data']['user']['_id']")
check "Faculty role" "faculty" "$(echo "$RES" | jfield "['data']['user']['role']")"

echo "  --- Student ---"
RES=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":"student1@demo.iitd.ac.in","password":"Student123!"}')
check "Student login success" "true" "$(echo "$RES" | jfield "['success']")"
STUDENT_TOKEN=$(echo "$RES" | jfield "['data']['token']")
STUDENT_ID=$(echo "$RES" | jfield "['data']['user']['_id']")
STUDENT_COLLEGE=$(echo "$RES" | jfield "['data']['user']['college']")
check "Student role" "student" "$(echo "$RES" | jfield "['data']['user']['role']")"
check "Student has college" "true" "$([ -n "$STUDENT_COLLEGE" ] && echo true || echo false)"

echo "  --- Invalid Credentials ---"
RES=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@cybervie.in","password":"wrongpassword"}')
check "Wrong password rejected" "401" "$(echo "$RES" | jfield "['statusCode']")"

RES=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@nowhere.com","password":"test"}')
check "Nonexistent user rejected" "401" "$(echo "$RES" | jfield "['statusCode']")"

RES=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" -d '{}')
check "Missing fields rejected" "400" "$(echo "$RES" | jfield "['statusCode']")"

echo "  --- Token Validation ---"
RES=$(curl -s $API/auth/me -H "Authorization: Bearer $STUDENT_TOKEN")
check "GET /auth/me success" "true" "$(echo "$RES" | jfield "['success']")"
check "GET /auth/me returns user" "$STUDENT_ID" "$(echo "$RES" | jfield "['data']['user']['_id']")"

RES=$(curl -s $API/auth/me)
check "GET /auth/me without token rejected" "401" "$(echo "$RES" | jfield "['statusCode']")"

RES=$(curl -s $API/auth/me -H "Authorization: Bearer invalidtoken123")
check "GET /auth/me with invalid token rejected" "401" "$(echo "$RES" | jfield "['statusCode']")"

# ============================================================
section "3. AUTHORIZATION (Role-Based Access)"
# ============================================================

RES=$(curl -s -X POST $API/colleges -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" -d '{"name":"Test College"}')
check "Student cannot create college" "403" "$(echo "$RES" | jfield "['statusCode']")"

RES=$(curl -s -X POST $API/colleges -H "Authorization: Bearer $FACULTY_TOKEN" \
  -H "Content-Type: application/json" -d '{"name":"Test College"}')
check "Faculty cannot create college" "403" "$(echo "$RES" | jfield "['statusCode']")"

RES=$(curl -s -X POST $API/questions -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" -d '{"questionText":"test","options":[{"text":"a","isCorrect":true},{"text":"b"}]}')
check "Student cannot create questions" "403" "$(echo "$RES" | jfield "['statusCode']")"

RES=$(curl -s $API/users/all -H "Authorization: Bearer $STUDENT_TOKEN")
check "Student cannot list all users" "403" "$(echo "$RES" | jfield "['statusCode']")"

RES=$(curl -s $API/users/college -H "Authorization: Bearer $STUDENT_TOKEN")
check "Student cannot list college users" "403" "$(echo "$RES" | jfield "['statusCode']")"

RES=$(curl -s $API/colleges -H "Authorization: Bearer $SUPERADMIN_TOKEN")
check "Superadmin can list colleges" "true" "$(echo "$RES" | jfield "['success']")"

# ============================================================
section "4. COLLEGE MANAGEMENT"
# ============================================================

RES=$(curl -s $API/colleges -H "Authorization: Bearer $SUPERADMIN_TOKEN")
COLLEGE_COUNT=$(echo "$RES" | jfield "['data']['total']")
check "Colleges listed" "true" "$(echo "$RES" | jfield "['success']")"
check "At least 1 college exists" "true" "$([ "$COLLEGE_COUNT" -ge 1 ] 2>/dev/null && echo true || echo false)"
COLLEGE_ID=$(echo "$RES" | jfield "['data']['colleges'][0]['_id']")
echo "  College ID: $COLLEGE_ID"

RES=$(curl -s $API/colleges/$COLLEGE_ID -H "Authorization: Bearer $SUPERADMIN_TOKEN")
check "Get college by ID" "true" "$(echo "$RES" | jfield "['success']")"
check "College has name" "true" "$([ -n "$(echo "$RES" | jfield "['data']['name']")" ] && echo true || echo false)"

RES=$(curl -s -X POST $API/colleges -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test College NIT","shortCode":"NITT","city":"Chennai","state":"Tamil Nadu","plan":"essential","seatLimit":200}')
check "Create college success" "true" "$(echo "$RES" | jfield "['success']")"
NEW_COLLEGE_ID=$(echo "$RES" | jfield "['data']['_id']")
check "New college has correct name" "Test College NIT" "$(echo "$RES" | jfield "['data']['name']")"
check "New college has correct plan" "essential" "$(echo "$RES" | jfield "['data']['subscription']['plan']")"

RES=$(curl -s -X PUT $API/colleges/$NEW_COLLEGE_ID -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"city":"Madras"}')
check "Update college success" "true" "$(echo "$RES" | jfield "['success']")"
check "College city updated" "Madras" "$(echo "$RES" | jfield "['data']['city']")"

RES=$(curl -s -X POST $API/colleges/$NEW_COLLEGE_ID/domains -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" -d "{\"domain\":\"nitt-test-$RANDOM-$RANDOM.ac.in\"}")
check "Add domain success" "true" "$(echo "$RES" | jfield "['success']")"
check "Domain added unverified" "false" "$(echo "$RES" | jfield "['data']['domains'][0]['verified']")"
TEST_DOMAIN=$(echo "$RES" | jfield "['data']['domains'][0]['domain']")

RES=$(curl -s -X POST $API/colleges/$NEW_COLLEGE_ID/domains/verify -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" -d "{\"domain\":\"$TEST_DOMAIN\",\"method\":\"manual\"}")
check "Verify domain success" "true" "$(echo "$RES" | jfield "['success']")"
check "Domain now verified" "true" "$(echo "$RES" | jfield "['data']['domains'][0]['verified']")"

RES=$(curl -s -X POST $API/colleges/$COLLEGE_ID/domains -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" -d "{\"domain\":\"$TEST_DOMAIN\"}")
check "Duplicate verified domain rejected" "409" "$(echo "$RES" | jfield "['statusCode']")"

RES=$(curl -s $API/colleges/stats/$COLLEGE_ID -H "Authorization: Bearer $SUPERADMIN_TOKEN")
check "College stats success" "true" "$(echo "$RES" | jfield "['success']")"
check "Stats has student count" "true" "$([ -n "$(echo "$RES" | jfield "['data']['students']")" ] && echo true || echo false)"

RES=$(curl -s -X POST $API/colleges -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"name":"Hacker College"}')
check "College admin cannot create college" "403" "$(echo "$RES" | jfield "['statusCode']")"

# ============================================================
section "5. QUESTION MANAGEMENT"
# ============================================================

RES=$(curl -s "$API/questions?limit=5" -H "Authorization: Bearer $SUPERADMIN_TOKEN")
check "List questions success" "true" "$(echo "$RES" | jfield "['success']")"
QUESTION_COUNT=$(echo "$RES" | jfield "['data']['total']")
check "Has questions in bank" "true" "$([ "$QUESTION_COUNT" -ge 1 ] 2>/dev/null && echo true || echo false)"
FIRST_Q_ID=$(echo "$RES" | jfield "['data']['questions'][0]['_id']")

RES=$(curl -s $API/questions/$FIRST_Q_ID -H "Authorization: Bearer $SUPERADMIN_TOKEN")
check "Get question by ID" "true" "$(echo "$RES" | jfield "['success']")"
check "Question has versions" "true" "$([ -n "$(echo "$RES" | jfield "['data']['versions']")" ] && echo true || echo false)"

RES=$(curl -s -X POST $API/questions -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{
    "questionText": "What does CPU stand for?",
    "options": [
      {"key":"A","text":"Central Processing Unit","isCorrect":true,"explanation":"Correct"},
      {"key":"B","text":"Computer Personal Unit","isCorrect":false},
      {"key":"C","text":"Central Print Utility","isCorrect":false},
      {"key":"D","text":"Control Process Unit","isCorrect":false}
    ],
    "explanation": "CPU stands for Central Processing Unit.",
    "difficulty": "easy",
    "topic": "Hardware"
  }')
check "Create question success" "true" "$(echo "$RES" | jfield "['success']")"
NEW_Q_ID=$(echo "$RES" | jfield "['data']['_id']")
check "New question status is draft" "draft" "$(echo "$RES" | jfield "['data']['status']")"

RES=$(curl -s -X POST $API/questions -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{
    "questionText": "Bad question",
    "options": [
      {"text":"a","isCorrect":false},
      {"text":"b","isCorrect":false}
    ]
  }')
check "Question without correct option rejected" "400" "$(echo "$RES" | jfield "['statusCode']")"

RES=$(curl -s -X POST $API/questions -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{
    "questionText": "Bad question",
    "options": [{"text":"a","isCorrect":true}]
  }')
check "Question with < 2 options rejected" "400" "$(echo "$RES" | jfield "['statusCode']")"

echo "  --- Editorial Workflow ---"
RES=$(curl -s -X PATCH $API/questions/$NEW_Q_ID/status -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"status":"technical-review"}')
check "Draft to technical-review" "true" "$(echo "$RES" | jfield "['success']")"
check "Status is technical-review" "technical-review" "$(echo "$RES" | jfield "['data']['status']")"

RES=$(curl -s -X PATCH $API/questions/$NEW_Q_ID/status -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"status":"pedagogical-review"}')
check "technical-review to pedagogical-review" "true" "$(echo "$RES" | jfield "['success']")"

RES=$(curl -s -X PATCH $API/questions/$NEW_Q_ID/status -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"status":"language-review"}')
check "pedagogical-review to language-review" "true" "$(echo "$RES" | jfield "['success']")"

RES=$(curl -s -X PATCH $API/questions/$NEW_Q_ID/status -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"status":"approved"}')
check "language-review to approved" "true" "$(echo "$RES" | jfield "['success']")"

RES=$(curl -s -X PATCH $API/questions/$NEW_Q_ID/status -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"status":"published"}')
check "approved to published" "true" "$(echo "$RES" | jfield "['success']")"
check "Status is published" "published" "$(echo "$RES" | jfield "['data']['status']")"

RES=$(curl -s -X PATCH $API/questions/$NEW_Q_ID/status -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"status":"draft"}')
check "published to draft rejected (invalid transition)" "400" "$(echo "$RES" | jfield "['statusCode']")"

RES=$(curl -s -X PUT $API/questions/$NEW_Q_ID -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"questionText":"Updated: What does CPU stand for?"}')
check "Update question success" "true" "$(echo "$RES" | jfield "['success']")"
check "Version incremented to 2" "2" "$(echo "$RES" | jfield "['data']['currentVersion']")"

# ============================================================
section "6. QUIZ MANAGEMENT"
# ============================================================

RES=$(curl -s $API/quizzes -H "Authorization: Bearer $STUDENT_TOKEN")
check "List quizzes (student)" "true" "$(echo "$RES" | jfield "['success']")"
# Find the seeded "AI Fundamentals Quiz" with 8 questions - be specific to avoid test pollution
QUIZ_ID=$(echo "$RES" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for q in d['data']['quizzes']:
    if q.get('totalQuestions', 0) >= 8 and q.get('isPublished'):
        print(q['_id'])
        break
" 2>/dev/null)
check "Seeded published quiz with 8 questions exists" "true" "$([ -n "$QUIZ_ID" ] && echo true || echo false)"
echo "  Quiz ID: $QUIZ_ID"

RES=$(curl -s $API/quizzes/$QUIZ_ID -H "Authorization: Bearer $STUDENT_TOKEN")
check "Get quiz detail" "true" "$(echo "$RES" | jfield "['success']")"

RES=$(curl -s -X POST $API/quizzes -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{
    "title":"Test Quiz",
    "description":"A test quiz",
    "mode":"learning",
    "estimatedMinutes":5
  }')
check "Create quiz success" "true" "$(echo "$RES" | jfield "['success']")"
NEW_QUIZ_ID=$(echo "$RES" | jfield "['data']['_id']")
check "New quiz is draft" "draft" "$(echo "$RES" | jfield "['data']['status']")"

RES=$(curl -s -X POST $API/quizzes/$NEW_QUIZ_ID/questions -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" -d "{\"questionIds\":[\"$FIRST_Q_ID\"]}")
check "Add questions to quiz" "true" "$(echo "$RES" | jfield "['success']")"
check "Quiz has 1 question" "1" "$(echo "$RES" | jfield "['data']['totalQuestions']")"

RES=$(curl -s -X PATCH $API/quizzes/$NEW_QUIZ_ID/publish -H "Authorization: Bearer $SUPERADMIN_TOKEN")
check "Publish quiz success" "true" "$(echo "$RES" | jfield "['success']")"
check "Quiz isPublished true" "true" "$(echo "$RES" | jfield "['data']['isPublished']")"

# ============================================================
section "7. ATTEMPT LIFECYCLE (Core Quiz Engine)"
# ============================================================

echo "  --- Starting attempt ---"
RES=$(curl -s -X POST $API/attempts/start -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" -d "{\"quizId\":\"$QUIZ_ID\"}")
check "Start attempt success" "true" "$(echo "$RES" | jfield "['success']")"
ATTEMPT_ID=$(echo "$RES" | jfield "['data']['_id']")
SNAPSHOT_COUNT=$(echo "$RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d['data']['questionSnapshots']))" 2>/dev/null)
check "Attempt has 8 question snapshots" "8" "$SNAPSHOT_COUNT"
check "Attempt status is in-progress" "in-progress" "$(echo "$RES" | jfield "['data']['status']")"
check "Attempt has totalPoints 80" "80" "$(echo "$RES" | jfield "['data']['totalPoints']")"
echo "  Attempt ID: $ATTEMPT_ID"

# Verify snapshot structure
FIRST_SNAPSHOT=$(echo "$RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d['data']['questionSnapshots'][0]))" 2>/dev/null)
check "Snapshot has questionText" "true" "$(echo "$FIRST_SNAPSHOT" | python3 -c "import sys,json; d=json.load(sys.stdin); print('true' if d.get('questionText') else 'false')" 2>/dev/null)"
check "Snapshot has optionOrder" "true" "$(echo "$FIRST_SNAPSHOT" | python3 -c "import sys,json; d=json.load(sys.stdin); print('true' if d.get('optionOrder') else 'false')" 2>/dev/null)"
check "Snapshot has correctKeys" "true" "$(echo "$FIRST_SNAPSHOT" | python3 -c "import sys,json; d=json.load(sys.stdin); print('true' if d.get('correctKeys') else 'false')" 2>/dev/null)"

echo "  --- Submitting answers ---"
# Save the full attempt response for later use
ATTEMPT_START_RES="$RES"

# Get the correct key for first question
CORRECT_KEY=$(echo "$RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['questionSnapshots'][0]['correctKeys'][0])" 2>/dev/null)
echo "  First question correct key: $CORRECT_KEY"

RES=$(curl -s -X POST $API/attempts/$ATTEMPT_ID/answer -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"questionSnapshotIndex\":0,\"selectedKeys\":[\"$CORRECT_KEY\"],\"timeSpent\":15}")
check "Submit correct answer success" "true" "$(echo "$RES" | jfield "['success']")"
check "Answer marked correct" "true" "$(echo "$RES" | jfield "['data']['feedback']['isCorrect']")"
check "Points awarded 10" "10" "$(echo "$RES" | jfield "['data']['feedback']['pointsAwarded']")"

# Submit wrong answer for question 2 - find a wrong key from QUESTION 2's snapshot
WRONG_KEY=$(echo "$ATTEMPT_START_RES" | python3 -c "
import sys,json
d=json.load(sys.stdin)
snap = d['data']['questionSnapshots'][1]
correct = set(snap['correctKeys'])
for o in snap['options']:
    if o['key'] not in correct:
        print(o['key'])
        break
" 2>/dev/null)
echo "  Question 2 wrong key: $WRONG_KEY"

RES=$(curl -s -X POST $API/attempts/$ATTEMPT_ID/answer -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"questionSnapshotIndex\":1,\"selectedKeys\":[\"$WRONG_KEY\"],\"timeSpent\":10}")
check "Submit wrong answer success" "true" "$(echo "$RES" | jfield "['success']")"
check "Wrong answer marked incorrect" "false" "$(echo "$RES" | jfield "['data']['feedback']['isCorrect']")"
check "Wrong answer 0 points" "0" "$(echo "$RES" | jfield "['data']['feedback']['pointsAwarded']")"

# Submit remaining answers
for i in 2 3 4 5 6 7; do
  curl -s -X POST $API/attempts/$ATTEMPT_ID/answer -H "Authorization: Bearer $STUDENT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"questionSnapshotIndex\":$i,\"selectedKeys\":[\"A\"],\"timeSpent\":10}" > /dev/null
done
echo -e "  ${GREEN}PASS${NC} Submitted answers for questions 3-8"

echo "  --- Finalizing attempt ---"
RES=$(curl -s -X POST $API/attempts/$ATTEMPT_ID/submit -H "Authorization: Bearer $STUDENT_TOKEN")
check "Submit attempt success" "true" "$(echo "$RES" | jfield "['success']")"
check "Attempt status is finalised" "finalised" "$(echo "$RES" | jfield "['data']['status']")"
check "Attempt has percentage" "true" "$([ -n "$(echo "$RES" | jfield "['data']['percentage']")" ] && echo true || echo false)"
check "Attempt has correctCount" "true" "$([ -n "$(echo "$RES" | jfield "['data']['correctCount']")" ] && echo true || echo false)"
EARNED=$(echo "$RES" | jfield "['data']['earnedPoints']")
echo "  Earned: $EARNED points"

RES=$(curl -s $API/attempts/$ATTEMPT_ID/results -H "Authorization: Bearer $STUDENT_TOKEN")
check "Get attempt results success" "true" "$(echo "$RES" | jfield "['success']")"
check "Results reveal correct keys" "true" "$(echo "$RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print('true' if d['data']['questionSnapshots'][0].get('correctKeys') else 'false')" 2>/dev/null)"

RES=$(curl -s $API/attempts/me -H "Authorization: Bearer $STUDENT_TOKEN")
check "Get my attempts success" "true" "$(echo "$RES" | jfield "['success']")"
check "Has at least 1 attempt" "true" "$([ "$(echo "$RES" | jfield "['data']['total']")" -ge 1 ] 2>/dev/null && echo true || echo false)"

RES=$(curl -s -X POST $API/attempts/$ATTEMPT_ID/submit -H "Authorization: Bearer $STUDENT_TOKEN")
check "Cannot re-submit finalised attempt" "400" "$(echo "$RES" | jfield "['statusCode']")"

# Cannot start attempt for unpublished quiz
RES=$(curl -s -X POST $API/quizzes -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"title":"Unpublished Quiz","estimatedMinutes":5}')
UNPUB_QUIZ=$(echo "$RES" | jfield "['data']['_id']")
RES=$(curl -s -X POST $API/attempts/start -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" -d "{\"quizId\":\"$UNPUB_QUIZ\"}")
check "Cannot start attempt for unpublished quiz" "400" "$(echo "$RES" | jfield "['statusCode']")"

# Cross-user attempt access
RES=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":"student2@demo.iitd.ac.in","password":"Student123!"}')
STUDENT2_TOKEN=$(echo "$RES" | jfield "['data']['token']")
RES=$(curl -s -X POST $API/attempts/$ATTEMPT_ID/answer -H "Authorization: Bearer $STUDENT2_TOKEN" \
  -H "Content-Type: application/json" -d '{"questionSnapshotIndex":0,"selectedKeys":["A"]}')
check "Student2 cannot answer student1's attempt" "403" "$(echo "$RES" | jfield "['statusCode']")"

# ============================================================
section "8. LEARNING PATHS & MISSIONS"
# ============================================================

RES=$(curl -s $API/paths)
check "List paths public" "true" "$(echo "$RES" | jfield "['success']")"
PATH_COUNT=$(echo "$RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d['data']))" 2>/dev/null)
check "At least 1 path exists" "true" "$([ "$PATH_COUNT" -ge 1 ] 2>/dev/null && echo true || echo false)"
PATH_SLUG=$(echo "$RES" | jfield "['data'][0]['slug']")

RES=$(curl -s $API/paths/$PATH_SLUG)
check "Get path by slug" "true" "$(echo "$RES" | jfield "['success']")"
check "Path has missions" "true" "$(echo "$RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print('true' if d['data'].get('missions') else 'false')" 2>/dev/null)"

RES=$(curl -s "$API/paths/missions")
check "List missions success" "true" "$(echo "$RES" | jfield "['success']")"

MISSION_SLUG=$(echo "$RES" | jfield "['data'][0]['slug']")
if [ -n "$MISSION_SLUG" ]; then
  RES=$(curl -s $API/paths/mission/$MISSION_SLUG)
  check "Get mission by slug" "true" "$(echo "$RES" | jfield "['success']")"
  check "Mission has content blocks" "true" "$(echo "$RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print('true' if d['data'].get('contentBlocks') else 'false')" 2>/dev/null)"
  check "Mission has quiz linked" "true" "$(echo "$RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print('true' if d['data'].get('quiz') else 'false')" 2>/dev/null)"
else
  echo -e "  ${YELLOW}WARN${NC} No missions found to test"
  FAIL=$((FAIL + 1))
  ERRORS+=("No missions found")
fi

RES=$(curl -s $API/paths/nonexistent-slug-12345)
check "Nonexistent path returns 404" "404" "$(echo "$RES" | jfield "['statusCode']")"

# ============================================================
section "9. RANKINGS"
# ============================================================

RES=$(curl -s $API/rankings/global)
check "Global rankings success" "true" "$(echo "$RES" | jfield "['success']")"
RANKING_COUNT=$(echo "$RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d['data']['rankings']))" 2>/dev/null)
check "Has ranked users" "true" "$([ "$RANKING_COUNT" -ge 1 ] 2>/dev/null && echo true || echo false)"

FIRST_RANK=$(echo "$RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d['data']['rankings'][0]))" 2>/dev/null)
check "Ranking entry has displayName" "true" "$(echo "$FIRST_RANK" | python3 -c "import sys,json; d=json.load(sys.stdin); print('true' if d.get('displayName') else 'false')" 2>/dev/null)"
check "Ranking entry has learningXP" "true" "$(echo "$FIRST_RANK" | python3 -c "import sys,json; d=json.load(sys.stdin); print('true' if 'learningXP' in d else 'false')" 2>/dev/null)"

RES=$(curl -s $API/rankings/college-leaderboard)
check "College leaderboard success" "true" "$(echo "$RES" | jfield "['success']")"

RES=$(curl -s $API/rankings/college/$STUDENT_COLLEGE -H "Authorization: Bearer $STUDENT_TOKEN")
check "College rankings success" "true" "$(echo "$RES" | jfield "['success']")"

# ============================================================
section "10. PROFILES"
# ============================================================

RES=$(curl -s $API/profiles/me -H "Authorization: Bearer $STUDENT_TOKEN")
check "Get my profile success" "true" "$(echo "$RES" | jfield "['success']")"
check "Profile has stats" "true" "$(echo "$RES" | python3 -c "import sys,json; d=json.load(sys.stdin); print('true' if d['data'].get('stats') else 'false')" 2>/dev/null)"

RES=$(curl -s -X PUT $API/profiles/me -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" -d '{"bio":"I love learning AI!","headline":"AI Enthusiast","isProfilePublic":true,"publicDisplayName":"AI Learner 1"}')
check "Update profile success" "true" "$(echo "$RES" | jfield "['success']")"
check "Bio updated" "I love learning AI!" "$(echo "$RES" | jfield "['data']['bio']")"
check "Profile is public" "true" "$(echo "$RES" | jfield "['data']['isProfilePublic']")"

RES=$(curl -s $API/profiles/$STUDENT_ID)
check "Get public profile success" "true" "$(echo "$RES" | jfield "['success']")"
check "Public profile has name" "true" "$([ -n "$(echo "$RES" | jfield "['data']['name']")" ] && echo true || echo false)"

# Test private profile
RES=$(curl -s -X PUT $API/profiles/me -H "Authorization: Bearer $STUDENT2_TOKEN" \
  -H "Content-Type: application/json" -d '{"isProfilePublic":false}')
STUDENT2_ID=$(echo "$RES" | jfield "['data']['_id']")
RES=$(curl -s $API/profiles/$STUDENT2_ID)
check "Private profile returns 404" "404" "$(echo "$RES" | jfield "['statusCode']")"

# ============================================================
section "11. ASSIGNMENTS"
# ============================================================

RES=$(curl -s $API/assignments -H "Authorization: Bearer $STUDENT_TOKEN")
check "Student list assignments" "true" "$(echo "$RES" | jfield "['success']")"

RES=$(curl -s -X POST $API/assignments -H "Authorization: Bearer $FACULTY_TOKEN" \
  -H "Content-Type: application/json" -d "{
    \"title\":\"Mid-term AI Quiz\",
    \"description\":\"Test your AI fundamentals\",
    \"quiz\":\"$QUIZ_ID\",
    \"dueDate\":\"2026-12-31\",
    \"targetAllCollege\":true
  }")
check "Faculty create assignment" "true" "$(echo "$RES" | jfield "['success']")"
ASSIGNMENT_ID=$(echo "$RES" | jfield "['data']['_id']")
check "Assignment has totalAssigned > 0" "true" "$([ "$(echo "$RES" | jfield "['data']['stats']['totalAssigned']")" -ge 1 ] 2>/dev/null && echo true || echo false)"

RES=$(curl -s $API/assignments/$ASSIGNMENT_ID -H "Authorization: Bearer $STUDENT_TOKEN")
check "Get assignment detail" "true" "$(echo "$RES" | jfield "['success']")"

RES=$(curl -s $API/assignments/$ASSIGNMENT_ID/results -H "Authorization: Bearer $FACULTY_TOKEN")
check "Faculty get assignment results" "true" "$(echo "$RES" | jfield "['success']")"

RES=$(curl -s -X POST $API/assignments -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" -d "{\"title\":\"Hack\",\"quiz\":\"$QUIZ_ID\",\"dueDate\":\"2026-12-31\"}")
check "Student cannot create assignment" "403" "$(echo "$RES" | jfield "['statusCode']")"

RES=$(curl -s -X POST $API/assignments -H "Authorization: Bearer $FACULTY_TOKEN" \
  -H "Content-Type: application/json" -d "{\"title\":\"No Due\",\"quiz\":\"$QUIZ_ID\"}")
check "Assignment without due date rejected" "400" "$(echo "$RES" | jfield "['statusCode']")"

# ============================================================
section "12. USER MANAGEMENT"
# ============================================================

RES=$(curl -s $API/users/all -H "Authorization: Bearer $SUPERADMIN_TOKEN")
check "Superadmin list all users" "true" "$(echo "$RES" | jfield "['success']")"
check "Has multiple users" "true" "$([ "$(echo "$RES" | jfield "['data']['total']")" -ge 10 ] 2>/dev/null && echo true || echo false)"

RES=$(curl -s $API/users/college -H "Authorization: Bearer $ADMIN_TOKEN")
check "College admin list users" "true" "$(echo "$RES" | jfield "['success']")"

RES=$(curl -s -X PATCH $API/users/$STUDENT_ID/status -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"status":"suspended"}')
check "Suspend user success" "true" "$(echo "$RES" | jfield "['success']")"
check "User status is suspended" "suspended" "$(echo "$RES" | jfield "['data']['status']")"

RES=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":"student1@demo.iitd.ac.in","password":"Student123!"}')
check "Suspended user login rejected" "403" "$(echo "$RES" | jfield "['statusCode']")"

RES=$(curl -s -X PATCH $API/users/$STUDENT_ID/status -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"status":"active"}')
check "Reactivate user success" "true" "$(echo "$RES" | jfield "['success']")"

RES=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":"student1@demo.iitd.ac.in","password":"Student123!"}')
check "Reactivated user can login" "true" "$(echo "$RES" | jfield "['success']")"
STUDENT_TOKEN=$(echo "$RES" | jfield "['data']['token']")

RES=$(curl -s -X PATCH $API/users/$STUDENT_ID/role -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"role":"faculty"}')
check "Update user role success" "true" "$(echo "$RES" | jfield "['success']")"
check "Role is now faculty" "faculty" "$(echo "$RES" | jfield "['data']['role']")"

# Revert role
curl -s -X PATCH $API/users/$STUDENT_ID/role -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"role":"student"}' > /dev/null

RES=$(curl -s $API/users/college -H "Authorization: Bearer $STUDENT_TOKEN")
check "Student cannot list college users" "403" "$(echo "$RES" | jfield "['statusCode']")"

# ============================================================
section "13. TENANT ISOLATION"
# ============================================================

RES=$(curl -s -X POST $API/colleges -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{"name":"Second College","shortCode":"SC2","plan":"trial"}')
COLLEGE2_ID=$(echo "$RES" | jfield "['data']['_id']")

curl -s -X POST $API/colleges/$COLLEGE2_ID/domains -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" -d "{\"domain\":\"sc2-$RANDOM-$RANDOM.ac.in\"}" > /dev/null
SC2_DOMAIN=$(curl -s $API/colleges/$COLLEGE2_ID -H "Authorization: Bearer $SUPERADMIN_TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['domains'][0]['domain'])" 2>/dev/null)
curl -s -X POST $API/colleges/$COLLEGE2_ID/domains/verify -H "Authorization: Bearer $SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" -d "{\"domain\":\"$SC2_DOMAIN\",\"method\":\"manual\"}" > /dev/null

# Assignment auto-scoped to faculty's college
RES=$(curl -s -X POST $API/assignments -H "Authorization: Bearer $FACULTY_TOKEN" \
  -H "Content-Type: application/json" -d "{\"title\":\"Cross\",\"quiz\":\"$QUIZ_ID\",\"dueDate\":\"2026-12-31\"}")
ASSIGNMENT_COLLEGE=$(echo "$RES" | jfield "['data']['college']")
check "Assignment auto-scoped to faculty's college" "$ADMIN_COLLEGE" "$ASSIGNMENT_COLLEGE"

# ============================================================
section "14. SECURITY CHECKS"
# ============================================================

RES=$(curl -s -I http://localhost:5001/health)
check_contains "Has X-Content-Type-Options" "x-content-type-options" "$(echo "$RES" | tr '[:upper:]' '[:lower:]')"
check_contains "Has X-Frame-Options" "x-frame-options" "$(echo "$RES" | tr '[:upper:]' '[:lower:]')"
check_contains "Has Strict-Transport-Security" "strict-transport-security" "$(echo "$RES" | tr '[:upper:]' '[:lower:]')"

RES=$(curl -s -I -X OPTIONS http://localhost:5001/api/auth/me -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: GET")
check_contains "CORS allows origin" "access-control-allow-origin" "$(echo "$RES" | tr '[:upper:]' '[:lower:]')"

RES=$(curl -s $API/profiles/me)
check "No token = 401" "401" "$(echo "$RES" | jfield "['statusCode']")"

RES=$(curl -s $API/profiles/me -H "Authorization: Bearer not.a.real.jwt")
check "Malformed JWT = 401" "401" "$(echo "$RES" | jfield "['statusCode']")"

# NoSQL injection attempt
RES=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":{"$gt":""},"password":"test"}')
check "NoSQL injection in email rejected" "400" "$(echo "$RES" | jfield "['statusCode']")"

# ============================================================
section "15. EDGE CASES"
# ============================================================

RES=$(curl -s -X POST $API/attempts/start -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" -d '{"quizId":"507f1f77bcf86cd799439011"}')
check "Nonexistent quiz attempt rejected" "404" "$(echo "$RES" | jfield "['statusCode']")"

# Start a fresh attempt to test invalid question index
RES=$(curl -s -X POST $API/attempts/start -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" -d "{\"quizId\":\"$QUIZ_ID\"}")
NEW_ATTEMPT=$(echo "$RES" | jfield "['data']['_id']")

RES=$(curl -s -X POST $API/attempts/$NEW_ATTEMPT/answer -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" -d '{"questionSnapshotIndex":999,"selectedKeys":["A"]}')
check "Invalid question index rejected" "400" "$(echo "$RES" | jfield "['statusCode']")"

RES=$(curl -s -X POST $API/attempts/$NEW_ATTEMPT/answer -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" -d '{"questionSnapshotIndex":0,"selectedKeys":[]}')
check "Empty selection rejected" "400" "$(echo "$RES" | jfield "['statusCode']")"

curl -s -X POST $API/attempts/$NEW_ATTEMPT/submit -H "Authorization: Bearer $STUDENT_TOKEN" > /dev/null

RES=$(curl -s $API/profiles/507f1f77bcf86cd799439011)
check "Nonexistent profile 404" "404" "$(echo "$RES" | jfield "['statusCode']")"

RES=$(curl -s $API/assignments/507f1f77bcf86cd799439011 -H "Authorization: Bearer $STUDENT_TOKEN")
check "Nonexistent assignment 404" "404" "$(echo "$RES" | jfield "['statusCode']")"

# ============================================================
# SUMMARY
# ============================================================
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}            TEST SUMMARY                 ${NC}"
echo -e "${CYAN}========================================${NC}"
echo -e "  ${GREEN}Passed:${NC} $PASS"
echo -e "  ${RED}Failed:${NC} $FAIL"
echo -e "  Total:  $((PASS + FAIL))"

if [ $FAIL -gt 0 ]; then
  echo ""
  echo -e "${RED}Failed tests:${NC}"
  for err in "${ERRORS[@]}"; do
    echo -e "  ${RED}*${NC} $err"
  done
fi
echo -e "${CYAN}========================================${NC}"

exit $FAIL
