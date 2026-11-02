-- Non-user-specific category seed data. Never seed fake identities or balances.
insert into public.creator_categories (name) values
  ('Gaming'), ('Music'), ('Art & Creativity'), ('Fitness'), ('Education'),
  ('Coding & Technology'), ('Just Chatting'), ('Cooking & Lifestyle'),
  ('Podcasts'), ('IRL & Travel'), ('Entertainment'), ('Other')
on conflict (name) do nothing;

insert into public.game_question_bank (game_type_id, question, options, correct_option_index)
select gt.id, seed.question, seed.options::jsonb, seed.correct_index
from public.game_types gt
cross join (values
  ('Which planet has the shortest year?','["Mercury","Venus","Earth","Mars"]',0),
  ('What is the largest ocean on Earth?','["Atlantic","Indian","Arctic","Pacific"]',3),
  ('Which instrument has keys, pedals and strings?','["Flute","Piano","Drum kit","Trumpet"]',1),
  ('What is the process plants use to make food?','["Fermentation","Photosynthesis","Evaporation","Condensation"]',1),
  ('How many sides does a hexagon have?','["Five","Six","Seven","Eight"]',1),
  ('Which gas do humans need to breathe?','["Oxygen","Helium","Neon","Hydrogen"]',0),
  ('What is the closest star to Earth?','["Sirius","The Sun","Polaris","Vega"]',1),
  ('Which language is primarily used to style web pages?','["HTML","CSS","SQL","Bash"]',1)
) as seed(question, options, correct_index)
where gt.slug='quick-quiz' and not exists (
  select 1 from public.game_question_bank existing
  where existing.game_type_id=gt.id and existing.question=seed.question
);
