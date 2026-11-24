INSERT OR IGNORE INTO categories(name,slug,description,sort_order) VALUES ('Jedi Temple','jedi-temple','Star Wars / Jedi philosophy, Code, lore and teachings.',20),('Order of the Sith','order-of-the-sith','Star Wars / Sith philosophy, Code, lore and teachings.',21);
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT id,1,'The Jedi Code: a guide to its meaning','jedi-code-guide','An original explanation of the fictional Jedi Code, not a verbatim quotation.

1. Recognize emotion without surrendering judgment to it.
2. Replace ignorance with learning and curiosity.
3. Practice restraint rather than being ruled by desire.
4. Seek harmony amid disorder.
5. Accept mortality and the continuity of the Force.

The Jedi ideal is service, compassion and disciplined action. Discuss how these principles can conflict with attachment and institutional rules.',1 FROM categories WHERE slug='jedi-temple';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT id,1,'Jedi teachings: the path of the guardian','jedi-guardian-teachings','Lesson 1: Mindfulness and awareness of the Force.
Lesson 2: Compassion, mercy and service to others.
Lesson 3: Courage without aggression; defense as a last resort.
Lesson 4: Knowledge, humility and questioning assumptions.
Lesson 5: Attachment, grief and accepting change without denying emotion.
Lesson 6: The responsibilities of a Padawan, Knight and Master.

Study discussion: Where did the Jedi Order fall short of its own ideals? Compare the prequel films, The Clone Wars and the original trilogy.',1 FROM categories WHERE slug='jedi-temple';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT id,1,'The Sith Code: a guide to its meaning','sith-code-guide','An original explanation of the fictional Sith Code, not a verbatim quotation.

1. Reject complacency and acknowledge conflict.
2. Treat passion as a source of motivation.
3. Develop strength through deliberate effort.
4. Convert strength into agency and influence.
5. Pursue achievement as a means of overcoming limitations.
6. Seek liberation through mastery of the Force.

In Star Wars, this philosophy frequently leads to domination and destructive ambition. Discuss the distinction between self-mastery and controlling others.',1 FROM categories WHERE slug='order-of-the-sith';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT id,1,'Sith teachings: ambition, power and consequences','sith-path-teachings','Lesson 1: Passion and the dark side in fictional lore.
Lesson 2: Ambition, discipline and self-overcoming.
Lesson 3: The difference between personal agency and coercion.
Lesson 4: Darth Bane and the Rule of Two; master-apprentice rivalry.
Lesson 5: The cost of obsession, betrayal and fear of loss.
Lesson 6: Compare Vader, Sidious and other Sith across canon and Legends.

Discussion: Can ambition exist without cruelty? These are fictional lore studies, not instructions to harm or dominate real people.',1 FROM categories WHERE slug='order-of-the-sith';