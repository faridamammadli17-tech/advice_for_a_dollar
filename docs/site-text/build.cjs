const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  HeadingLevel, AlignmentType, ShadingType, BorderStyle, LevelFormat, PageBreak,
} = require('docx');

const sections = require('./content.cjs');

const W = [1150, 2100, 6110]; // DXA, sum 9360
const FONT = 'Calibri';
const WINE = '752445';

const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' },
  left: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' },
  right: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' },
};

function cell(text, width, opts = {}) {
  const runs = Array.isArray(text) ? text : [text];
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: cellBorders,
    shading: opts.shade ? { type: ShadingType.CLEAR, fill: opts.shade, color: 'auto' } : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: runs.map(
      (t) =>
        new Paragraph({
          spacing: { after: 0 },
          children: [
            new TextRun({
              text: t,
              font: FONT,
              size: opts.size || 20,
              bold: opts.bold || false,
              color: opts.color,
              italics: opts.italics || false,
            }),
          ],
        }),
    ),
  });
}

function headerRow() {
  return new TableRow({
    tableHeader: true,
    children: [
      cell('Code', W[0], { bold: true, shade: 'F2F2F2' }),
      cell('Where it appears', W[1], { bold: true, shade: 'F2F2F2' }),
      cell('Text on the site right now', W[2], { bold: true, shade: 'F2F2F2' }),
    ],
  });
}

function table(rows) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: W,
    rows: [
      headerRow(),
      ...rows.map(
        (r) =>
          new TableRow({
            cantSplit: true,
            children: [
              cell(r.code, W[0], { bold: true, color: WINE, size: 18 }),
              cell(r.where, W[1], { size: 18, color: '595959' }),
              cell(r.text, W[2], { shade: r.placeholder ? 'FFF2CC' : undefined }),
            ],
          }),
      ),
    ],
  });
}

function h1(t) { return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 120 }, children: [new TextRun({ text: t, font: FONT })] }); }
function h2(t) { return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 100 }, children: [new TextRun({ text: t, font: FONT })] }); }
function p(t, o = {}) { return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: t, font: FONT, size: 22, italics: o.italics, bold: o.bold })] }); }
function bullet(t) { return new Paragraph({ numbering: { reference: 'bullets', level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, font: FONT, size: 22 })] }); }

const children = [];
children.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: 'Advice for a Dollar — every text on the site', font: FONT })] }));
children.push(p('Taken from the mock website on 15 October 2026. This is the English text exactly as it appears on the site today, page by page.'));
children.push(h2('How to use this document'));
children.push(bullet('Edit the text directly in the right-hand column, in the row where it appears. Leave a row alone if it is fine as it is.'));
children.push(bullet('Please do not change the code in the left column (for example HOME-03). It is how each line is matched back to the right place on the site.'));
children.push(bullet('To remove a line from the site, write DELETE in its row. To add a new line, add a row under the closest one and leave the code empty.'));
children.push(bullet('Rows with a yellow background are placeholders: text written by the builder to hold the space, not your words. They need replacing before the site goes live.'));
children.push(bullet('Some lines contain a value the site fills in, shown in curly brackets like {minimum}. Keep the brackets where you want that value to appear.'));
children.push(bullet('Only visitor-facing text is here. The owner dashboard (admin panel) and the emergency numbers themselves are not included.'));

let total = 0;
for (const s of sections) {
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(h1(s.title));
  if (s.note) children.push(p(s.note, { italics: true }));
  for (const g of s.groups) {
    if (g.title) children.push(h2(g.title));
    if (g.note) children.push(p(g.note, { italics: true }));
    children.push(table(g.rows));
    children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
    total += g.rows.length;
  }
}
console.log('rows:', total);

const doc = new Document({
  creator: 'Advice for a Dollar',
  title: 'Advice for a Dollar — every text on the site',
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, color: WINE, font: FONT } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, color: '2F582C', font: FONT } },
      { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 40, bold: true, color: WINE, font: FONT }, paragraph: { spacing: { after: 200 } } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [
    {
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1270, right: 1276 } } },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync('Advice-for-a-Dollar-site-text.docx', buf);
  console.log('written');
});
