// TODO: font from css, audio.

var strFront = "";
var strBack = "";

async function dbSearch() {
  var xhr = new XMLHttpRequest();

  xhr.open("GET", `../../js/front.tpl`, true);
  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;
    if (this.status !== 200) return;
    strFront = this.responseText;
  };
  xhr.send();

  xhr = new XMLHttpRequest();
  xhr.open("GET", `../../js/back.tpl`, true);
  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;
    if (this.status !== 200) return;
    strBack = this.responseText;
  };

  xhr.send();

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const strSearch = urlParams.get('kanji')
  console.log(strSearch);

  const sqlPromise = await initSqlJs({
    locateFile: (file) => "../../js/sql-wasm.wasm",
  });

  const dataPromise = fetch("../db/vocab.db").then((res) => res.arrayBuffer());
  const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
  const db = new SQL.Database(new Uint8Array(buf));

  const stmt = db.prepare(
    `SELECT * FROM Quezako WHERE kanji_only = '${strSearch}' AND (key LIKE '${strSearch}[%' OR key = '${strSearch}}')`
  );
  const result = stmt.getAsObject({});
  strTpl = strBack.replace(/{{FrontSide}}/g, strFront);
  strTpl = strTpl.replace(/(edit|kanji|kana|furigana):/g, "");
  strTpl = strTpl.replace(/{{(#|\/|\^)[^}]+}}/g, "");
  strTpl = strTpl.replace(/{{([^}]+)}}/gi, function (strSearch, strMatch) {
    return result[strMatch] ? result[strMatch] : "";
  });

  document.querySelector("body").innerHTML = strTpl;
  var script = document.createElement("script");
  script.src = "quezako.js";
  document.head.appendChild(script);
}
