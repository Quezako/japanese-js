/**
 * TODO:
 * fetch radicals details, from which fields? maximum recursion?
 * responsive, size: fonts.
 */
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

  var stmt = db.prepare(
    `SELECT * FROM Quezako WHERE key LIKE '${strSearch}[%' OR key = '${strSearch}}'`
  );
  var result = stmt.getAsObject({});
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

  // Auto fetch kanji details + radical details.
  const dataPromise2 = fetch("../db/chmn-full.db").then((res) =>
    res.arrayBuffer()
  );
  const [SQL2, buf2] = await Promise.all([sqlPromise, dataPromise2]);
  const db2 = new SQL.Database(new Uint8Array(buf2));

  strKanjiOnly = strSearch.replace(/[^一-龯々ヶ]/gi, "");
  strDetails = '<span id="each_details">';

  Array.from(strKanjiOnly).forEach((element) => {
    strDetails += `<details><summary>${element} details</summary>`;

    stmt = db.prepare(
      `SELECT mean, chmn_mean, fr_mean_mnemo_wani, fr_story, fr_story_wani_mean, fr_koohii_story_1, fr_koohii_story_2, fr_mean_mnemo_wani2, fr_chmn_mnemo, Tags FROM Quezako WHERE key = "${element}" OR key LIKE "${element}[%"`
    );
    result = stmt.getAsObject({});
    for (var [key, val] of Object.entries(result)) {
      strDetails += val ? `* ${key}: ${val}<br />` : "";
    }

    stmt = db.prepare(
      `SELECT kanji_mnemo_personal FROM Quezako WHERE kanji_mnemo_personal LIKE "%${element} :%"`
    );
    result = stmt.getAsObject({});
    for (var [key, val] of Object.entries(result)) {
      strDetails += val ? `* ${key}: ${val}<br />` : "";
    }

    stmt = db2.prepare(
      `SELECT * FROM \`chmn-full2\` WHERE hanzi = "${element}" OR hanzi2 = "${element}" OR alike = "${element}"`
    );
    result = stmt.getAsObject({});
    for (var [key, val] of Object.entries(result)) {
      strDetails += val ? `* ${key}: ${val}<br />` : "";
    }
    strDetails += "</details>";
  });
  strDetails += '</span">';

  document.querySelector("#mnemo_personal").innerHTML += strDetails;

  // Anki script.
  var script = document.createElement("script");
  script.src = "quezako.js";
  document.head.appendChild(script);
}
