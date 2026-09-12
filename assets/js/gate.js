// ARTEMIA Group - protezione accesso semplice (lato client)
// Per cambiare la password: modifica il valore di PWD qui sotto.
(function () {
  var PWD = "ArtemiaSoci2026";
  var KEY = "artemia_unlocked_v1";

  try {
    if (sessionStorage.getItem(KEY) === "1") return;
  } catch (e) {}

  var tries = 0;
  var ok = false;
  while (tries < 5) {
    var input = window.prompt("Area riservata ARTEMIA Group\nInserisci la password per continuare:");
    if (input === null) break;
    if (input === PWD) { ok = true; break; }
    tries++;
  }

  if (ok) {
    try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
    return;
  }

  document.write(
    "<div style='font-family:system-ui,sans-serif;background:#06182B;color:#fff;" +
    "height:100vh;margin:0;display:flex;align-items:center;justify-content:center;" +
    "text-align:center;padding:20px'><div><h1 style=\"margin:0 0 10px\">Accesso negato</h1>" +
    "<p style=\"color:#AFC4D6\">Password non corretta. Ricarica la pagina per riprovare.</p></div></div>"
  );
  if (window.stop) window.stop();
  throw new Error("Accesso negato");
})();
