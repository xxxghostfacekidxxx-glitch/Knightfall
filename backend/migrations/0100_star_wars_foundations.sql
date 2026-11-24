INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Jedi foundations I: emotion, awareness and meditation','jedi-foundations-emotion','The Jedi tradition distinguishes experiencing emotion from allowing it to dictate action. Fear can reveal danger, grief can reveal attachment, and anger can reveal perceived injustice. None automatically supplies a sound decision.

Practice: observe a feeling, name its cause, consider alternative interpretations, and choose a response consistent with compassion. Meditation in Star Wars is a fictional Force discipline; ordinary reflective practice does not grant supernatural abilities.

Lore study: compare Yoda''s instruction in The Empire Strikes Back with Anakin''s struggles in Revenge of the Sith.
Discussion: when does emotional restraint become emotional avoidance?',0 FROM categories c CROSS JOIN users u WHERE c.slug='jedi-temple' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Jedi foundations II: knowledge, humility and discernment','jedi-foundations-knowledge','Knowledge is not merely collecting information. A Jedi must recognize uncertainty, seek evidence, listen to disagreement and revise mistaken judgments. Institutional authority does not guarantee wisdom.

Study the Jedi Council''s failure to recognize the political manipulation surrounding the Clone Wars. Distinguish what characters knew at the time from what viewers know afterward.

Exercise: identify a belief, the evidence supporting it, and what would change your mind.
Discussion: how can an order preserve tradition without becoming dogmatic?',0 FROM categories c CROSS JOIN users u WHERE c.slug='jedi-temple' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Jedi foundations III: compassion, attachment and loss','jedi-foundations-compassion','Compassion concerns another person''s welfare; possessiveness treats another person as something one must retain. The distinction matters in Anakin''s story, where fear of loss becomes a justification for destructive choices.

Compare the prequel Order''s restrictions on attachment with Luke''s concern for his father in Return of the Jedi. Neither emotional suppression nor unlimited attachment is a complete ethical answer.

Exercise: describe how to support someone while respecting their independence.
Discussion: could the Jedi have taught healthier ways of grieving?',0 FROM categories c CROSS JOIN users u WHERE c.slug='jedi-temple' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Jedi history: institutions, war and reform','jedi-history-reform','Study the Jedi as an institution rather than an infallible ideal. Their role in the Republic created tensions between spiritual independence, public service and political obligation. During the Clone Wars, peacekeepers became military commanders.

Compare the prequel trilogy, The Clone Wars, and Luke''s later reflections in The Last Jedi. Separate canon events from interpretation and Legends material.

Discussion: what safeguards would prevent a peacekeeping order from becoming an instrument of political power?',0 FROM categories c CROSS JOIN users u WHERE c.slug='jedi-temple' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Sith foundations I: passion and disciplined ambition','sith-foundations-passion','The fictional Sith treat passion as a source of power, contrasting with Jedi restraint. Passion can motivate study, creation and perseverance, but intense desire does not make an objective justified.

Distinguish motivation from compulsion: a disciplined person can revise a goal when its costs become unacceptable. Sith characters often fail this test.

Exercise: choose a constructive goal, define measurable progress and identify boundaries you will not violate.
Lore study: compare Anakin''s motivations in Revenge of the Sith with Sidious''s pursuit of political control.',0 FROM categories c CROSS JOIN users u WHERE c.slug='order-of-the-sith' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Sith foundations II: strength, power and freedom','sith-foundations-agency','Strength can mean competence, resilience or self-control. Power can mean the capacity to act, but in Sith lore it often becomes domination. Freedom achieved by enslaving others is a contradiction worth examining.

Study the difference between Vader''s formidable abilities and his dependence on his master. His position illustrates how acquiring power does not necessarily produce autonomy.

Exercise: identify a limitation you can address through learning or practice without violating another person''s autonomy.
Discussion: when does ambition become another form of captivity?',0 FROM categories c CROSS JOIN users u WHERE c.slug='order-of-the-sith' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Sith history: Darth Bane and the Rule of Two','sith-history-bane','The Rule of Two concentrates Sith succession around a master and apprentice. Its fictional logic is that rivalry and succession prevent a large order from destroying itself through internal conflict. It also creates incentives for secrecy, betrayal and unstable leadership.

Canon reference: The Clone Wars, Sacrifice. Legends reference: Drew Karpyshyn''s Darth Bane trilogy. These continuities should not be treated as interchangeable.

Discussion: does a system built around betrayal select for wisdom or merely survival? Compare it with cooperative institutions.',0 FROM categories c CROSS JOIN users u WHERE c.slug='order-of-the-sith' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Sith history: Vader, Sidious and the cost of victory','sith-history-vader','Sidious''s rise demonstrates the difference between gaining authority and earning legitimacy. Vader''s arc illustrates the cost of pursuing control over loss: his choices destroy much of what he intended to protect.

Compare Revenge of the Sith and Return of the Jedi. Examine the role of fear, loyalty, coercion and the possibility of rejecting a destructive identity.

Discussion: is Vader''s final choice a rejection of Sith philosophy, an assertion of agency, or both? Support interpretations with scenes rather than invented quotations.',0 FROM categories c CROSS JOIN users u WHERE c.slug='order-of-the-sith' AND u.username='knightfall' AND u.role='god';