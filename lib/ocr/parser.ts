import { UTMCoordinate } from '@/types';

/**
 * Parses raw OCR text to detect Easting (X) and Northing (Y) coordinates.
 * Expected format from prompt:
 * X: 5xxxxx.xxx
 * Y: 1xxxxxx.xxx
 */
export function parseOCRText(text: string, words?: any[]): UTMCoordinate[] {
  console.log("Raw OCR Text:\n", text);
  const coordinates: UTMCoordinate[] = [];
  let index = 0;

  if (words && words.length > 0) {
    // 1. Filter out words that don't contain any numbers
    const numWords = words.filter(w => /\d/.test(w.text));

    // 2. Group words by their y-coordinate (row alignment)
    const rows: any[][] = [];
    const Y_TOLERANCE = 25; // pixels

    for (const word of numWords) {
      let placed = false;
      for (const row of rows) {
        const avgY = row.reduce((sum, w) => sum + w.bbox.y0, 0) / row.length;
        if (Math.abs(word.bbox.y0 - avgY) < Y_TOLERANCE) {
          row.push(word);
          placed = true;
          break;
        }
      }
      if (!placed) {
        rows.push([word]);
      }
    }

    // 3. Process each row
    for (const row of rows) {
      // Sort words in the row from left to right (column alignment)
      row.sort((a, b) => a.bbox.x0 - b.bbox.x0);

      // Extract numbers, cleaning OCR typos
      const cleanNumbers = row.flatMap(w => {
        let t = w.text
          .replace(/[Ss]/g, '5')
          .replace(/[lI]/g, '1')
          .replace(/[Oo]/g, '0')
          .replace(/,/g, '.');

        const matches = t.match(/\d+(?:\.\d+)?/g);
        if (matches) {
          return matches.map((m: string) => {
            let num = parseFloat(m);
            if (num > 9999999) num = num / 1000;
            return num;
          });
        }
        return [];
      });

      if (cleanNumbers.length >= 2) {
        for (let i = 0; i < cleanNumbers.length - 1; i++) {
          const x = cleanNumbers[i];
          const y = cleanNumbers[i + 1];

          if (x > 100000 && x < 999999 && y > 1000000 && y < 9999999) {
            coordinates.push({ id: crypto.randomUUID(), index: index++, x, y });
            break;
          }
        }
      }
    }
  } else {
    console.log("No word bounding boxes provided. Skipping bbox alignment.");
  }

  // 4. FALLBACK: If bounding box method failed, try parsing the raw text line-by-line
  if (coordinates.length === 0 && text) {
    console.log("Fallback: Parsing raw text line-by-line");
    const lines = text.split('\n');
    for (const line of lines) {
      let t = line
        .replace(/[Ss]/g, '5')
        .replace(/[lI]/g, '1')
        .replace(/[Oo]/g, '0')
        .replace(/,/g, '.');

      const matches = t.match(/\d+(?:\.\d+)?/g);
      if (matches && matches.length >= 2) {
        const nums = matches.map((m: string) => {
          let num = parseFloat(m);
          if (num > 9999999) num = num / 1000;
          return num;
        });

        for (let i = 0; i < nums.length - 1; i++) {
          const x = nums[i];
          const y = nums[i + 1];
          if (x > 100000 && x < 999999 && y > 1000000 && y < 9999999) {
            coordinates.push({ id: crypto.randomUUID(), index: index++, x, y });
            break;
          }
        }
      }
    }
  }

  console.log("Final matched coordinates:", coordinates);
  return coordinates;
}
