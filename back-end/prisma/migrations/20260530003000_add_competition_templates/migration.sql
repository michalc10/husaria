CREATE TABLE "competition_templates" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "battles" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "competition_templates_pkey" PRIMARY KEY ("id")
);

INSERT INTO "competition_templates" ("id", "name", "description", "battles")
VALUES (
  '000000000000000000000101',
  'Klasyczny zestaw husarski',
  'Domyślny zestaw: Szabla, Pałasz i Kopia.',
  '[
    {
      "name": "Szabla",
      "order": 1,
      "categories": [
        { "name": "P1", "order": 1, "obstacles": [{ "name": "Cięcie łozy", "order": 1, "inputType": "toggle", "score": 6, "scoreRaw": "6" }] },
        { "name": "P2", "order": 2, "obstacles": [{ "name": "Cięcie jabłka", "order": 1, "inputType": "toggle", "score": 6, "scoreRaw": "6" }] },
        {
          "name": "P3 beczka",
          "order": 3,
          "obstacles": [
            { "name": "Niższy chód", "order": 1, "inputType": "toggle", "score": 10, "scoreRaw": "10" },
            { "name": "Ominięcie przeszkody", "order": 2, "inputType": "toggle", "score": 25, "scoreRaw": "25" },
            { "name": "Demontaż przeszkody", "order": 3, "inputType": "toggle", "score": 25, "scoreRaw": "25" }
          ]
        },
        {
          "name": "P4 skok",
          "order": 4,
          "obstacles": [
            { "name": "Zrzutka", "order": 1, "inputType": "toggle", "score": 5, "scoreRaw": "5" },
            { "name": "Ominięcie przeszkody", "order": 2, "inputType": "toggle", "score": 25, "scoreRaw": "25" },
            { "name": "Demontaż przeszkody", "order": 3, "inputType": "toggle", "score": 25, "scoreRaw": "25" }
          ]
        },
        { "name": "P5", "order": 5, "obstacles": [{ "name": "Cięcie jabłka", "order": 1, "inputType": "toggle", "score": 6, "scoreRaw": "6" }] }
      ],
      "penalties": [
        { "name": "Utrata broni", "order": 1, "score": 5 },
        { "name": "Upadek jeźdźca", "order": 2, "score": 20 },
        { "name": "Upadek konia i jeźdźca", "order": 3, "score": 40 }
      ]
    },
    {
      "name": "Pałasz",
      "order": 2,
      "categories": [
        { "name": "P1", "order": 1, "obstacles": [{ "name": "Cięcie kapusty", "order": 1, "inputType": "toggle", "score": 6, "scoreRaw": "6" }] },
        {
          "name": "P2",
          "order": 2,
          "obstacles": [
            {
              "name": "Pchnięcie klocka",
              "order": 1,
              "inputType": "select",
              "score": 0,
              "scoreRaw": "10-0-6-8",
              "scoreOptions": [
                { "code": "0", "label": "0", "score": 10 },
                { "code": "1", "label": "1", "score": 0 },
                { "code": "2", "label": "2", "score": 6 },
                { "code": "3", "label": "3", "score": 8 }
              ]
            }
          ]
        },
        {
          "name": "P3 beczka",
          "order": 3,
          "obstacles": [
            { "name": "Niższy chód", "order": 1, "inputType": "toggle", "score": 10, "scoreRaw": "10" },
            { "name": "Ominięcie przeszkody", "order": 2, "inputType": "toggle", "score": 25, "scoreRaw": "25" },
            { "name": "Demontaż przeszkody", "order": 3, "inputType": "toggle", "score": 25, "scoreRaw": "25" }
          ]
        },
        {
          "name": "P4 skok",
          "order": 4,
          "obstacles": [
            { "name": "Zrzutka", "order": 1, "inputType": "toggle", "score": 5, "scoreRaw": "5" },
            { "name": "Ominięcie przeszkody", "order": 2, "inputType": "toggle", "score": 25, "scoreRaw": "25" },
            { "name": "Demontaż przeszkody", "order": 3, "inputType": "toggle", "score": 25, "scoreRaw": "25" }
          ]
        },
        { "name": "P5", "order": 5, "obstacles": [{ "name": "Cięcie kapusty", "order": 1, "inputType": "toggle", "score": 6, "scoreRaw": "6" }] }
      ],
      "penalties": [
        { "name": "Utrata broni", "order": 1, "score": 5 },
        { "name": "Upadek jeźdźca", "order": 2, "score": 20 },
        { "name": "Upadek konia i jeźdźca", "order": 3, "score": 40 }
      ]
    },
    {
      "name": "Kopia",
      "order": 3,
      "categories": [
        { "name": "P1", "order": 1, "obstacles": [{ "name": "Pierścień 1", "order": 1, "inputType": "toggle", "score": 6, "scoreRaw": "6" }] },
        { "name": "P2", "order": 2, "obstacles": [{ "name": "Pierścień 2", "order": 1, "inputType": "toggle", "score": 6, "scoreRaw": "6" }] },
        {
          "name": "P3 beczka",
          "order": 3,
          "obstacles": [
            { "name": "Niższy chód", "order": 1, "inputType": "toggle", "score": 10, "scoreRaw": "10" },
            { "name": "Ominięcie przeszkody", "order": 2, "inputType": "toggle", "score": 25, "scoreRaw": "25" },
            { "name": "Demontaż przeszkody", "order": 3, "inputType": "toggle", "score": 25, "scoreRaw": "25" }
          ]
        },
        {
          "name": "P4 skok",
          "order": 4,
          "obstacles": [
            { "name": "Zrzutka", "order": 1, "inputType": "toggle", "score": 5, "scoreRaw": "5" },
            { "name": "Ominięcie przeszkody", "order": 2, "inputType": "toggle", "score": 25, "scoreRaw": "25" },
            { "name": "Demontaż przeszkody", "order": 3, "inputType": "toggle", "score": 25, "scoreRaw": "25" }
          ]
        },
        { "name": "P5", "order": 5, "obstacles": [{ "name": "Pierścień 3", "order": 1, "inputType": "toggle", "score": 6, "scoreRaw": "6" }] }
      ],
      "penalties": [
        { "name": "Utrata broni", "order": 1, "score": 5 },
        { "name": "Upadek jeźdźca", "order": 2, "score": 20 },
        { "name": "Upadek konia i jeźdźca", "order": 3, "score": 40 }
      ]
    }
  ]'::jsonb
);
