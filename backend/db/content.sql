BEGIN;
INSERT INTO courses(title,slug,description,category,difficulty,published) VALUES ('Python Foundations','python-foundations','Learn Python types, functions, collections, errors and safe data handling.','Programming','Beginner',true),('Operating Systems','operating-systems','Understand processes, scheduling, virtual memory and synchronization.','Computer Science','Intermediate',true) ON CONFLICT(slug) DO NOTHING;
INSERT INTO modules(course_id,title,description,order_index) SELECT id,'Python Basics','Python Basics learning module',1 FROM courses c WHERE slug='python-foundations' AND NOT EXISTS(SELECT 1 FROM modules m WHERE m.course_id=c.id AND m.title='Python Basics');
INSERT INTO lessons(module_id,title,content,order_index,duration_minutes) SELECT m.id,'Values, types and variables','Python names refer to values. Common types include int, float, str, bool, list and dict. Use type(value) when exploring unfamiliar input. A variable can be rebound to a different type; clear naming and validation keep this flexibility manageable.

Example:
count = 3
price = 2.5
total = count * price
print(total)  # 7.5

Strings are immutable. Lists are mutable sequences. Avoid modifying a list while iterating over it unless the behavior is deliberate. None represents an absent value and is distinct from zero or an empty string.

Practice: create a list of three course names, print its length and first item, then append another name. Explain how indexing differs from slicing. Check the empty-list case before accessing item zero.',1,20 FROM modules m JOIN courses c ON c.id=m.course_id WHERE c.slug='python-foundations' AND m.title='Python Basics' AND NOT EXISTS(SELECT 1 FROM lessons l WHERE l.module_id=m.id AND l.title='Values, types and variables');
INSERT INTO modules(course_id,title,description,order_index) SELECT id,'Python Basics','Python Basics learning module',1 FROM courses c WHERE slug='python-foundations' AND NOT EXISTS(SELECT 1 FROM modules m WHERE m.course_id=c.id AND m.title='Python Basics');
INSERT INTO lessons(module_id,title,content,order_index,duration_minutes) SELECT m.id,'Control flow and functions','Use if/elif/else for branching, for to traverse an iterable and while when continuation depends on a condition. Indentation defines blocks. Prefer explicit, small functions that return values rather than changing unrelated state.

Example:
def passed(score, minimum=60):
    if not 0 <= score <= 100:
        raise ValueError("Score must be 0 to 100")
    return score >= minimum

print(passed(75))  # True

Default argument values are evaluated once when a function is defined. Avoid a mutable list or dictionary as a default; use None and allocate inside the function. Test boundaries such as 59, 60 and 100, and rejected inputs such as -1.

Practice: implement count_even(values) and check it with an empty list, all odd values, negative values and repeated values. Explain the time complexity of one complete traversal.',2,20 FROM modules m JOIN courses c ON c.id=m.course_id WHERE c.slug='python-foundations' AND m.title='Python Basics' AND NOT EXISTS(SELECT 1 FROM lessons l WHERE l.module_id=m.id AND l.title='Control flow and functions');
INSERT INTO modules(course_id,title,description,order_index) SELECT id,'Working with Data','Working with Data learning module',2 FROM courses c WHERE slug='python-foundations' AND NOT EXISTS(SELECT 1 FROM modules m WHERE m.course_id=c.id AND m.title='Working with Data');
INSERT INTO lessons(module_id,title,content,order_index,duration_minutes) SELECT m.id,'Collections and iteration','A list preserves sequence order, a set stores distinct elements, and a dictionary maps keys to values. Dictionary keys must be hashable. Choose the structure that matches the operation rather than forcing every problem into a list.

Example:
counts = {}
for topic in ["SQL", "Python", "SQL"]:
    counts[topic] = counts.get(topic, 0) + 1
print(counts["SQL"])  # 2

List membership requires checking elements; dictionary and set membership typically offer constant average time. Iterating over n records still takes linear time. A comprehension is useful when the transformation is simple enough to read at a glance.

