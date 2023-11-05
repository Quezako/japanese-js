/**
 * TODO:
 * introuvable ? 隽
 * split into quezako.js
 * fetch radicals details, from which fields? maximum recursion?
 * chmn DB in french.
 * responsive, size: fonts.
 * anki errors:
 * Failed to load resource: the server responded with a status of 404 (NOT FOUND)
 * :53917/_WakaFont.eot?#iefix:1          Failed to load resource: the server responded with a status of 404 (NOT FOUND)
 * :53917/_WakaFont.svg#WakaFont:1          Failed to load resource: the server responded with a status of 404 (NOT FOUND)
 * The resource http://127.0.0.1:53917/_WakaFont.svg#WakaFont was preloaded using link preload.
 */
let strFront = "";
let strBack = "";

async function dbSearch() {
    let xhr = new XMLHttpRequest();
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

    const dataPromise = fetch("../db/vocab.sqlite").then((res) => res.arrayBuffer());
    const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
    const db = new SQL.Database(new Uint8Array(buf));

    let stmt = db.prepare(
        `SELECT * FROM Quezako WHERE key LIKE '${strSearch}[%' OR key = '${strSearch}}'`
    );
    let result = stmt.getAsObject({});
    let strTpl = strBack.replace(/{{FrontSide}}/g, strFront);
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
        let strReturn = result[strMatch] ? result[strMatch] : "";

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


    let script = document.createElement("script");
    script.src = "../../anki/quezako.js";
    document.head.appendChild(script);
}

dbSearch();