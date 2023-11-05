async function dbSearch(strSearch) {
    const sqlPromise = await initSqlJs({
        locateFile: (file) => "sql-wasm.wasm",
    });

    let mapObj = {
        si: "shi",
        tu: "tsu",
        ti: "chi",
        ty: "ch",
        sy: "sh",
        zi: "ji",
        di: "ji",
        du: "zu",
        zy: "j",
        dy: "j",
        oo: "ou",
        hu: "fu",
    };

    let mapObj2 = {
        sfu: "shu",
        cfu: "chu",
    };

    let re = new RegExp(Object.keys(mapObj).join("|"), "gi");
    strSearch = strSearch.replace(re, function (matched) {
        return mapObj[matched];
    });
    re = new RegExp(Object.keys(mapObj2).join("|"), "gi");
    strSearch = strSearch.replace(re, function (matched) {
        return mapObj2[matched];
    });

    console.log(strSearch);

    // Grammar
    let dataPromise = fetch("../assets/db/grammar.sqlite").then((res) =>
        res.arrayBuffer()
    );
    let [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
    let db = new SQL.Database(new Uint8Array(buf));
    let stmt = db.prepare(
        `SELECT \`order\`, Grammar, GramMeaningFR, Tags FROM bunpro
    WHERE GramHira LIKE '%${strSearch}%' GROUP BY Grammar
    ORDER BY (CASE WHEN GramHira = '${strSearch}%' THEN 1 WHEN GramHira LIKE '${strSearch}%%' THEN 2 ELSE 3 END), Tags DESC
    LIMIT 30`
    );
    let result = stmt.getAsObject({});
    let strTable = "";
    let rowResult = Object.values(result);
    let regex = /BUNPRO::N(\d)/i;
    let found = [];

    if (result.Tags == null) {
        found = ["", "0"];
    } else {
        found = result.Tags.match(regex);
    }
    if (found == null) {
        found = ["", "0"];
    }

    if (rowResult[1]) {
        let strRuby = `<ruby>${rowResult[1]}</ruby>`;
        strTable += `<tr class="gramm N${found[1]}"><td onclick="javascript:openDiv('${rowResult[1]}', 'gramm')"><span class="tag_N${found[1]}">N${found[1]}</span><a>${strRuby}</a><br>${rowResult[2]}</td></tr>`;
    }

    while (stmt.step()) {
        const result = stmt.getAsObject();

        if (result.Tags == null) {
            found = ["", "0"];
        } else {
            found = result.Tags.match(regex);
        }

        if (found == null) {
            found = ["", "0"];
        }

        found = result.Tags.match(regex);
        rowResult = Object.values(result);
        let strRuby = `<ruby>${rowResult[1]
            .replace(/\[/g, "<rt>")
            .replace(/\]/g, "</rt>")}</ruby>`;
        strTable += `<tr class="gramm N${found[1]}"><td onclick="javascript:openDiv('${rowResult[1]}', 'gramm')"><span class="tag_N${found[1]}">N${found[1]}</span><a>${strRuby}</a><br>${rowResult[2]}</td></tr>`;
    }

    // Vocabulary
    dataPromise = fetch("../assets/db/vocab.sqlite").then((res) => res.arrayBuffer());
    [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
    db = new SQL.Database(new Uint8Array(buf));

    stmt = db.prepare(
        `SELECT key, mean, \`order\`, Tags FROM Quezako
    WHERE version LIKE '%${strSearch}%'
    ORDER BY (CASE WHEN version = '${strSearch}' THEN 1 WHEN version LIKE '${strSearch}%' THEN 2 ELSE 3 END), \`order\`
    LIMIT 30`
    );
    result = stmt.getAsObject({});
    regex = /JLPT::(\d)/i;

    if (result.Tags == null) {
        found = ["", "0"];
    } else {
        found = result.Tags.match(regex);
    }
    if (found == null) {
        found = ["", "0"];
    }

    rowResult = Object.values(result);

    if (rowResult[0]) {
        let strRuby = `<ruby>${rowResult[0]
            .replace(/\[/g, "<rt>")
            .replace(/\]/g, "</rt>")}</ruby>`;
        strTable += `<tr class="voc N${found[1]}"><td onclick="javascript:openDiv('${rowResult[0]}', 'voc')"><span class="tag_N${found[1]}">N${found[1]}</span><a>${strRuby}</a><br>${rowResult[1]}</td></tr>`;
    }

    while (stmt.step()) {
        const result = stmt.getAsObject();

        if (result.Tags == null) {
            found = ["", "0"];
        } else {
            found = result.Tags.match(regex);
        }

        if (found == null) {
            found = ["", "0"];
        }

        rowResult = Object.values(result);
        let strRuby = `<ruby>${rowResult[0]
            .replace(/\[/g, "<rt>")
            .replace(/\]/g, "</rt>")}</ruby>`;
        strTable += `<tr class="voc N${found[1]}""><td onclick="javascript:openDiv('${rowResult[0]}', 'voc')"><span class="tag_N${found[1]}">N${found[1]}</span><a>${strRuby}</a><br>${rowResult[1]}</td></tr>`;
    }

    stmt.free();

    document.getElementById("tbody").innerHTML = strTable;
}

async function openDiv(strKey, strType) {
    const sqlPromise = await initSqlJs({
        locateFile: (file) => "sql-wasm.wasm",
    });

    if (strType == "gramm") {
        const dataPromise = fetch("../assets/db/grammar.sqlite").then((res) =>
            res.arrayBuffer()
        );
        const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
        const db = new SQL.Database(new Uint8Array(buf));

        const strSql = `SELECT Tags, Grammar, GramMeaningFR, GrammarStructureFR, GrammarNuanceFR, Sentence, SentenceFR, SentenceNuanceFR, SupplementalLinksFR, OfflineResourcesFR, GramMeaning, GrammarStructure, GrammarNuance, SentenceEN, SentenceNuance, SupplementalLinks, OfflineResources, SentenceAudio, GramHira
    FROM bunpro WHERE Grammar = "${strKey}"`;
        const stmt = db.prepare(strSql);
        let result = stmt.getAsObject({});
        strTable = "";

        for (let [key, val2] of Object.entries(result)) {
            let arrVal = [];
            let val = val2;

            if (val != null) {
                if (key == "Sentence" || key == "Grammar") {
                    arrVal = val.split(" ");
                    val = "";
                    arrVal.forEach(
                        (subVal) =>
                        (val += `<ruby>${subVal
                            .toString()
                            .replace(/\[/g, "<rt>")
                            .replace(/\]/g, "</rt>")}</ruby>`)
                    );
                    val = val
                        .replace(/{{c1::/g, '<span style="color:red">')
                        .replace(/}}/g, "</span>");
                } else if (key == "SentenceAudio") {
                    val = val
                        .replace(/\[sound:/g, '<audio controls><source src="../assets/img/')
                        .replace(/\]/g, '" /></audio>');
                }
                strTable += `<tr class="gramm" id="gramm_${key}"><td><b>${key} :<br></b>${val}</td></tr>`;
            }
        }

        let strTable2 = "";

        while (stmt.step()) {
            let row = stmt.getAsObject();

            for (let [key, val2] of Object.entries(row)) {
                let arrVal = [];
                let val = val2;

                if (val != null) {
                    if (key == "SentenceAudio") {
                        val = val
                            .replace(
                                /\[sound:/g,
                                '<audio controls><source src="../assets/img/'
                            )
                            .replace(/\]/g, '" /></audio>');
                    }

                    if (key == "Sentence" || key == "Grammar") {
                        arrVal = val.split(" ");
                        val = "";
                        arrVal.forEach(
                            (subVal) =>
                            (val += `<ruby>${subVal
                                .toString()
                                .replace(/\[/g, "<rt>")
                                .replace(/\]/g, "</rt>")}</ruby>`)
                        );
                        val = val
                            .replace(/{{c1::/g, '<span style="color:red">')
                            .replace(/}}/g, "</span>");
                    }

                    if (
                        key == "Sentence" ||
                        key == "SentenceFR" ||
                        key == "SentenceNuanceFR" ||
                        key == "SentenceAudio"
                    ) {
                        strTable += `<tr class="gramm" id="gramm_${key}"><td><b>${key} :<br></b>${val}</td></tr>`;
                    } else if (key == "SentenceEN" || key == "SentenceNuance") {
                        strTable2 += `<tr class="gramm" id="gramm_${key}"><td><b>${key} :<br></b>${val}</td></tr>`;
                    }
                }
            }
        }
        strTable += strTable2;
    } else {
        const dataPromise = fetch("../assets/db/vocab.sqlite").then((res) =>
            res.arrayBuffer()
        );
        const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
        const db = new SQL.Database(new Uint8Array(buf));

        const stmt = db.prepare(
            `SELECT Tags, key, yomi, mean, voc_image, en_mean, voc_notes_personal, kanji_mnemo_personal, read_mnemo_personal, voc_sentence_ja, voc_sentence_fr, voc_sentence_img, chmn_mean, fr_components2, voc_alts, fr_mean_mnemo_wani, fr_compo_wani_name, fr_story_wani_mean, fr_mean_mnemo_wani2, fr_mean_mnemo_wani3, en_reading_info, en_reading_mnemonic, en_reading_mnemonic2, fr_chmn_mnemo, en_chmn_mnemo, kun_pre, kun_post, voc_furi, kanji_only, onyomi, kunyomi, kb_img, fr_kb_desc, jkm, en_jkm_headline, en_jkm_subtitle, fr_story, fr_component, fr_koohii_story_1, fr_koohii_story_2, fr_koohii_3, fr_story_rtk, fr_memrise_hint, fr_story_rtk_comment, fr_components3, compo_wani, fr_word, stroke_order, fr_notes, fr_voc_notes, en_heisigcomment, chmn_simple, chmn_lookalike, chmn_ref, kd_used_in_kanjis, primitive_of, usually_kana, version, \`order\`, voc_mp3, voc_sentence_audio
      FROM Quezako WHERE key = "${strKey}"`
        );
        const result = stmt.getAsObject({});
        strTable = "";

        for (let [key, val2] of Object.entries(result)) {
            let arrVal = [];
            let val = val2;

            if (val != null) {
                if (
                    key == "key" ||
                    key == "voc_furi" ||
                    key == "voc_sentence_ja" ||
                    key == "kanji_only"
                ) {
                    arrVal = val.split(" ");
                    val = "";
                    arrVal.forEach(
                        (subVal) =>
                        (val += `<ruby>${subVal
                            .toString()
                            .replace(/\[/g, "<rt>")
                            .replace(/\]/g, "</rt>")}</ruby>`)
                    );
                } else if (key == "voc_image" || key == "voc_sentence_img") {
                    arrVal = val.split('src="');
                    val = `${arrVal[0]}src="../assets/img/${arrVal[1]}`;
                }

                strTable += `<tr class="voc"><td><b>${key} :<br></b>${val}</td></tr>`;
            }
        }

        stmt.free();

        let kanji_key = result.kanji_only ? result.kanji_only : result.key;
        let kana_key = result.yomi;
        let strWordLinks = "";

        strWordLinks += `Sound: <a href='https://assets.languagepod101.com/dictionary/japanese/audiomp3.php?kanji=${kanji_key}&kana=${kana_key}'><img src='../assets/img/favicon-7bb26f7041394a1ad90ad97f53dda21671c5dffb.ico' width=16 style='vertical-align:middle'>Pod101</a>`;
        strWordLinks += `<a href='https://forvo.com/word/${kanji_key}/#ja'><img src='../assets/img/favicon-0c20667c2ac4a591da442c639c6b7367aa54fa13.ico' width=16 style='vertical-align:middle'>Forvo</a>`;
        strWordLinks += `<a href='https://jisho.org/search/${kanji_key} ${kana_key}?_x_tr_sl=en&_x_tr_tl=fr'><img src='../assets/img/favicon-062c4a0240e1e6d72c38aa524742c2d558ee6234497d91dd6b75a182ea823d65.ico' width=16 style='vertical-align:middle'>Jisho</a>`;
        strWordLinks += `<a href='https://jisho.org/search/${kana_key}?_x_tr_sl=en&_x_tr_tl=fr'><img src='../assets/img/favicon-062c4a0240e1e6d72c38aa524742c2d558ee6234497d91dd6b75a182ea823d65.ico' width=16 style='vertical-align:middle'>Jisho kana</a>`;
        strWordLinks += `<a href='https://uchisen.com/functions?search_term=${kanji_key}'><img src='../assets/img/favicon-16x16-7f3ea5f15b8cac1e6fa1f9922c0185debfb72296.png' style='vertical-align:middle'>Uchisen</a>`;
        strWordLinks += `<a href='https://www.wanikani.com/vocabulary/${kanji_key}'><img src='../assets/img/favicon-36371d263f6e14d1cc3b9f9c97d19f7e84e7aa856560c5ebec1dd2e738690714.ico' width=16 style='vertical-align:middle'>WaniKani Voc</a>`;
        strWordLinks += `<a href='https://quezako.com/tools/anki/vocabulary.php?kanji=${kanji_key}&lang=en'><img src='../assets/img/favicon-f435b736ab8486b03527fbce945f3b765428a315.ico' width=16 style='vertical-align:middle'>Quezako Voc</a>`;
        strWordLinks += `<a href='https://quezako.com/tools/anki/anki.php?kanji=${kanji_key}&lang=en'><img src='../assets/img/favicon-f435b736ab8486b03527fbce945f3b765428a315.ico' width=16 style='vertical-align:middle'>Quezako Kanji</a>`;
        strWordLinks += `<a href='https://www.google.com/search?q=${kanji_key} イラスト&tbm=isch&hl=fr&sa=X'><img src='../assets/img/favicon-49263695f6b0cdd72f45cf1b775e660fdc36c606.ico' width=16 style='vertical-align:middle'>Google Img</a>`;

        let strKanjiLinks =
            "<br>$1 Kanji: <a href='https://quezako.com/tools/anki/anki.php?kanji=$1'><img src='../assets/img/favicon-f435b736ab8486b03527fbce945f3b765428a315.ico' width=16 style='vertical-align:middle'>Quezako</a>";
        strKanjiLinks +=
            "<a href='https://rtega.be/chmn/?c=$1'><img src='../assets/img/favicon.png' width=16 style='vertical-align:middle'>Rtega</a>";
        strKanjiLinks +=
            "<a href='https://kanji.koohii.com/study/kanji/$1?_x_tr_sl=en&_x_tr_tl=fr'><img src='../assets/img/favicon-16x16.png' width=16 style='vertical-align:middle'>Koohii</a>";
        strKanjiLinks +=
            "<a href='https://www.wanikani.com/kanji/$1'><img src='../assets/img/favicon-36371d263f6e14d1cc3b9f9c97d19f7e84e7aa856560c5ebec1dd2e738690714.ico' width=16 style='vertical-align:middle'>WaniKani Kanji</a>";
        strKanjiLinks +=
            "<a href='https://www.wanikani.com/vocabulary/$1'><img src='../assets/img/favicon-36371d263f6e14d1cc3b9f9c97d19f7e84e7aa856560c5ebec1dd2e738690714.ico' width=16 style='vertical-align:middle'>WaniKani Voc</a>";
        strKanjiLinks +=
            "<a href='https://en.wiktionary.org/wiki/$1'><img src='../assets/img/en.ico' width=16 style='vertical-align:middle'>Wiktionary</a>";
        strWordLinks += kanji_key.replace(/(\p{Script=Han})/gu, strKanjiLinks);

        strTable += `<tr class="voc"><td>${strWordLinks}</td></tr>`;
    }

    document.querySelector(
        ".dynamicText"
    ).innerHTML = `<table>${strTable}</table>`;
    document.getElementById("myModal").style.display = "block";
}

document.addEventListener("DOMContentLoaded", function () {
    let searchtimer;

    window.addEventListener("DOMContentLoaded", () => {
        document.querySelector("#search").addEventListener("input", (e) => {
            clearTimeout(searchtimer);

            let el = e.target;
            let start = el.selectionStart;
            let end = el.selectionEnd;
            el.value = el.value.toLowerCase();
            el.setSelectionRange(start, end);

            searchtimer = setTimeout(() => {
                if (e.target.value != "" && e.target.value != null) {
                    document.getElementById("tbody").innerHTML = "loading...";
                    dbSearch(e.target.value);
                }
            }, 1000);
        });
    });

    let modal = document.getElementById("myModal");

    document.querySelector(".close").onclick = function () {
        modal.style.display = "none";
    };

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };

    document.getElementById("search").focus();
});

window.onkeydown = function (event) {
    if (event.keyCode == 27) {
        document.getElementById("myModal").style.display = "none";
    }
};

function toggleTr(target) {
    let y = document.getElementById("toggle_" + target);

    if (y.style.background === "black") {
        y.style.background = "rgb(107, 107, 107)";
    } else {
        y.style.background = "black";
    }

    document.querySelectorAll("tr").forEach(function (element) {
        element.style.display = "table-row";
    });

    document.querySelectorAll("button").forEach(function (element) {
        if (element.style.background === "black") {
            document
                .querySelectorAll("tr." + element.textContent)
                .forEach(function (element) {
                    element.style.display = "none";
                });
        }
    });
}
