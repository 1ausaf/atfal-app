-- Remove sub-minimum starter; seed one puzzle that qualifies for daily rotation (≥4 across, ≥5 down).

DELETE FROM crossword_puzzles WHERE title = 'Starter';

INSERT INTO crossword_puzzles (title, puzzle_json)
VALUES (
  'Sample grid',
  '{
    "rows": 5,
    "cols": 7,
    "solution": [
      [null, null, null, "R", null, null, null],
      ["T", "O", "E", "O", null, null, null],
      [null, "C", "A", "T", "O", "T", null],
      [null, null, "T", "A", "R", "O", "E"],
      [null, null, null, null, "E", null, null]
    ],
    "clues": {
      "across": [
        {"n": 2, "clue": "Something you might stub", "row": 1, "col": 0, "len": 3},
        {"n": 4, "clue": "Pet that meows", "row": 2, "col": 1, "len": 3},
        {"n": 8, "clue": "Road surface goo", "row": 3, "col": 2, "len": 3},
        {"n": 9, "clue": "Sheepish male deer", "row": 3, "col": 4, "len": 3}
      ],
      "down": [
        {"n": 1, "clue": "Spin like a top", "row": 0, "col": 3, "len": 3},
        {"n": 3, "clue": "Have a meal", "row": 1, "col": 2, "len": 3},
        {"n": 5, "clue": "Near; beside", "row": 2, "col": 2, "len": 2},
        {"n": 6, "clue": "Metal source in a mine", "row": 2, "col": 4, "len": 3},
        {"n": 7, "clue": "Toward; closed (prefix)", "row": 2, "col": 5, "len": 2}
      ]
    }
  }'::jsonb
);
