INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Living Jediism: faith, philosophy and personal practice','living-jediism','Jediism is a real-world religious or philosophical identification inspired by Star Wars. Practitioners differ in whether they understand the Force as a spiritual reality, a metaphor for interdependence, or an organizing principle for ethical life. Knightfall does not require a single metaphysical interpretation.

Our proposed community framework emphasizes compassion, discernment, service, personal responsibility and respect for freedom of conscience. Membership does not require abandoning another religion or accepting fictional events as historical facts.

Daily practice: reflect on your intentions, study a meaningful question, perform an act of service and review your choices without self-deception. Spiritual claims and personal experiences may be discussed respectfully without presenting them as scientifically established facts.

Discussion: what makes a Jedi identity meaningful outside fiction?',1 FROM categories c CROSS JOIN users u WHERE c.slug='jedi-temple' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'The living Jedi path: a four-stage study program','living-jedi-curriculum','This is an original Knightfall study proposal, not an official credential or a universal Jediist hierarchy.

Stage I — Foundations: study the Code''s principles, examine motivations and develop a reflective journal.

Stage II — Discipline: practice attention, emotional literacy, critical thinking and constructive conflict resolution. Record mistakes and revisions rather than claiming perfection.

Stage III — Service: undertake a voluntary community project, respect boundaries and evaluate whether the work actually benefits others.

Stage IV — Mentorship: demonstrate patient teaching, openness to criticism and accountability. Mentorship is a responsibility, not authority over another person''s private life.

Progression should be voluntary and based on reflection and demonstrated understanding, never payment, unquestioning loyalty or claims of supernatural power.',0 FROM categories c CROSS JOIN users u WHERE c.slug='jedi-temple' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Jedi contemplative practice: awareness and ethical reflection','living-jedi-contemplation','Begin with a comfortable posture and a few minutes of ordinary breathing. Notice thoughts and feelings without demanding their disappearance. If meditation is uncomfortable, substitute a quiet walk or written reflection.

Ask: What am I experiencing? What assumptions am I making? Who could be affected by my next decision? What response best expresses my values?

End by choosing one achievable act of care or responsibility. Keep a journal of observations rather than interpreting every coincidence as a supernatural message.

The purpose is not emotional numbness. Grief, anger and fear are part of human experience. Spiritual practice can coexist with professional healthcare and does not replace it.',0 FROM categories c CROSS JOIN users u WHERE c.slug='jedi-temple' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Living Sith philosophy: sovereignty and spiritual identity','living-sith-philosophy','Real-world Sith-inspired spirituality is diverse and has no single universally recognized authority. Some practitioners understand the dark side symbolically, some adopt an individualistic spiritual worldview, and others approach the Code as a philosophy of personal development.

Knightfall''s proposed living interpretation centers on passion, deliberate strength, self-knowledge, autonomy and responsibility for consequences. It distinguishes self-sovereignty from entitlement to control other people. Fictional Sith cruelty can be studied critically without being adopted as a real-world obligation.

Practice: identify a chosen ambition, examine why it matters, define the skills required and set boundaries that respect other people''s consent and independence.

Discussion: what would freedom mean if it did not depend on another person''s submission?',1 FROM categories c CROSS JOIN users u WHERE c.slug='order-of-the-sith' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'The living Sith path: a four-stage study program','living-sith-curriculum','This is an original Knightfall study proposal, not a universal Sith religious hierarchy.

Stage I — Passion: identify values, desires and fears. Distinguish chosen ambitions from compulsions and inherited expectations.

Stage II — Strength: cultivate competence, resilience and discipline through sustainable practice. Measure progress against your own prior abilities rather than humiliation of others.

Stage III — Power: develop the capacity to make informed choices, maintain boundaries and create meaningful work. Accept responsibility for the consequences of your actions.

Stage IV — Liberation: examine dependencies, revise limiting beliefs and exercise autonomy without denying the autonomy of others. Mentor only through consent and mutual accountability.

Progression is voluntary. No member owes a mentor money, secrecy, obedience or personal access as proof of spiritual worth.',0 FROM categories c CROSS JOIN users u WHERE c.slug='order-of-the-sith' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Sith contemplative practice: passion, shadow and self-mastery','living-sith-contemplation','Shadow reflection here means examining aspects of yourself you avoid acknowledging, not diagnosing a hidden supernatural entity. Choose a manageable emotion or recurring pattern and write about its triggers, purpose and consequences.

Ask: What do I want? What am I afraid of losing? Is my current behavior bringing me closer to my chosen goal? What alternatives preserve my agency and respect others?

Convert reflection into a concrete constructive action, such as learning a skill, completing a project or establishing a boundary. Do not deliberately intensify distress or treat suffering as proof of advancement.

The aim is ownership of one''s choices rather than surrender to anger. Pause any exercise that becomes overwhelming and seek appropriate support when needed.',0 FROM categories c CROSS JOIN users u WHERE c.slug='order-of-the-sith' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Interfaith charter: freedom of conscience and respectful debate','force-interfaith-charter','Knightfall welcomes Jediists, Sith-inspired practitioners, other spiritual traditions, agnostics, atheists and lore enthusiasts. Members may describe their beliefs in their own terms. No one must affirm another person''s metaphysical claims to treat them respectfully.

Distinguish fictional Canon, Legends, historical religious sources, personal testimony and original Knightfall teachings. Critique ideas without harassing believers. No coercive recruitment, threats, discriminatory exclusion or demands for private disclosures.

Spiritual mentorship must be voluntary and transparent. Members retain the right to question teachings, change beliefs, leave a group or decline a practice without retaliation.

This proposed charter is a discussion foundation, not a claim that all existing Jediist or Sith-inspired communities share these rules.',1 FROM categories c CROSS JOIN users u WHERE c.slug='force-studies' AND u.username='knightfall' AND u.role='god';