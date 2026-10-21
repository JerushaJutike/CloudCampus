const fs = require("node:fs");
const path = require("node:path");
const db = require("../src/config/db");
const mode = process.argv[2];

async function seedCurriculum(client) {
  const curriculum = {
  "data-structures-algorithms": [
    [
      "Linked Lists",
      "Connect nodes to build flexible sequences.",
      [
        [
          "Nodes and traversal",
          "A linked list stores values in nodes connected by references. Unlike arrays, nodes do not need adjacent memory, so inserting after a known node is constant time. Finding a position still requires traversal from the head.\n\nWalk through a list one reference at a time and stop when the current node is null. Practice: implement a length counter and trace it on an empty list, a one-node list, and a list with repeated values.",
          20
        ],
        [
          "Insertion and deletion",
          "To insert a node, preserve the old next reference before connecting the new node. To delete, update the previous node so it skips the removed node. The head is a special case because it has no previous node.\n\nPractice: insert at the head, tail, and after a target value. Draw the links before and after each operation and state which cases require a full traversal.",
          25
        ],
        [
          "Doubly linked lists",
          "A doubly linked node keeps both next and previous references. This makes backward traversal possible and can simplify removal when a node is already known, at the cost of extra memory and more pointer updates.\n\nPractice: implement removal for the head, tail, middle, and only node. Check that both directions remain consistent after every change.",
          25
        ]
      ]
    ],
    [
      "Stacks, Queues and Complexity",
      "Choose a structure that matches the order of work.",
      [
        [
          "Stack operations",
          "A stack follows last-in, first-out order. Push adds to the top and pop removes the top; both can be constant time when the stack is backed by a dynamic array or linked list.\n\nStacks are useful for undo history, expression evaluation, and tracking nested calls. Practice: use a stack to validate matching parentheses and report the first unbalanced position.",
          20
        ],
        [
          "Queues and deques",
          "A queue follows first-in, first-out order. A circular buffer avoids shifting every item after removal; a deque supports efficient additions and removals at both ends.\n\nQueues model waiting jobs and breadth-first search. Practice: simulate a print queue and explain why removing index zero from a plain array may be inefficient.",
          20
        ],
        [
          "Selecting a data structure",
          "Compare operations that matter for the task: lookup, insertion, deletion, ordering, and memory. Big-O describes how costs grow with input size, while constants and data distribution still affect real performance.\n\nPractice: choose a list, stack, queue, set, or map for three small scenarios and justify each choice with the operations the application performs most often.",
          25
        ]
      ]
    ]
  ],
  "database-management-systems": [
    [
      "Normalization and Schema Design",
      "Model relationships while reducing update anomalies.",
      [
        [
          "Functional dependencies",
          "A functional dependency states that one set of attributes determines another. Candidate keys identify rows, while non-key attributes should depend on the key rather than on unrelated columns.\n\nPractice: inspect a student-course table that repeats instructor details. Identify the key and write the dependencies that cause duplicated data.",
          20
        ],
        [
          "First, second and third normal forms",
          "First normal form keeps each field atomic. Second normal form removes partial dependencies on part of a composite key. Third normal form removes dependencies between non-key attributes.\n\nNormalization reduces insertion, update, and deletion anomalies. Practice: split a repeated enrollment table into student, course, and enrollment relations, then explain what each table owns.",
          25
        ],
        [
          "Relationships and constraints",
          "Foreign keys connect related rows and protect referential integrity. Unique, not-null, and check constraints express rules close to the stored data. Choose delete behavior deliberately so parent removal cannot silently erase important history.\n\nPractice: design a course-enrollment relationship and specify the primary key, foreign keys, and uniqueness rule that prevents duplicate enrollment.",
          25
        ]
      ]
    ],
    [
      "Transactions and Indexing",
      "Keep changes consistent and make common queries efficient.",
      [
        [
          "ACID transactions",
          "Atomicity groups changes so they commit together or roll back together. Consistency preserves rules, isolation controls concurrent visibility, and durability keeps committed work after failure.\n\nPractice: describe why recording a quiz attempt and awarding its XP should share one transaction. Identify the partial state that would be incorrect if only one write succeeded.",
          20
        ],
        [
          "Indexes and query plans",
          "An index stores an ordered lookup structure that can reduce the rows scanned for selective filters. Indexes speed reads but consume storage and add work to inserts, updates, and deletes.\n\nPractice: identify columns used by a frequent lookup, then compare a selective filter with a query that returns most rows. Explain why an index may not help the second query.",
          25
        ],
        [
          "Joins and aggregation",
          "Joins combine rows through related keys. Inner joins keep matching pairs; left joins preserve every row from the left side. Grouping and aggregate functions summarize sets of rows.\n\nPractice: report each course with its enrollment count, including courses with zero learners. Decide where the left join and count belong so empty courses remain visible.",
          25
        ]
      ]
    ]
  ],
  "java-programming": [
    [
      "Collections and Generics",
      "Work with reusable typed data structures.",
      [
        [
          "Lists, sets and maps",
          "A List preserves order and allows duplicates. A Set represents distinct values, while a Map associates keys with values. Pick a collection based on the operations and guarantees the program needs.\n\nPractice: count word frequencies with a Map, preserve first-seen order, and explain which collection choices affect the result.",
          20
        ],
        [
          "Generics and type safety",
          "Generics let classes and methods work with a type parameter while retaining compile-time checks. A List<String> prevents unrelated values from being added and avoids repeated casts when reading.\n\nPractice: write a generic method that returns the first item or an empty Optional. Try it with strings and integers, then explain the compile-time guarantee.",
          25
        ],
        [
          "Iteration and comparators",
          "Enhanced for loops work well when processing every item. Iterators support safe removal during traversal. Comparators define an explicit ordering when a type has more than one useful sort order.\n\nPractice: sort a list of students by score, then by name for ties. Test equal scores and an empty list.",
          25
        ]
      ]
    ],
    [
      "Exceptions, Files and Testing",
      "Handle failures clearly and verify program behavior.",
      [
        [
          "Checked and unchecked exceptions",
          "Exceptions separate normal results from failures. Catch an exception only when the current layer can recover or add useful context; otherwise allow it to reach a handler. Use specific exception types instead of hiding errors in a broad catch.\n\nPractice: validate a score and distinguish invalid input from an I/O failure.",
          20
        ],
        [
          "Reading and writing files",
          "Try-with-resources closes streams even when an error occurs. Specify a character encoding for text and handle missing or unreadable files as expected outcomes. Keep file paths under application control when inputs come from users.\n\nPractice: read lines from a UTF-8 file, count them, and report a friendly message when the file is missing.",
          25
        ],
        [
          "Unit tests and debugging",
          "A unit test checks one behavior with a known input and expected result. Test normal cases, boundary cases, and invalid inputs. Small tests make regressions easier to locate than manual end-to-end checks alone.\n\nPractice: test a method that calculates an average with one value, multiple values, and an empty input.",
          25
        ]
      ]
    ]
  ],
  "web-development-fundamentals": [
    [
      "Responsive CSS and Layout",
      "Build pages that adapt to different screens.",
      [
        [
          "CSS box model",
          "Every element is laid out as content, padding, border, and margin. Consistent box sizing makes declared widths easier to reason about. Spacing should reinforce the page hierarchy rather than decorate every element equally.\n\nPractice: build a card with a readable maximum width and inspect how padding and borders affect its total size.",
          20
        ],
        [
          "Flexbox and Grid",
          "Flexbox arranges items along one primary axis; Grid organizes rows and columns together. Use layout tools to describe the relationship between elements, then let content determine height where possible.\n\nPractice: create a two-column course catalog that becomes one column on a narrow screen without changing the document order.",
          25
        ],
        [
          "Responsive breakpoints",
          "Responsive design starts with a layout that works at small widths, then adds space when the content needs it. Breakpoints should respond to layout pressure, not to named devices.\n\nPractice: test navigation, buttons, and course cards at narrow, medium, and wide viewports. Ensure no text or control requires horizontal scrolling.",
          25
        ]
      ]
    ],
    [
      "DOM, Forms and Web APIs",
      "Connect accessible page structure to useful behavior.",
      [
        [
          "Semantic HTML and accessibility",
          "Semantic elements describe the role of content. Buttons perform actions, links navigate, labels identify form controls, and headings give users a meaningful outline. Keyboard focus must remain visible.\n\nPractice: replace clickable generic containers with appropriate links or buttons and navigate the page using only the keyboard.",
          20
        ],
        [
          "Form validation and events",
          "Browser form controls provide useful input types and basic constraints. JavaScript can add contextual validation, but errors should explain how to fix the value and remain associated with the field.\n\nPractice: build a course search form that accepts a query, handles an empty value, and announces the number of results.",
          25
        ],
        [
          "Fetch and JSON APIs",
          "The Fetch API sends requests and returns a response that must be checked for an HTTP error before parsing JSON. Keep loading, empty, success, and failure states visible so users know what happened.\n\nPractice: load a course list, show a clear loading state, and display a retry action if the request fails.",
          25
        ]
      ]
    ]
  ],
  "python-foundations": [
    [
      "Modules, Files and Testing",
      "Organize Python programs and work safely with data.",
      [
        [
          "Modules and imports",
          "A module groups related definitions in a Python file. Import only the names a module needs and keep executable setup behind a main guard so importing code does not unexpectedly run the application.\n\nPractice: move a helper function into a module and import it from a small script. Explain the difference between a module name and a file path.",
          20
        ],
        [
          "Files and context managers",
          "The with statement manages a file resource and closes it after the block, including when an exception occurs. Specify an encoding for text and choose a mode that matches whether data should be read, replaced, or appended.\n\nPractice: read a UTF-8 text file, count non-empty lines, and handle a missing file without hiding unrelated errors.",
          25
        ],
        [
          "Unit testing and debugging",
          "A unit test checks one small behavior with predictable inputs. Include normal cases, empty inputs, boundaries, and invalid values. Clear assertions make a failure point directly to the behavior that changed.\n\nPractice: test a function that returns the largest value, including a one-item list and a list containing negative numbers.",
          25
        ]
      ]
    ],
    [
      "Object-Oriented Python and Projects",
      "Model related behavior with clear, testable classes.",
      [
        [
          "Classes and instances",
          "A class defines behavior and data shared by instances. The initializer establishes a valid starting state; instance methods operate on that state through self. Use classes when they make relationships clearer than separate functions and dictionaries.\n\nPractice: model a Course with a title and a method that returns its lesson count.",
          20
        ],
        [
          "Composition and inheritance",
          "Composition builds a larger object from smaller collaborators and often keeps responsibilities easy to test. Inheritance is useful for a genuine is-a relationship where subclasses can honor the parent contract.\n\nPractice: model a learner enrolled in several courses using composition, then explain why a learner should not inherit from a course.",
          25
        ],
        [
          "Project structure and documentation",
          "A small project benefits from clear modules, a repeatable entry point, documented inputs, and tests for key behavior. Keep configuration separate from logic and avoid committing local secrets.\n\nPractice: organize a command-line study tracker into data, operations, and entry-point modules. Write a README with setup steps and one example command.",
          25
        ]
      ]
    ]
  ],
  "operating-systems": [
    [
      "Concurrency and Synchronization",
      "Coordinate shared work without race conditions.",
      [
        [
          "Threads and shared state",
          "Threads in one process can share memory, which makes communication convenient and concurrent updates risky. A race condition occurs when the result depends on the timing of operations.\n\nPractice: draw two threads incrementing the same counter. Mark the read, update, and write steps and show how one increment can be lost.",
          20
        ],
        [
          "Locks and semaphores",
          "A mutex gives one thread exclusive access to a critical section. A semaphore tracks a limited number of permits and can coordinate access to a pool of resources. Keep protected sections short and use a consistent lock order.\n\nPractice: protect a shared counter with a lock and describe which operations must be inside the critical section.",
          25
        ],
        [
          "Deadlocks and starvation",
          "Deadlock can occur when tasks wait in a cycle while holding resources. Consistent lock ordering can prevent circular wait. Starvation occurs when a task is repeatedly denied progress even though the system continues running.\n\nPractice: draw a two-lock deadlock and redesign the acquisition order. Explain how fairness differs from deadlock prevention.",
          25
        ]
      ]
    ],
    [
      "Filesystems, I/O and Security",
      "Understand how operating systems manage stored data and access.",
      [
        [
          "Files and directories",
          "A filesystem maps names and directory structures to stored data and metadata. File descriptors provide a process with an interface to open files and devices. Permissions control which users can read, write, or execute resources.\n\nPractice: trace a file open from a path to a descriptor and list the errors that may occur when the path or permissions are invalid.",
          20
        ],
        [
          "I/O and buffering",
          "I/O devices are much slower than the CPU, so operating systems use interrupts, buffering, and scheduling to coordinate transfers. Blocking I/O waits for completion; asynchronous approaches let other work proceed.\n\nPractice: compare a program that waits for each file read with one that overlaps I/O and computation.",
          25
        ],
        [
          "Protection and access control",
          "Operating systems isolate processes and check permissions at resource boundaries. Least privilege gives each process only the access it needs. Memory protection and user/kernel modes help prevent one program from freely changing another program or the operating system.\n\nPractice: explain why a web service should not accept arbitrary filesystem paths from a user request.",
          25
        ]
      ]
    ]
  ]
};
  const readingByCourse = {
    "data-structures-algorithms": [
      [
        { title: "Linked list concepts and operations — GeeksforGeeks", url: "https://www.geeksforgeeks.org/dsa/what-is-linked-list/" },
        { title: "DSA guide: linked lists — GeeksforGeeks", url: "https://www.geeksforgeeks.org/dsa/data-structures-algorithms-guide-for-developers/" },
      ],
      [
        { title: "Stack data structure — GeeksforGeeks", url: "https://www.geeksforgeeks.org/dsa/stack-data-structure/" },
        { title: "Queue notes — GeeksforGeeks", url: "https://www.geeksforgeeks.org/dsa/short-notes-queue/" },
        { title: "Big O notation — GeeksforGeeks", url: "https://www.geeksforgeeks.org/dsa/analysis-algorithms-big-o-analysis/" },
      ],
    ],
    "database-management-systems": [
      [
        { title: "DBMS tutorial: functional dependencies and normalization — GeeksforGeeks", url: "https://www.geeksforgeeks.org/dbms/dbms/" },
      ],
      [
        { title: "ACID properties in DBMS — GeeksforGeeks", url: "https://www.geeksforgeeks.org/dbms/acid-properties-in-dbms/" },
        { title: "Indexing in databases — GeeksforGeeks", url: "https://www.geeksforgeeks.org/dbms/indexing-in-databases-set-1/" },
        { title: "SQL joins — GeeksforGeeks", url: "https://www.geeksforgeeks.org/sql/sql-join-set-1-inner-left-right-and-full-joins/" },
      ],
    ],
    "java-programming": [
      [
        { title: "Java Collections tutorial — GeeksforGeeks", url: "https://www.geeksforgeeks.org/java/java-collection-tutorial/" },
        { title: "Generics in Java — GeeksforGeeks", url: "https://www.geeksforgeeks.org/java/generics-in-java/" },
        { title: "Iterators in Java — GeeksforGeeks", url: "https://www.geeksforgeeks.org/java/iterators-in-java/" },
      ],
      [
        { title: "Exception handling in Java — GeeksforGeeks", url: "https://www.geeksforgeeks.org/java/exceptions-in-java/" },
        { title: "File handling in Java — GeeksforGeeks", url: "https://www.geeksforgeeks.org/java/file-handling-in-java/" },
        { title: "Introduction to JUnit — GeeksforGeeks", url: "https://www.geeksforgeeks.org/advance-java/introduction-of-junit/" },
      ],
    ],
    "web-development-fundamentals": [
      [
        { title: "Responsive design and media queries — GeeksforGeeks", url: "https://www.geeksforgeeks.org/html/basics-of-responsive-web-design-media-queries/" },
        { title: "Web development guide — GeeksforGeeks", url: "https://www.geeksforgeeks.org/blogs/can-start-learn-web-development/" },
      ],
      [
        { title: "HTML5 semantics — GeeksforGeeks", url: "https://www.geeksforgeeks.org/html/html5-semantics/" },
        { title: "HTML forms — GeeksforGeeks", url: "https://www.geeksforgeeks.org/html/html-forms/" },
        { title: "JavaScript HTML DOM — GeeksforGeeks", url: "https://www.geeksforgeeks.org/html/javascript-html-dom/" },
        { title: "Fetch API in JavaScript — GeeksforGeeks", url: "https://www.geeksforgeeks.org/javascript/javascript-fetch-method/" },
      ],
    ],
    "python-foundations": [
      [
        { title: "Python modules — GeeksforGeeks", url: "https://www.geeksforgeeks.org/python/python-modules/" },
        { title: "File handling in Python — GeeksforGeeks", url: "https://www.geeksforgeeks.org/python/file-handling-python/" },
        { title: "Python unittest tutorial — GeeksforGeeks", url: "https://www.geeksforgeeks.org/python/unit-testing-python-unittest/" },
      ],
      [
        { title: "Python OOP concepts — GeeksforGeeks", url: "https://www.geeksforgeeks.org/python/python-oops-concepts/" },
        { title: "Python tutorial — GeeksforGeeks", url: "https://www.geeksforgeeks.org/python/python-programming-language-tutorial/" },
      ],
    ],
    "operating-systems": [
      [
        { title: "Process synchronization — GeeksforGeeks", url: "https://www.geeksforgeeks.org/operating-systems/introduction-of-process-synchronization/" },
        { title: "Deadlock prevention — GeeksforGeeks", url: "https://www.geeksforgeeks.org/operating-systems/deadlock-prevention/" },
        { title: "Thread in operating systems — GeeksforGeeks", url: "https://www.geeksforgeeks.org/operating-systems/thread-in-operating-system/" },
      ],
      [
        { title: "Operating systems tutorial: filesystems and I/O — GeeksforGeeks", url: "https://www.geeksforgeeks.org/operating-systems/operating-systems/" },
        { title: "File and I/O management — GeeksforGeeks", url: "https://www.geeksforgeeks.org/operating-systems/file-i-o-management-interview-questions/" },
        { title: "Unix file system — GeeksforGeeks", url: "https://www.geeksforgeeks.org/operating-systems/unix-file-system/" },
      ],
    ],
  };
  const lessonExamples = {
    "data-structures-algorithms": [
      [
        `EXAMPLE & DIAGRAM
For 4 → 9 → 12, traversal starts at head and follows next until null.
head → [4] → [9] → [12] → null

PSEUDOCODE
current = head
while current is not null:
    visit(current.value)
    current = current.next

The loop visits each node once: O(n) time, O(1) extra space.`,
        `EXAMPLE & DIAGRAM
Insert 7 after 4: save 4.next, point 7.next to it, then set 4.next to 7.
Before: 4 → 9 → null
After:  4 → 7 → 9 → null

PSEUDOCODE
new.next = current.next
current.next = new

For deletion, bypass the target: previous.next = target.next. Handle deleting the head separately.`,
        `EXAMPLE & DIAGRAM
A doubly linked list stores links in both directions.
null ←→ [A] ⇄ [B] ⇄ [C] ←→ null

To remove B, connect A.next to C and C.prev to A. Update both links or forward and backward traversal will disagree. A doubly linked node uses more memory than a singly linked node.`,
      ],
      [
        `EXAMPLE & SYNTAX
A stack is useful for checking brackets. Push each opening bracket; on a closing bracket, compare it with the most recent opening bracket.

PSEUDOCODE
for each character ch:
    if ch is an opening bracket: push ch
    else if ch is a closing bracket:
        if stack is empty or top does not match: invalid
        pop()
valid only when the stack is empty at the end

The most recent opening bracket must close first (LIFO).`,
        `EXAMPLE & DIAGRAM
A help-desk queue serves requests in arrival order (FIFO). A deque allows work at either end.
front → [ticket 21] [ticket 22] [ticket 23] ← rear

PSEUDOCODE
enqueue(x): add x at rear
dequeue(): remove item at front

A circular array wraps the next index: next = (index + 1) % capacity. This reuses freed slots instead of shifting every item.`,
        `EXAMPLE & COMPLEXITY
Searching an unsorted list checks up to n items: O(n). Accessing an array by index is O(1). Inserting after a known linked-list node is O(1), but first finding that node is O(n).

Choose by the common operation:
ordered arrivals → queue
undo history → stack
fast membership checks → set

Big-O describes growth as input grows; it does not predict exact seconds or ignore memory use.`,
      ],
    ],
    "database-management-systems": [
      [
        `EXAMPLE & DEPENDENCY
In a Student table, StudentID → StudentName means one StudentID determines one name. In Enrollment, (StudentID, CourseID) → Grade because the grade belongs to that student-course pair.

STUDENT(StudentID, StudentName)
ENROLLMENT(StudentID, CourseID, Grade)

A key should identify a row. If a dependency does not follow from the key, the design may repeat facts and cause update anomalies.`,
        `EXAMPLE & DECOMPOSITION
A single enrollment sheet repeats student and course details on every row. Split it into related tables:
STUDENT(StudentID, Name)
COURSE(CourseID, Title)
ENROLLMENT(StudentID, CourseID, Grade)

1NF: one value per field. 2NF: non-key fields depend on the whole composite key. 3NF: non-key fields do not depend on other non-key fields. Join the tables by keys to recover a useful view.`,
        `EXAMPLE & SQL SYNTAX
CREATE TABLE enrollment (
  student_id INTEGER REFERENCES students(id),
  course_id INTEGER REFERENCES courses(id),
  grade TEXT CHECK (grade IN ('A','B','C','D','F')),
  PRIMARY KEY (student_id, course_id)
);

The foreign keys require the referenced rows to exist. The composite primary key prevents a student from enrolling in the same course twice.`,
      ],
      [
        `EXAMPLE & SQL SYNTAX
BEGIN;
UPDATE accounts SET balance = balance - 50 WHERE id = 1;
UPDATE accounts SET balance = balance + 50 WHERE id = 2;
COMMIT;

If a step fails, ROLLBACK returns both accounts to their prior state. Atomicity means the transfer is all-or-nothing; durability means a committed transfer survives a restart.`,
        `EXAMPLE & SQL SYNTAX
CREATE INDEX idx_lessons_course ON lessons(course_id);
EXPLAIN SELECT * FROM lessons WHERE course_id = 12;

An index can help selective lookups, but it takes storage and must be maintained on writes. Read the query plan and measure representative data before adding indexes.`,
        `EXAMPLE & SQL SYNTAX
SELECT c.title, COUNT(e.student_id) AS learners
FROM courses c
LEFT JOIN enrollments e ON e.course_id = c.id
GROUP BY c.id, c.title;

LEFT JOIN keeps courses with no enrollments. COUNT(e.student_id) returns zero for those courses; COUNT(*) would count the preserved course row.`,
      ],
    ],
    "java-programming": [
      [
        `EXAMPLE & JAVA SYNTAX
List<String> names = new ArrayList<>();
names.add("Mina");
Set<String> unique = new HashSet<>(names);
Map<String, Integer> scores = new HashMap<>();
scores.put("Mina", 92);

Use List for ordered items with duplicates, Set for uniqueness, and Map for key-value lookup. Select the interface that describes what the code needs.`,
        `EXAMPLE & JAVA SYNTAX
static <T> T first(List<T> items) {
    if (items.isEmpty()) throw new IllegalArgumentException("empty list");
    return items.get(0);
}

T is a type parameter. Calling first with List<String> returns a String, and the compiler checks the type without a manual cast. Decide how an empty list should be represented or reported.`,
        `EXAMPLE & JAVA SYNTAX
Comparator<Student> byScoreThenName =
    Comparator.comparingInt(Student::score)
              .reversed()
              .thenComparing(Student::name);

for (Student student : students) {
    System.out.println(student.name());
}

Use an Iterator when removing items during traversal: call iterator.remove() after next(), instead of changing the collection behind the loop.`,
      ],
      [
        `EXAMPLE & JAVA SYNTAX
try {
    int score = Integer.parseInt(input);
    System.out.println(score);
} catch (NumberFormatException ex) {
    System.out.println("Enter a whole number.");
}

Catch only errors this layer can handle. Checked exceptions must be caught or declared; unchecked exceptions often indicate invalid state or input.`,
        `EXAMPLE & JAVA SYNTAX
try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
    String line;
    while ((line = reader.readLine()) != null) {
        System.out.println(line);
    }
} catch (IOException ex) {
    System.err.println("Could not read the file.");
}

Try-with-resources closes the reader even when reading fails.`,
        `EXAMPLE & JUNIT SYNTAX
@Test
void addsTwoNumbers() {
    assertEquals(5, Calculator.add(2, 3));
}

A focused test checks one behavior. Add boundary cases too, such as zero, negative inputs, and invalid values. A failing assertion should make the expected result clear.`,
      ],
    ],
    "web-development-fundamentals": [
      [
        `EXAMPLE & CSS SYNTAX
* { box-sizing: border-box; }
.card {
  width: 320px;
  padding: 16px;
  border: 2px solid #ccd;
  margin: 12px;
}

With border-box, the declared 320px includes content, padding and border. Margin sits outside that width.`,
        `EXAMPLE & CSS SYNTAX
.layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

Grid suits two-dimensional page regions; Flexbox aligns items along one main axis.`,
        `EXAMPLE & RESPONSIVE FLOW
Start with a narrow screen → stack content → add columns when there is room.

@media (min-width: 720px) {
  .course-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

Test the actual content at each breakpoint. A layout is ready when text and controls fit without horizontal scrolling.`,
      ],
      [
        `EXAMPLE & HTML SYNTAX
<header><h1>Course notes</h1></header>
<main>
  <article aria-labelledby="lesson-title">
    <h2 id="lesson-title">Arrays</h2>
    <p>Ordered values stored by index.</p>
  </article>
</main>

Use a button for an action and a link for navigation. A semantic outline helps keyboard and screen-reader users understand the page.`,
        `EXAMPLE & HTML / JAVASCRIPT
<form id="search-form">
  <label for="query">Search courses</label>
  <input id="query" name="query" required minlength="2">
  <button>Search</button>
</form>

The browser checks required and minlength. Add a submit event listener for app-specific behavior, then show a clear message if the value is invalid.`,
        `EXAMPLE & JAVASCRIPT SYNTAX
async function loadCourses() {
  const response = await fetch("/api/courses");
  if (!response.ok) throw new Error("Request failed");
  return response.json();
}

Flow: show loading → send request → check HTTP status → parse JSON → show results or a useful error. Network errors and HTTP error responses are different cases.`,
      ],
    ],
    "python-foundations": [
      [
        `EXAMPLE & PYTHON SYNTAX
# study_tools.py
def count_lessons(course):
    return len(course.lessons)

# main.py
from study_tools import count_lessons

if __name__ == "__main__":
    print(count_lessons(course))

Keep reusable definitions in modules. The main guard prevents application startup code from running just because another file imports the module.`,
        `EXAMPLE & PYTHON SYNTAX
from pathlib import Path

path = Path("notes.txt")
try:
    with path.open(encoding="utf-8") as file:
        text = file.read()
except FileNotFoundError:
    text = ""

The with block closes the file automatically. Choose read, write, or append mode deliberately; write mode replaces existing contents.`,
        `EXAMPLE & PYTHON TEST SYNTAX
def average(values):
    if not values:
        raise ValueError("values cannot be empty")
    return sum(values) / len(values)

assert average([2, 4]) == 3

Test normal, boundary, and invalid inputs. For a maintained project, place checks in unittest or pytest files instead of relying only on manual assertions.`,
      ],
      [
        `EXAMPLE & PYTHON SYNTAX
class Course:
    def __init__(self, title, lessons):
        self.title = title
        self.lessons = lessons

    def lesson_count(self):
        return len(self.lessons)

course = Course("Python", ["Types", "Functions"])
print(course.lesson_count())  # 2

The class defines shared behavior; each instance stores its own state.`,
        `EXAMPLE & DESIGN
Composition: Learner → enrolled_courses → Course objects

class Learner:
    def __init__(self, name):
        self.name = name
        self.courses = []

A learner has courses, so composition describes the relationship. Inheritance is for an is-a relationship where a child can safely honor the parent class's behavior.`,
        `EXAMPLE & PROJECT FLOW
study_tracker/
  study_tracker/
    __init__.py
    tracker.py
  tests/
    test_tracker.py
  README.md

A useful README explains setup → run → example → tests. Keep secrets in environment configuration, not in source files. A small, clear structure is easier to extend than one large script.`,
      ],
    ],
    "operating-systems": [
      [
        `EXAMPLE & DIAGRAM
Two threads increment a shared counter. Each increment is read → add one → write.
T1 reads 4 ─────────────── writes 5
T2       reads 4 → writes 5
Expected 6, actual 5: one update was lost.

A process owns resources; threads within it share memory. Protect compound updates when concurrent work touches the same data.`,
        `EXAMPLE & PSEUDOCODE
lock.acquire()
try:
    shared_counter = shared_counter + 1
finally:
    lock.release()

A mutex allows one holder at a time. A counting semaphore allows up to N simultaneous users of a limited resource pool. Always release a lock, including when work raises an error.`,
        `EXAMPLE & WAIT-FOR DIAGRAM
Thread A holds Lock 1 → waits for Lock 2
Thread B holds Lock 2 → waits for Lock 1
A → B → A (cycle): deadlock

Use one consistent lock order to prevent circular wait. Starvation is different: a task keeps waiting while other tasks continue to make progress.`,
      ],
      [
        `EXAMPLE & PATH DIAGRAM
/
└── home
    └── learner
        └── notes.txt

A path names a file through its directories. The OS checks permissions before allowing an operation. A file descriptor is a process handle to an already opened file or device.`,
        `EXAMPLE & I/O FLOW
Program requests read → OS checks descriptor → device/driver transfers data → buffer holds bytes → program receives result

With blocking I/O the caller waits for the result. Non-blocking I/O returns control so the program can do other work and check or await readiness later. Buffering groups data to reduce small device operations.`,
        `EXAMPLE & ACCESS CHECK
User + process → requested file operation → permission check → allow or deny

Apply least privilege: a service that only reads course files should not have write access to system files. Validate user-supplied paths and keep access within the intended directory.`,
      ],
    ],
  };
  for (const [slug, modules] of Object.entries(curriculum)) {
    const course = await client.query(
      "SELECT id FROM courses WHERE slug=$1 AND NOT archived",
      [slug],
    );
    if (!course.rowCount) continue;
    for (const [moduleIndex, [title, description, lessons]] of modules.entries()) {
      const moduleOrder = moduleIndex + 3;
      let module = await client.query(
        "SELECT id FROM modules WHERE course_id=$1 AND order_index=$2 AND NOT archived",
        [course.rows[0].id, moduleOrder],
      );
      if (!module.rowCount) {
        module = await client.query(
          "INSERT INTO modules(course_id,title,description,order_index) VALUES($1,$2,$3,$4) RETURNING id",
          [course.rows[0].id, title, description, moduleOrder],
        );
      }
      for (const [lessonIndex, [lessonTitle, content, minutes]] of lessons.entries()) {
        const lessonOrder = lessonIndex + 1;
        await client.query(
          `INSERT INTO lessons(module_id,title,content,order_index,duration_minutes)
           SELECT $1,$2,$3,$4,$5 WHERE NOT EXISTS(
             SELECT 1 FROM lessons WHERE module_id=$1 AND order_index=$4 AND NOT archived
           )`,
          [module.rows[0].id, lessonTitle, content, lessonOrder, minutes],
        );
        const example = lessonExamples[slug]?.[moduleIndex]?.[lessonIndex];
        if (example) {
          const lesson = await client.query(
            "SELECT id,content FROM lessons WHERE module_id=$1 AND order_index=$2 AND NOT archived",
            [module.rows[0].id, lessonOrder],
          );
          if (lesson.rowCount && !lesson.rows[0].content.includes("EXAMPLES, SYNTAX & DIAGRAMS")) {
            await client.query(
              "UPDATE lessons SET content=$2 WHERE id=$1",
              [lesson.rows[0].id, `${lesson.rows[0].content || ""}\n\nEXAMPLES, SYNTAX & DIAGRAMS\n${example}`],
            );
          }
        }
        const reading = readingByCourse[slug]?.[moduleIndex] || [];
        if (reading.length) {
          const existing = await client.query(
            "SELECT id,resources FROM lessons WHERE module_id=$1 AND order_index=$2 AND NOT archived",
            [module.rows[0].id, lessonOrder],
          );
          if (existing.rowCount) {
            const resources = Array.isArray(existing.rows[0].resources)
              ? existing.rows[0].resources
              : [];
            const urls = new Set(resources.map((resource) => resource.url));
            const additions = reading.filter((resource) => !urls.has(resource.url));
            if (additions.length) {
              await client.query(
                "UPDATE lessons SET resources=$2::jsonb WHERE id=$1",
                [existing.rows[0].id, JSON.stringify([...resources, ...additions])],
              );
            }
          }
        }
      }
    }
  }
}

