
-- Live group poll for the "Which group are you in?" simulator
CREATE TABLE public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  voter_key TEXT NOT NULL,
  group_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT poll_votes_group_check CHECK (group_id IN ('youth','women','urban','custom')),
  CONSTRAINT poll_votes_voter_unique UNIQUE (voter_key)
);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anon visitors) can read aggregate poll data
CREATE POLICY "Anyone can read poll votes"
ON public.poll_votes FOR SELECT
USING (true);

-- Anyone (incl. anon visitors) can cast a vote; the UNIQUE(voter_key) prevents duplicates
CREATE POLICY "Anyone can cast a poll vote"
ON public.poll_votes FOR INSERT
WITH CHECK (true);
