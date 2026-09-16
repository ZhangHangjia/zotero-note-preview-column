const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const prefs = {
  "extensions.note-preview-column.maxLength": 240,
  "extensions.note-preview-column.noteMode": "all",
  "extensions.note-preview-column.separator": " | ",
};

const context = {
  Zotero: {
    Prefs: {
      get: key => prefs[key],
    },
    Items: {
      get: id => notes[id],
    },
    debug() {},
    logError(error) { throw error; },
  },
};
vm.createContext(context);
vm.runInContext(fs.readFileSync("note-preview-column.js", "utf8"), context);

const plugin = context.NotePreviewColumn;
const notes = {
  1: { id: 1, deleted: false, dateModified: "2026-01-01", getNote: () => "<p>第一条&nbsp;笔记</p>" },
  2: { id: 2, deleted: false, dateModified: "2026-02-01", getNote: () => "<p>第二条<br>笔记 &amp; 内容</p>" },
};
const item = {
  id: 100,
  isNote: () => false,
  isRegularItem: () => true,
  getNotes: () => [1, 2],
};

assert.equal(plugin.htmlToText("<p>A<br>B &amp; C &#x4E2D;&#25991;</p>"), "A B & C 中文");
assert.equal(plugin.getPreview(item), "第一条 笔记 | 第二条 笔记 & 内容");

prefs["extensions.note-preview-column.noteMode"] = "latest";
assert.equal(plugin.getPreview(item), "第二条 笔记 & 内容");

prefs["extensions.note-preview-column.noteMode"] = "first";
assert.equal(plugin.getPreview(item), "第一条 笔记");

prefs["extensions.note-preview-column.maxLength"] = 40;
notes[1].getNote = () => `<p>${"长".repeat(60)}</p>`;
assert.equal(plugin.getPreview(item), `${"长".repeat(40)}…`);

const attachment = {
  id: 200,
  isNote: () => false,
  isAttachment: () => true,
  isRegularItem: () => false,
  getNote: () => "<p>未识别中文 PDF 的附件笔记</p>",
};
assert.equal(plugin.getPreview(attachment), "未识别中文 PDF 的附件笔记");

console.log("All tests passed.");
