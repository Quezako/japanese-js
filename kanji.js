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
  const strSearch = urlParams.get("kanji");

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
  strTpl = strTpl.replace(/(edit):/g, "");
  strTpl = strTpl.replace(/(hint):/g, "");
  strTpl = strTpl.replace(
    /{{#([^}]+)}}(.+){{\/\1}}/g,
    function (strOrig, strMatch, strMatch2) {
      if (result[strMatch]) {
        return strMatch2;
      } else {
        return "";
      }
    }
  );
  strTpl = strTpl.replace(
    /{{\^([^}]+)}}(.+){{\/\1}}/g,
    function (strOrig, strMatch, strMatch2) {
      if (!result[strMatch]) {
        return strMatch2;
      } else {
        return "";
      }
    }
  );

  strTpl = strTpl.replace(/{{([^}]+)}}/gi, function (strOrig, strMatch) {
    strReturn = result[strMatch] ? result[strMatch] : "";

    strMatch = strMatch.replace(
      /(kanji|kana|furigana):(.+)/g,
      function (strOrig, strDisplay, strText) {
        if (strDisplay == "kanji") {
          strReturn = result[strText]
            ? result[strText].replace(/\[.+\]/gi, "")
            : "";
        } else if (strDisplay == "kana") {
          strReturn = result[strText]
            ? result[strText].replace(/.+\[(.+)\]/gi, "$1")
            : "";
        } else if (strDisplay == "furigana") {
          strReturn = result[strText]
            ? result[strText].replace(
                /([^ >\[]+)\[([^\]]+)\]/gi,
                "<ruby>$1<rt>$2</rt></ruby>"
              )
            : "";
        }
      }
    );

    strReturn = strReturn.replace(
      /\[sound:([^\]]+)\]/g,
      `
        <audio hidden id="player$1" controls src="$1" /></audio>
        <div class="player" onclick="player = document.getElementById('player$1'); if(player.paused) {player.play()} else {player.pause();player.currentTime = 0}"></div>
      `
    );

    return strReturn;
  });

  document.querySelector("body").innerHTML = strTpl;
  var script = document.createElement("script");
  script.src = "quezako.js";
  document.head.appendChild(script);
}