async function seedSupplementalLessonContent(client) {
  const marker = "EXAMPLES, SYNTAX & DIAGRAMS";
  const lessons = {
    "data-structures-algorithms::Arrays and indexing": {
      example: `const scores = [72, 88, 95];
console.log(scores[0]); // 72 (indexes start at zero)
scores[1] = 90;

index:   0   1   2
value: [72, 90, 95]`,
      resource: { title: "Array Data Structure — GeeksforGeeks", url: "https://www.geeksforgeeks.org/dsa/array-data-structure-guide/" },
    },
    "data-structures-algorithms::String fundamentals": {
      example: `const course = "CloudCampus";
console.log(course.length); // 11
console.log(course.slice(0, 5)); // Cloud

String operations: text → inspect / slice / search → new result
Strings are immutable in JavaScript; methods return a result rather than changing the original.`,
      resource: { title: "Strings in Data Structure — GeeksforGeeks", url: "https://www.geeksforgeeks.org/dsa/string-data-structure/" },
    },
    "data-structures-algorithms::Big-O notation": {
      example: `// One pass: work grows with n → O(n)
for (const item of items) console.log(item);

// Nested passes: roughly n × n checks → O(n²)
for (const a of items) {
  for (const b of items) compare(a, b);
}

input size n → O(1) constant | O(n) linear | O(n²) quadratic`,
      resource: { title: "Analysis of Algorithms: Big-O Analysis — GeeksforGeeks", url: "https://www.geeksforgeeks.org/dsa/analysis-algorithms-big-o-analysis/" },
    },
    "database-management-systems::Tables and primary keys": {
      example: `CREATE TABLE students (
  student_id INTEGER PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE
);

table → rows (students) → columns (id, name, email)
Primary key: unique for each row and never NULL.`,
      resource: { title: "DBMS Tutorial — GeeksforGeeks", url: "https://www.geeksforgeeks.org/dbms/dbms/" },
    },
    "database-management-systems::SELECT and WHERE": {
      example: `SELECT full_name, email
FROM students
WHERE active = TRUE
ORDER BY full_name;

FROM → choose table; WHERE → filter rows; SELECT → return columns; ORDER BY → sort results.`,
      resource: { title: "SQL Tutorial — GeeksforGeeks", url: "https://www.geeksforgeeks.org/sql-tutorial/" },
    },
    "java-programming::Variables and types": {
      example: `int completedLessons = 4;
double progress = 0.65;
boolean isEnrolled = true;
String studentName = "Asha";

type variableName = value;
Primitive examples: int, double, boolean. String is a reference type.`,
      resource: { title: "Java Programming Language — GeeksforGeeks", url: "https://www.geeksforgeeks.org/java/java/" },
    },
    "java-programming::Encapsulation": {
      example: `class Course {
  private String title;
  public String getTitle() { return title; }
  public void setTitle(String value) {
    if (value != null && !value.isBlank()) title = value;
  }
}

caller → public method → validation → private field`,
      resource: { title: "Object-Oriented Programming (OOPs) Concept in Java — GeeksforGeeks", url: "https://www.geeksforgeeks.org/java/object-oriented-programming-oops-concept-in-java/" },
    },
    "operating-systems::Processes and threads": {
      example: `Process A: [address space | files | resources]
                 ├── Thread 1: task / registers
                 └── Thread 2: task / registers
Process B: [separate address space | resources]

Threads in one process share its memory; separate processes are isolated by the OS.`,
      resource: { title: "Processes in Operating System — GeeksforGeeks", url: "https://www.geeksforgeeks.org/operating-systems/processes-in-operating-system/" },
    },
    "operating-systems::CPU scheduling": {
      example: `Jobs arrive in order: A needs 3 units, B needs 2 units.
FCFS timeline: 0 |--- A ---| 3 |-- B --| 5
Waiting: A = 0, B = 3; average waiting = (0 + 3) / 2 = 1.5 units.

Ready queue → scheduler selects job → CPU runs it → completion or preemption`,
      resource: { title: "CPU Scheduling in Operating Systems — GeeksforGeeks", url: "https://www.geeksforgeeks.org/operating-systems/cpu-scheduling-in-operating-systems/" },
    },
    "operating-systems::Virtual memory and paging": {
      example: `Virtual address = [page number | offset]
page number → page table → frame number
physical address = [frame number | same offset]

If the page is absent: page fault → OS loads page → update table → retry instruction.`,
      resource: { title: "Virtual Memory in Operating System — GeeksforGeeks", url: "https://www.geeksforgeeks.org/operating-systems/virtual-memory-in-operating-system/" },
    },
    "operating-systems::Race conditions and deadlocks": {
      example: `Race: two threads read count=0 → both add 1 → both write 1
Expected count=2; actual count may be 1. Protect the read-modify-write with a lock.

Deadlock cycle: Thread A holds Lock 1 → waits for Lock 2
               Thread B holds Lock 2 → waits for Lock 1
Use a consistent lock order or release locks when waiting.`,
      resource: { title: "Deadlock in Operating System — GeeksforGeeks", url: "https://www.geeksforgeeks.org/operating-systems/introduction-of-deadlock-in-operating-system/" },
    },
    "python-foundations::Values, types and variables": {
      example: `student_name: str = "Mina"
completed: int = 3
progress: float = 0.5
is_active: bool = True
print(f"{student_name}: {completed} lessons")

name = value assigns a value; type(value) reports its current type.`,
      resource: { title: "Python Tutorial — GeeksforGeeks", url: "https://www.geeksforgeeks.org/python/python-programming-language-tutorial/" },
    },
    "python-foundations::Control flow and functions": {
      example: `def study_message(minutes):
    if minutes >= 25:
        return "Great focused session!"
    return "Try one more short session."

input → if condition → matching branch → return result`,
      resource: { title: "Python Functions — GeeksforGeeks", url: "https://www.geeksforgeeks.org/python/python-functions/" },
    },
    "python-foundations::Collections and iteration": {
      example: `topics = ["lists", "loops", "functions"]
done = {"lists"}
minutes = {"lists": 20, "loops": 15}
for topic in topics:
    print(topic, topic in done)

list: ordered values | set: unique values | dict: key → value`,
      resource: { title: "Python Data Structures — GeeksforGeeks", url: "https://www.geeksforgeeks.org/python/python-data-structures/" },
    },
    "python-foundations::Exceptions and file handling": {
      example: `try:
    with open("notes.txt", encoding="utf-8") as file:
        notes = file.read()
except FileNotFoundError:
    notes = "No saved notes yet."

open → read → close automatically (with) | handle expected error (except)`,
      resource: { title: "File Handling in Python — GeeksforGeeks", url: "https://www.geeksforgeeks.org/python/file-handling-python/" },
    },
    "web-development-fundamentals::Semantic HTML": {
      example: `<header><h1>CloudCampus</h1></header>
<nav aria-label="Main"><a href="/courses">Courses</a></nav>
<main><article><h2>Study plan</h2><p>Start here.</p></article></main>
<footer>Learn beyond limits</footer>

page → header + navigation + main content + footer`,
      resource: { title: "HTML5 Semantics — GeeksforGeeks", url: "https://www.geeksforgeeks.org/html/html5-semantics/" },
    },
    "web-development-fundamentals::JavaScript functions": {
      example: `function formatProgress(done, total) {
  return total === 0 ? "0%" : Math.round(done / total * 100) + "%";
}
const label = formatProgress(3, 4); // "75%"
const double = value => value * 2;

arguments → function body → return value → caller`,
      resource: { title: "JavaScript Tutorial — GeeksforGeeks", url: "https://www.geeksforgeeks.org/javascript/javascript-tutorial/" },
    },
  };

  for (const [key, item] of Object.entries(lessons)) {
    const splitAt = key.indexOf("::");
    const slug = key.slice(0, splitAt);
    const title = key.slice(splitAt + 2);
    const result = await client.query(
      `SELECT l.id,l.content,l.resources FROM lessons l
       JOIN modules m ON m.id=l.module_id JOIN courses c ON c.id=m.course_id
       WHERE c.slug=$1 AND l.title=$2 AND NOT c.archived AND NOT m.archived AND NOT l.archived`,
      [slug, title],
    );
    for (const lesson of result.rows) {
      if (!String(lesson.content || "").includes(marker)) {
        await client.query("UPDATE lessons SET content=$2 WHERE id=$1", [
          lesson.id,
          `${lesson.content || ""}\n\n${marker}\n${item.example}`,
        ]);
      }
      const outdatedUrls = new Set([
        "https://www.geeksforgeeks.org/dsa/array-data-structure/",
        "https://www.geeksforgeeks.org/sql/sql-tutorial/",
        "https://www.geeksforgeeks.org/javascript/javascript-functions/",
      ]);
      const currentResources = Array.isArray(lesson.resources) ? lesson.resources : [];
      const resources = currentResources.filter((resource) => !outdatedUrls.has(resource.url));
      if (resources.length !== currentResources.length || !resources.some((resource) => resource.url === item.resource.url)) {
        await client.query("UPDATE lessons SET resources=$2::jsonb WHERE id=$1", [
          lesson.id,
          JSON.stringify([...resources, item.resource]),
        ]);
      }
    }
  }
}

(async () => {
  if (mode === "migrate") {
    for (const name of fs
      .readdirSync(path.join(__dirname, "../db/migrations"))
      .sort()) {
      if (name.endsWith(".sql"))
        await db.query(
          fs.readFileSync(
            path.join(__dirname, "../db/migrations", name),
            "utf8",
          ),
        );
    }
  } else if (mode === "seed") {
    await db.transaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(684231002)");
      // Strip each file's transaction wrapper so both seed sets share one lock and transaction.
      for (const file of ["seed.sql", "content.sql"])
        await client.query(
          fs
            .readFileSync(path.join(__dirname, "../db", file), "utf8")
            .replace(/^BEGIN;\s*/, "")
            .replace(/COMMIT;\s*$/, ""),
        );
    });
    await db.transaction(async (client) => {
      await client.query("SELECT pg_advisory_xact_lock(684231002)");
      await seedCurriculum(client);
      await seedSupplementalLessonContent(client);
    });
  } else
    throw new Error(
      "Use migrate or seed. Restore schema.sql with psql only into a new empty database.",
    );
  console.log("Database operation completed.");
})()
  .catch((error) => {
    console.error("Database operation failed:", error.code || error.message);
    process.exitCode = 1;
  })
  .finally(() => db.pool.end());
