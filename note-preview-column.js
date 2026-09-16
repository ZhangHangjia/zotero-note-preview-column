/* global Zotero */

var NotePreviewColumn = {
  pluginID: "note-preview-column@local.codex",
  columnKey: null,
  prefPaneID: null,
  prefObserverIDs: [],

  async init({ rootURI }) {
    this.rootURI = rootURI;

    this.prefPaneID = Zotero.PreferencePanes.register({
      pluginID: this.pluginID,
      label: "笔记摘要列",
      image: rootURI + "icons/note-preview-column.svg",
      src: rootURI + "preferences.xhtml",
      scripts: [rootURI + "preferences.js"],
    });

    this.columnKey = await Zotero.ItemTreeManager.registerColumn({
      pluginID: this.pluginID,
      dataKey: "notePreviewColumn",
      label: "笔记摘要",
      flex: 2,
      minWidth: 100,
      showInColumnPicker: true,
      dependsOnChildren: true,
      dataProvider: (item) => this.getPreview(item),
      renderCell: (index, data, column, isFirstColumn, doc) => {
        const span = doc.createElement("span");
        span.className = `cell ${column.className}`;
        span.style.overflow = "hidden";
        span.style.textOverflow = "ellipsis";
        span.style.whiteSpace = "nowrap";
        span.textContent = data || "";
        if (data) span.title = data;
        return span;
      },
    });

    for (const pref of ["maxLength", "noteMode", "separator"]) {
      const observerID = Zotero.Prefs.registerObserver(
        `extensions.note-preview-column.${pref}`,
        () => this.redraw(),
        true
      );
      this.prefObserverIDs.push(observerID);
    }

    Zotero.debug("Note Preview Column: initialized");
  },

  async shutdown() {
    for (const observerID of this.prefObserverIDs) {
      Zotero.Prefs.unregisterObserver(observerID);
    }
    this.prefObserverIDs = [];

    if (this.columnKey) {
      await Zotero.ItemTreeManager.unregisterColumn(this.columnKey);
      this.columnKey = null;
    }
  },

  redraw() {
    try {
      Zotero.Notifier.trigger("redraw", "item", []);
    }
    catch (error) {
      Zotero.logError(error);
    }
  },

  getPreview(item) {
    try {
      let noteItems = [];

      if (item && item.isNote && item.isNote()) {
        noteItems = [item];
      }
      else if (item && item.isAttachment && item.isAttachment()) {
        const attachmentNote = this.htmlToText(item.getNote());
        return this.truncate(attachmentNote);
      }
      else if (item && item.isRegularItem && item.isRegularItem()) {
        noteItems = item.getNotes(false)
          .map(noteID => Zotero.Items.get(noteID))
          .filter(note => note && !note.deleted);
      }
      else {
        return "";
      }

      if (!noteItems.length) return "";

      const mode = Zotero.Prefs.get("extensions.note-preview-column.noteMode", true) || "all";
      if (mode === "latest") {
        noteItems.sort((a, b) => String(b.dateModified).localeCompare(String(a.dateModified)));
        noteItems = [noteItems[0]];
      }
      else if (mode === "first") {
        noteItems = [noteItems[0]];
      }

      const separator = Zotero.Prefs.get("extensions.note-preview-column.separator", true) || " | ";
      let preview = noteItems
        .map(note => this.htmlToText(note.getNote()))
        .filter(Boolean)
        .join(separator);

      return this.truncate(preview);
    }
    catch (error) {
      Zotero.debug(`Note Preview Column: failed for item ${item && item.id}`);
      Zotero.logError(error);
      return "";
    }
  },

  truncate(text) {
      let maxLength = Number(Zotero.Prefs.get("extensions.note-preview-column.maxLength", true));
      if (!Number.isFinite(maxLength)) maxLength = 240;
      maxLength = Math.max(40, Math.min(5000, Math.floor(maxLength)));

      if (text.length > maxLength) {
        text = text.slice(0, maxLength).trimEnd() + "…";
      }
      return text;
  },

  htmlToText(html) {
    if (!html) return "";

    let text = String(html)
      .replace(/<\s*br\s*\/?>/gi, " ")
      .replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, " ")
      .replace(/<[^>]*>/g, " ");

    text = text
      .replace(/&#x([0-9a-f]+);/gi, (match, value) => {
        const codePoint = parseInt(value, 16);
        return Number.isFinite(codePoint) && codePoint <= 0x10FFFF
          ? String.fromCodePoint(codePoint)
          : match;
      })
      .replace(/&#([0-9]+);/g, (match, value) => {
        const codePoint = parseInt(value, 10);
        return Number.isFinite(codePoint) && codePoint <= 0x10FFFF
          ? String.fromCodePoint(codePoint)
          : match;
      })
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, "\"")
      .replace(/&#39;|&apos;/gi, "'");

    return text.replace(/\s+/g, " ").trim();
  },
};