Practice: count words in a sentence after normalizing case. Decide whether punctuation should be removed and document that decision. Compare outputs for an empty sentence and repeated words.',1,20 FROM modules m JOIN courses c ON c.id=m.course_id WHERE c.slug='python-foundations' AND m.title='Working with Data' AND NOT EXISTS(SELECT 1 FROM lessons l WHERE l.module_id=m.id AND l.title='Collections and iteration');
INSERT INTO modules(course_id,title,description,order_index) SELECT id,'Working with Data','Working with Data learning module',2 FROM courses c WHERE slug='python-foundations' AND NOT EXISTS(SELECT 1 FROM modules m WHERE m.course_id=c.id AND m.title='Working with Data');
INSERT INTO lessons(module_id,title,content,order_index,duration_minutes) SELECT m.id,'Exceptions and file handling','Exceptions report exceptional failures. Catch the specific errors you can handle and allow unexpected failures to reach a central handler. Avoid broad except blocks that silently hide mistakes. Use a context manager to release file resources.

Example:
try:
    with open("notes.txt", encoding="utf-8") as handle:
        notes = handle.read()
except FileNotFoundError:
    notes = "No notes saved yet."

Do not accept an arbitrary filesystem path from a web request. A server should choose the storage directory and validate access to each stored file. Never print credentials in exception messages.

Practice: write a function that converts a supplied string to an integer and returns a clear error for invalid input. Test whitespace, a negative number, an empty string and text. Explain why input validation belongs at the application boundary.',2,20 FROM modules m JOIN courses c ON c.id=m.course_id WHERE c.slug='python-foundations' AND m.title='Working with Data' AND NOT EXISTS(SELECT 1 FROM lessons l WHERE l.module_id=m.id AND l.title='Exceptions and file handling');
INSERT INTO modules(course_id,title,description,order_index) SELECT id,'Processes and Scheduling','Processes and Scheduling learning module',1 FROM courses c WHERE slug='operating-systems' AND NOT EXISTS(SELECT 1 FROM modules m WHERE m.course_id=c.id AND m.title='Processes and Scheduling');
INSERT INTO lessons(module_id,title,content,order_index,duration_minutes) SELECT m.id,'Processes and threads','A process is a running program with resources such as an address space and open files. A thread is an execution path within a process. Threads usually share their process memory, so shared state needs coordination.

Processes move between states such as ready, running and waiting. A CPU scheduler chooses a ready process. Waiting for I/O does not require the CPU to execute that process continuously. A context switch saves and restores execution state and has a cost.

Concurrency means multiple tasks can make progress over overlapping periods. Parallelism means tasks actually execute at the same time on separate execution resources. An event loop can support concurrency even when one thread executes JavaScript callbacks.

Practice: describe a web request that waits for a database query. Identify the work performed by Node.js, the operating system and PostgreSQL. Explain why a CPU-intensive loop can delay unrelated requests.',1,20 FROM modules m JOIN courses c ON c.id=m.course_id WHERE c.slug='operating-systems' AND m.title='Processes and Scheduling' AND NOT EXISTS(SELECT 1 FROM lessons l WHERE l.module_id=m.id AND l.title='Processes and threads');
INSERT INTO modules(course_id,title,description,order_index) SELECT id,'Processes and Scheduling','Processes and Scheduling learning module',1 FROM courses c WHERE slug='operating-systems' AND NOT EXISTS(SELECT 1 FROM modules m WHERE m.course_id=c.id AND m.title='Processes and Scheduling');
INSERT INTO lessons(module_id,title,content,order_index,duration_minutes) SELECT m.id,'CPU scheduling','Scheduling policies balance turnaround time, response time, throughput and fairness. First-come-first-served follows arrival order. Shortest-job-first favors short tasks when execution duration can be estimated. Round-robin allocates a time quantum to each ready task.

Example: three jobs with bursts 5, 2 and 1 arrive together. FCFS in that order gives waits 0, 5 and 7. If shortest-job-first runs 1, 2, 5, waits are 0, 1 and 3. Compare averages and explain how long jobs can be delayed by a continual stream of short jobs.

A very small quantum increases switching overhead. A very large quantum approaches FCFS behavior. Real schedulers consider priorities and interactive responsiveness; a classroom policy is a useful model, not a complete description of every operating system.

Practice: simulate round-robin for bursts 5, 3 and 2 with quantum 2. Record each interval and calculate waiting and turnaround time.',2,20 FROM modules m JOIN courses c ON c.id=m.course_id WHERE c.slug='operating-systems' AND m.title='Processes and Scheduling' AND NOT EXISTS(SELECT 1 FROM lessons l WHERE l.module_id=m.id AND l.title='CPU scheduling');
INSERT INTO modules(course_id,title,description,order_index) SELECT id,'Memory and Synchronization','Memory and Synchronization learning module',2 FROM courses c WHERE slug='operating-systems' AND NOT EXISTS(SELECT 1 FROM modules m WHERE m.course_id=c.id AND m.title='Memory and Synchronization');
INSERT INTO lessons(module_id,title,content,order_index,duration_minutes) SELECT m.id,'Virtual memory and paging','Virtual memory gives each process a logical address space. Address translation maps virtual pages to physical frames. A page table records mappings and permissions. A translation lookaside buffer caches recent translations.

