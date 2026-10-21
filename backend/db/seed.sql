BEGIN;
INSERT INTO courses(title,slug,description,category,difficulty,published) SELECT v.* FROM (VALUES
('Data Structures & Algorithms','data-structures-algorithms','Build problem-solving skills with arrays, strings, linked lists, stacks, queues and algorithmic thinking.','Computer Science','Beginner',true),
('Database Management Systems','database-management-systems','Learn relational database concepts, SQL, normalization, transactions and indexing.','Computer Science','Beginner',true),
('Java Programming','java-programming','Learn core Java, object-oriented programming, collections and exception handling.','Programming','Beginner',true),
('Web Development Fundamentals','web-development-fundamentals','Build a foundation in HTML, CSS, JavaScript and HTTP APIs.','Web Development','Beginner',true)
) AS v(title,slug,description,category,difficulty,published) WHERE NOT EXISTS(SELECT 1 FROM courses c WHERE (c.slug=v.slug OR c.slug=CASE v.slug WHEN 'data-structures-algorithms' THEN 'dsa' WHEN 'database-management-systems' THEN 'dbms' WHEN 'java-programming' THEN 'java' WHEN 'web-development-fundamentals' THEN 'web-development' ELSE v.slug END) OR lower(c.title)=lower(v.title)) ON CONFLICT(slug) DO NOTHING;
INSERT INTO modules(course_id,title,description,order_index)
SELECT c.id,v.title,v.description,v.order_index FROM courses c JOIN (VALUES
 ('data-structures-algorithms','Arrays and Strings','Core linear data structures',1),
 ('data-structures-algorithms','Algorithm Analysis','Time and space complexity',2),
 ('database-management-systems','Relational Database Basics','Tables, keys and relationships',1),
 ('database-management-systems','SQL and Joins','Query and combine relational data',2),
 ('java-programming','Java Foundations','Syntax, types and control flow',1),
 ('java-programming','Object-Oriented Programming','Classes, inheritance and interfaces',2),
 ('web-development-fundamentals','HTML and CSS','Semantic markup and responsive styling',1),
 ('web-development-fundamentals','JavaScript Basics','Variables, functions and DOM fundamentals',2)
) AS v(slug,title,description,order_index) ON NOT c.archived AND (c.slug=v.slug OR c.slug=CASE v.slug WHEN 'data-structures-algorithms' THEN 'dsa' WHEN 'database-management-systems' THEN 'dbms' WHEN 'java-programming' THEN 'java' WHEN 'web-development-fundamentals' THEN 'web-development' ELSE v.slug END)
WHERE NOT EXISTS(SELECT 1 FROM modules x WHERE x.course_id=c.id AND x.order_index=v.order_index);
INSERT INTO lessons(module_id,title,content,order_index,duration_minutes)
SELECT m.id,v.title,v.content,v.order_index,v.minutes FROM modules m JOIN courses c ON c.id=m.course_id JOIN (VALUES
 ('data-structures-algorithms',1,'Arrays and indexing','An array stores elements in contiguous indexed positions. Access by index is typically O(1); inserting in the middle can require shifting elements.',1,15),
 ('data-structures-algorithms',1,'String fundamentals','Strings represent sequences of characters. Common operations include traversal, comparison, substring extraction and frequency counting.',2,15),
 ('data-structures-algorithms',2,'Big-O notation','Big-O describes an upper bound on how an algorithm scales with input size. Compare constant, logarithmic, linear, linearithmic and quadratic growth.',1,20),
 ('database-management-systems',1,'Tables and primary keys','A relational table stores rows and columns. A primary key uniquely identifies each row and should be stable and non-null.',1,15),
 ('database-management-systems',2,'SELECT and WHERE','SELECT chooses columns and WHERE filters rows. Parameterize values in application queries rather than concatenating user input.',1,15),
 ('java-programming',1,'Variables and types','Java is statically typed. Declare variables with a type and choose primitives or reference types based on the data model.',1,15),
 ('java-programming',2,'Encapsulation','Encapsulation protects object state behind a public interface. Use access modifiers and methods to enforce class invariants.',1,20),
 ('web-development-fundamentals',1,'Semantic HTML','Use semantic elements such as main, nav, section and button to communicate structure and improve accessibility.',1,15),
 ('web-development-fundamentals',2,'JavaScript functions','Functions package reusable behavior. Prefer clear parameters, explicit return values and small single-purpose functions.',1,15)
) AS v(course_slug,module_order,title,content,order_index,minutes) ON NOT c.archived AND (c.slug=v.course_slug OR c.slug=CASE v.course_slug WHEN 'data-structures-algorithms' THEN 'dsa' WHEN 'database-management-systems' THEN 'dbms' WHEN 'java-programming' THEN 'java' WHEN 'web-development-fundamentals' THEN 'web-development' ELSE v.course_slug END) AND m.order_index=v.module_order
WHERE NOT EXISTS(SELECT 1 FROM lessons x WHERE x.module_id=m.id AND x.order_index=v.order_index);
INSERT INTO quizzes(course_id,module_id,title,description,difficulty,passing_percentage)
SELECT c.id,m.id,v.title,v.description,'Beginner',60 FROM (VALUES
 ('data-structures-algorithms',1,'Arrays Quick Check','Check your understanding of arrays and indexing.'),
 ('database-management-systems',1,'Relational Basics Quiz','Check primary key and relational table fundamentals.'),
 ('java-programming',1,'Java Foundations Quiz','Review Java typing fundamentals.'),
 ('web-development-fundamentals',1,'HTML Basics Quiz','Review semantic HTML fundamentals.')
) AS v(slug,order_index,title,description) JOIN courses c ON NOT c.archived AND (c.slug=v.slug OR c.slug=CASE v.slug WHEN 'data-structures-algorithms' THEN 'dsa' WHEN 'database-management-systems' THEN 'dbms' WHEN 'java-programming' THEN 'java' WHEN 'web-development-fundamentals' THEN 'web-development' ELSE v.slug END) JOIN modules m ON m.course_id=c.id AND m.order_index=v.order_index
WHERE NOT EXISTS(SELECT 1 FROM quizzes q WHERE q.course_id=c.id AND q.title=v.title);
INSERT INTO questions(quiz_id,question_text,question_type,options,correct_answer,explanation,points,question_order)
SELECT q.id,v.question,'mcq',v.options::jsonb,trim(both '"' from v.answer),v.explanation,1,v.ord FROM quizzes q JOIN (VALUES
 ('Arrays Quick Check','What is the typical time complexity of accessing an array element by index?','["O(1)","O(log n)","O(n)","O(n²)"]','"O(1)"','Direct indexing is constant time for a conventional array.',1),
 ('Arrays Quick Check','Which operation can require shifting multiple array elements?','["Read by index","Insert at the beginning","Read array length","Update an existing index"]','"Insert at the beginning"','Elements may need to shift to make room at the start.',2),
 ('Relational Basics Quiz','Which property should a primary key have?','["It can duplicate values","It uniquely identifies each row","It must contain text","It can be NULL"]','"It uniquely identifies each row"','A primary key uniquely identifies a row and cannot be NULL.',1),
 ('Relational Basics Quiz','Which SQL clause filters rows?','["ORDER BY","GROUP BY","WHERE","SELECT"]','"WHERE"','WHERE filters rows before grouping and ordering.',2),
 ('Java Foundations Quiz','Which statement best describes Java?','["Dynamically typed only","Statically typed","Markup language","Database engine"]','"Statically typed"','Java checks declared types as part of compilation.',1),
 ('HTML Basics Quiz','Which element is most appropriate for the main page content?','["<div>","<main>","<span>","<i>"]','"<main>"','The main element identifies the dominant content of the document.',1)
) AS v(quiz_title,question,options,answer,explanation,ord) ON q.title=v.quiz_title
WHERE NOT EXISTS(SELECT 1 FROM questions x WHERE x.quiz_id=q.id AND x.question_text=v.question);
INSERT INTO coding_problems(title,slug,category,difficulty,statement,examples,constraints,starter_code) SELECT v.title,v.slug,v.category,v.difficulty,v.statement,v.examples::jsonb,v.constraints,v.starter_code::jsonb FROM (VALUES
('Two Sum','two-sum','Arrays','Easy','Given an array of integers and a target, return the indices of two distinct elements whose sum equals the target.','[{"input":"nums = [2,7,11,15], target = 9","output":"[0,1]"}]','Exactly one solution exists; do not use the same element twice.','{"javascript":"function twoSum(nums, target) {\n  // Your code here\n}"}'),
('Reverse a String','reverse-a-string','Strings','Easy','Return the input string with its characters in reverse order.','[{"input":"campus","output":"supmac"}]','Input may be empty.','{"javascript":"function reverseString(value) {\n  // Your code here\n}"}')
) AS v(title,slug,category,difficulty,statement,examples,constraints,starter_code) WHERE NOT EXISTS(SELECT 1 FROM coding_problems p WHERE p.slug=v.slug OR lower(p.title)=lower(v.title)) ON CONFLICT(slug) DO NOTHING;
INSERT INTO interview_questions(category,difficulty,question,answer) SELECT v.category,v.difficulty,v.question,v.answer FROM (VALUES
 ('DBMS','Beginner','What is database normalization?','Normalization organizes relational data to reduce redundancy and update anomalies.'),
 ('DSA','Beginner','What is the difference between a stack and a queue?','A stack is LIFO; a queue is FIFO.'),
 ('Operating Systems','Beginner','What is a process?','A process is a program in execution with its own process state and resources.'),
 ('HR','Beginner','Tell me about a technical project you built.','Explain the problem, your contribution, design decisions, trade-offs and measurable outcome.')
) AS v(category,difficulty,question,answer) WHERE NOT EXISTS(SELECT 1 FROM interview_questions q WHERE q.question=v.question);
INSERT INTO projects(title,description,difficulty,technologies,requirements) SELECT v.title,v.description,v.difficulty,v.technologies::jsonb,v.requirements::jsonb FROM (VALUES
 ('Student Task Tracker','Build a task tracker with user accounts, task statuses, due dates and a progress summary.','Beginner','["HTML","CSS","JavaScript","Node.js","PostgreSQL"]','["Create and update tasks","Filter by status","Persist data in PostgreSQL","Document API endpoints"]'),
 ('Course Progress Dashboard','Build a dashboard that tracks enrolled courses, lesson completion and assessment scores.','Intermediate','["JavaScript","Express.js","PostgreSQL","Charting"]','["Model courses and lessons","Track completion","Calculate progress accurately","Provide responsive analytics"]')
) AS v(title,description,difficulty,technologies,requirements) WHERE NOT EXISTS(SELECT 1 FROM projects p WHERE p.title=v.title);
INSERT INTO achievements(code,name,description,xp_reward) VALUES
('first_lesson','First Lesson','Complete your first lesson.',10),('quiz_master','Quiz Master','Pass a quiz.',25),('first_project','First Project','Submit your first project.',50),('seven_day_streak','7-Day Streak','Maintain a seven-day learning streak.',50)
ON CONFLICT(name) DO UPDATE SET code=EXCLUDED.code;
COMMIT;
