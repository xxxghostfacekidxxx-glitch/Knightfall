INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Living Jedi ethics: commitments of the guardian','living-jedi-commitments','Original Knightfall proposal. A Jedi commits to seeking truth before certainty, practicing compassion without surrendering judgment, protecting dignity, accepting responsibility for mistakes, and using knowledge in service of life.

These commitments are not demands for perfection. When duties conflict, consider foreseeable consequences, consent, fairness and the least harmful reasonable response. Accountability includes acknowledging mistakes, making restitution where possible and changing behavior.

Reflection: describe a situation where loyalty and honesty conflict. Explain how you would honor both without concealing harm.',0 FROM categories c CROSS JOIN users u WHERE c.slug='jedi-temple' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Living Sith ethics: commitments of the sovereign','living-sith-commitments','Original Knightfall proposal. A Sith commits to owning chosen ambitions, cultivating competence, confronting self-deception, maintaining personal boundaries and accepting responsibility for consequences. Sovereignty includes recognizing that others possess their own agency.

Strength is not measured by cruelty. Refusing manipulation, admitting error and abandoning a destructive objective can demonstrate greater independence than stubbornly pursuing it.

Reflection: identify a goal you inherited from another person''s expectations. Decide whether it remains yours, and explain the cost of keeping or relinquishing it.',0 FROM categories c CROSS JOIN users u WHERE c.slug='order-of-the-sith' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Jedi observances: daily and weekly spiritual rhythm','living-jedi-observances','Morning: establish an intention grounded in awareness and compassion. During the day: notice moments of impatience and choose a deliberate response. Evening: review one helpful action, one mistake and one lesson.

Weekly: study a philosophical or religious text, engage in voluntary service and spend time in quiet reflection. Monthly: revisit commitments and discuss a difficult ethical question with consenting peers.

Practices are adaptable to disability, work, family and personal belief. Missing an observance does not diminish a person''s worth or membership.',0 FROM categories c CROSS JOIN users u WHERE c.slug='jedi-temple' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Sith observances: daily and weekly spiritual rhythm','living-sith-observances','Morning: identify a chosen objective and the reason it matters. During the day: practice a skill or complete a deliberate action toward it. Evening: examine obstacles, emotional reactions and whether your actions respected your boundaries and those of others.

Weekly: review progress, study a challenging idea and revise an ineffective strategy. Monthly: identify an unnecessary dependency or limiting assumption and choose a realistic constructive change.

Rest and recovery are compatible with discipline. Avoid treating exhaustion, suffering or risky behavior as spiritual achievement.',0 FROM categories c CROSS JOIN users u WHERE c.slug='order-of-the-sith' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Jedi ceremony: dedication to the path','living-jedi-dedication','An optional original Knightfall ceremony. Choose a quiet setting, privately or with consenting witnesses. Reflect on the reasons for adopting the path. Read a personal commitment to awareness, compassion, learning and responsible service. Identify one concrete action that expresses that commitment.

Suggested original vow: I choose understanding over certainty, compassion over indifference, and responsibility over avoidance. I will learn from my mistakes and respect the freedom of others.

Close with a moment of reflection. The ceremony grants no legal credential, supernatural ability or authority over another member. It may be renewed, revised or declined.',0 FROM categories c CROSS JOIN users u WHERE c.slug='jedi-temple' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Sith ceremony: declaration of sovereignty','living-sith-dedication','An optional original Knightfall ceremony. Choose a private or communal setting with consenting participants. Reflect on a chosen ambition, an obstacle and a commitment to deliberate growth. Speak a personal declaration and record one measurable action.

Suggested original vow: I claim responsibility for my choices. I will cultivate my strengths, confront my illusions and pursue freedom without denying the freedom of others.

A symbolic object or written journal entry may mark the occasion. No blood, injury, dangerous ordeal, payment or surrender of autonomy is required. The declaration may be revised as convictions develop.',0 FROM categories c CROSS JOIN users u WHERE c.slug='order-of-the-sith' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Theology forum: what does the Force mean in real life?','living-force-theology','Members may understand the Force as a literal spiritual reality, a metaphor for interdependence, a philosophical ideal or a fictional inspiration without supernatural belief. These positions differ and deserve clear discussion.

Distinguish personal conviction, religious testimony, philosophical argument and empirical evidence. A spiritual experience can be meaningful without establishing a universal scientific claim. No participant is required to disclose private experiences or affirm another person''s theology.

Discussion prompts: Is the Force personal or impersonal? Does it have moral intention? Can a non-theistic practitioner belong? What would count as a reason to revise your interpretation?',0 FROM categories c CROSS JOIN users u WHERE c.slug='force-studies' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Spiritual mentorship: consent, boundaries and accountability','living-force-mentorship','A mentor offers guidance, study resources and constructive feedback. A student retains independent judgment and may decline advice or end the relationship. Mentors do not acquire authority over finances, relationships, medical decisions or private communications.

Agree on study objectives, communication boundaries and review intervals. Avoid exclusive loyalty demands, secret tests and claims of infallibility. Conflicts should have a transparent reporting route outside the mentor relationship.

Suggested assessment: demonstrate understanding, explain a disagreement fairly, reflect on an ethical dilemma and complete a voluntary project. Rank must never substitute for accountability.',0 FROM categories c CROSS JOIN users u WHERE c.slug='force-studies' AND u.username='knightfall' AND u.role='god';