A page fault occurs when an access cannot be resolved by the current mapping; the operating system may load a page or reject the access. Too many page faults can dominate execution time. Thrashing describes excessive paging that leaves little useful progress.

Example: with 4 KB pages, a virtual address can be viewed as a page number plus a 12-bit offset. Translation changes the page mapping while preserving the offset within the page.

Practice: for a simple reference string, compare FIFO and LRU replacement with three frames. Count faults step by step and distinguish a cache miss from an invalid memory access.',1,20 FROM modules m JOIN courses c ON c.id=m.course_id WHERE c.slug='operating-systems' AND m.title='Memory and Synchronization' AND NOT EXISTS(SELECT 1 FROM lessons l WHERE l.module_id=m.id AND l.title='Virtual memory and paging');
INSERT INTO modules(course_id,title,description,order_index) SELECT id,'Memory and Synchronization','Memory and Synchronization learning module',2 FROM courses c WHERE slug='operating-systems' AND NOT EXISTS(SELECT 1 FROM modules m WHERE m.course_id=c.id AND m.title='Memory and Synchronization');
INSERT INTO lessons(module_id,title,content,order_index,duration_minutes) SELECT m.id,'Race conditions and deadlocks','A race condition occurs when correctness depends on the timing of concurrent operations. An increment often includes read, calculate and write steps; two concurrent increments can lose an update. A critical section protects shared state with coordination appropriate to the environment.

Deadlock requires a set of tasks to wait indefinitely for one another. The classic conditions are mutual exclusion, hold-and-wait, no preemption and circular wait. A consistent lock order can prevent circular wait.

Database example: awarding XP and marking a lesson complete should occur in one transaction. A unique reward claim prevents two requests from awarding the same milestone twice. A row lock coordinates updates for one account; unrelated accounts can still progress.

Practice: draw an execution schedule that loses one increment, then show how a lock changes it. Explain the difference between a deadlock, starvation and a slow query.',2,20 FROM modules m JOIN courses c ON c.id=m.course_id WHERE c.slug='operating-systems' AND m.title='Memory and Synchronization' AND NOT EXISTS(SELECT 1 FROM lessons l WHERE l.module_id=m.id AND l.title='Race conditions and deadlocks');
INSERT INTO quizzes(course_id,title,description,difficulty,passing_percentage) SELECT c.id,'Python Foundations Assessment','Final assessment','Beginner',60 FROM courses c WHERE slug='python-foundations' AND NOT EXISTS(SELECT 1 FROM quizzes q WHERE q.course_id=c.id AND q.title='Python Foundations Assessment');
INSERT INTO questions(quiz_id,question_text,question_type,options,correct_answer,points,question_order) SELECT q.id,'Which value should replace a mutable default argument?','mcq','["None","An empty list","A global dictionary","An empty set"]'::jsonb,'None',1,1 FROM quizzes q WHERE q.title='Python Foundations Assessment' AND NOT EXISTS(SELECT 1 FROM questions x WHERE x.quiz_id=q.id AND x.question_text='Which value should replace a mutable default argument?');
INSERT INTO quizzes(course_id,title,description,difficulty,passing_percentage) SELECT c.id,'Operating Systems Assessment','Final assessment','Beginner',60 FROM courses c WHERE slug='operating-systems' AND NOT EXISTS(SELECT 1 FROM quizzes q WHERE q.course_id=c.id AND q.title='Operating Systems Assessment');
INSERT INTO questions(quiz_id,question_text,question_type,options,correct_answer,points,question_order) SELECT q.id,'Which technique helps prevent circular wait?','mcq','["A consistent lock order","Increasing all timeouts","Disabling transactions","Ignoring thread state"]'::jsonb,'A consistent lock order',1,1 FROM quizzes q WHERE q.title='Operating Systems Assessment' AND NOT EXISTS(SELECT 1 FROM questions x WHERE x.quiz_id=q.id AND x.question_text='Which technique helps prevent circular wait?');
INSERT INTO achievements(code,name,description,xp_reward) VALUES('interview_ready','Interview Ready','Complete a self-assessed mock interview.',0) ON CONFLICT(name) DO UPDATE SET code=EXCLUDED.code;
COMMIT;
