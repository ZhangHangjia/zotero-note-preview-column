var NotePreviewColumn;

function log(message, error) {
  Zotero.debug("Note Preview Column: " + message);
  if (error) {
    Zotero.logError(error);
  }
}

function install() {
  log("Installed");
}

async function startup({ id, version, rootURI }) {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  Services.scriptloader.loadSubScript(rootURI + "note-preview-column.js");
  await NotePreviewColumn.init({ id, version, rootURI });
}

function onMainWindowLoad({ window }) {
  if (NotePreviewColumn) {
    NotePreviewColumn.redraw();
  }
}

function onMainWindowUnload() {}

async function shutdown({ id }, reason) {
  if (!NotePreviewColumn) return;

  try {
    await NotePreviewColumn.shutdown();
  }
  catch (error) {
    log("Shutdown failed", error);
  }
  NotePreviewColumn = undefined;
}

function uninstall() {
  log("Uninstalled");
}
