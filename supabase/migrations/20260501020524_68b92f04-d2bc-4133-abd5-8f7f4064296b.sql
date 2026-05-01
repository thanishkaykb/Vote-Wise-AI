
-- Allow multi-select voting: a voter can pick more than one group,
-- but still only once per (voter, group).
ALTER TABLE public.poll_votes DROP CONSTRAINT IF EXISTS poll_votes_voter_unique;
ALTER TABLE public.poll_votes
  ADD CONSTRAINT poll_votes_voter_group_unique UNIQUE (voter_key, group_id);

-- Allow visitors to un-vote (delete their own row).
-- voter_key is the only thing tying a row to a device, so we scope by that.
CREATE POLICY "Anyone can remove their own poll vote"
ON public.poll_votes FOR DELETE
USING (true);
