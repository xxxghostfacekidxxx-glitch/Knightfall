INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Proposed Jedi constitution: membership and conscience','jedi-constitution-membership','Article I — Purpose. The Temple exists to cultivate understanding, compassion, discipline and service through voluntary spiritual practice.

Article II — Conscience. Members may interpret the Force spiritually, symbolically or philosophically. Doubt, disagreement and departure are permitted without punishment.

Article III — Membership. Enrollment is voluntary and independent of donations, site privileges and personal relationships. No member owes obedience to a mentor.

Article IV — Accountability. Leadership decisions must be explainable, conflicts disclosed and complaints heard without retaliation. This is a proposed Knightfall charter, open to community ratification.',0 FROM categories c CROSS JOIN users u WHERE c.slug='jedi-temple' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Proposed Sith constitution: sovereignty and responsibility','sith-constitution-membership','Article I — Purpose. The Order cultivates self-knowledge, agency, ambition and disciplined transformation.

Article II — Sovereignty. Members retain control over their beliefs, relationships and participation. Personal strength does not confer ownership of another person.

Article III — Membership. No payment, oath of submission or exclusive allegiance is required. Members may leave freely.

Article IV — Accountability. Leadership is a responsibility, not immunity from criticism. Coercion and exploitation are incompatible with this proposed living Order. This charter requires community ratification.',0 FROM categories c CROSS JOIN users u WHERE c.slug='order-of-the-sith' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'The Jedi council: stewardship and accountable leadership','jedi-council-stewardship','The fictional Jedi Council provides a useful starting point for examining institutional authority, but its fictional decisions are not binding on living practitioners. A real council should protect conscience, publish its procedures and separate teaching from disciplinary decisions.

Proposed practice: rotate facilitators, disclose conflicts of interest and provide an appeal process. Assess mentors by conduct and teaching ability rather than popularity or claimed supernatural insight.',0 FROM categories c CROSS JOIN users u WHERE c.slug='jedi-temple' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'The Sith council: authority without coercion','sith-council-sovereignty','Fictional Sith hierarchies often reward domination and betrayal. A living spiritual community need not reproduce those practices. Authority can instead be earned through demonstrated competence, transparent responsibility and voluntary trust.

Proposed practice: define limited terms of office, require recusal in personal disputes and allow independent appeals. Criticism of leadership is not spiritual failure.',0 FROM categories c CROSS JOIN users u WHERE c.slug='order-of-the-sith' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'The Jedi schisms and the emergence of the Sith','history-jedi-schisms','Legends develops a history of Jedi schisms, exiled dark-side practitioners and their encounter with the Sith people. Canon preserves ancient conflict between Jedi and Sith but does not establish every Legends event as part of its own continuity.

Study the difference between institutional disagreement, exile and the development of a distinct tradition. Avoid treating every dark-side practitioner as a Sith. Compare continuity-specific sources rather than combining them into a single timeline.',0 FROM categories c CROSS JOIN users u WHERE c.slug='galactic-history' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'The Living Force and the Cosmic Force','force-living-cosmic','In Star Wars storytelling, the Living Force concerns life and immediate connection, while the Cosmic Force concerns the larger unity and continuity of existence. These ideas receive particular attention in The Clone Wars, including Yoda''s journey in season six.

For living practitioners, these can be interpreted as metaphors for present awareness and interconnectedness, or as spiritual beliefs. Neither interpretation establishes supernatural powers as scientific fact.

Reflection: how does attention to present experience change your understanding of long-term responsibility?',0 FROM categories c CROSS JOIN users u WHERE c.slug='force-studies' AND u.username='knightfall' AND u.role='god';
INSERT OR IGNORE INTO threads(category_id,user_id,title,slug,body,pinned) SELECT c.id,u.id,'Building a reliable Canon and Legends research library','holocron-source-method','Record each source''s title, medium, publication date and continuity. Distinguish direct evidence from interpretation and fan speculation. Start with the official Star Wars Databank and the relevant films, episodes or licensed books. Use fan encyclopedias as discovery aids rather than final authorities.

For religious research, maintain a separate bibliography of real-world traditions and original Knightfall writings. Do not present fictional teachings as historical evidence of an ancient terrestrial religion.',0 FROM categories c CROSS JOIN users u WHERE c.slug='holocron-archives' AND u.username='knightfall' AND u.role='god';