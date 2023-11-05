async function dbSearch(strSearch) {
    const sqlPromise = await initSqlJs({
        locateFile: file => 'sql-wasm.wasm'
    });

    const dataPromise = fetch('../assets/db/vocab.db').then(res => res.arrayBuffer());
    const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
    const db = new SQL.Database(new Uint8Array(buf));

    const stmt = db.prepare(`SELECT key, mean, \`order\` FROM Quezako WHERE version LIKE '%${strSearch}%' ORDER BY \`order\` LIMIT 30`);
    const result = stmt.getAsObject({});

    let strTable = '';
    let rowResult = Object.values(result);
    let strRuby = `<ruby>${rowResult[0].replace(/\[/g, '<rt>').replace(/\]/g, '</rt>')}</ruby>`;
    strTable += `<tr><td onclick="javascript:openDiv('${rowResult[0]}')"><a>${strRuby}</a><br>${rowResult[1]}</td></tr>`;

    while (stmt.step()) {
        const result = stmt.getAsObject();
        rowResult = Object.values(result);
        strRuby = `<ruby>${rowResult[0].replace(/\[/g, '<rt>').replace(/\]/g, '</rt>')}</ruby>`;
        strTable += `<tr><td onclick="javascript:openDiv('${rowResult[0]}')"><a>${strRuby}</a><br>${rowResult[1]}</td></tr>`;
    }

    document.getElementById('tbody').innerHTML = strTable;
}

async function openDiv(intRow) {
    const sqlPromise = await initSqlJs({
        locateFile: file => 'sql-wasm.wasm'
    });

    const dataPromise = fetch('../assets/db/vocab.db').then(res => res.arrayBuffer());
    const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
    const db = new SQL.Database(new Uint8Array(buf));

    const stmt = db.prepare(`SELECT Tags, key, yomi, mean, voc_image, en_mean, voc_notes_personal, kanji_mnemo_personal, read_mnemo_personal, voc_sentence_ja, voc_sentence_fr, voc_sentence_img, chmn_mean, fr_components2, voc_alts, fr_mean_mnemo_wani, fr_compo_wani_name, fr_story_wani_mean, fr_mean_mnemo_wani2, fr_mean_mnemo_wani3, en_reading_info, en_reading_mnemonic, en_reading_mnemonic2, fr_chmn_mnemo, en_chmn_mnemo, kun_pre, kun_post, voc_furi, kanji_only, onyomi, kunyomi, kb_img, fr_kb_desc, jkm, en_jkm_headline, en_jkm_subtitle, fr_story, fr_component, fr_koohii_story_1, fr_koohii_story_2, fr_koohii_3, fr_story_rtk, fr_memrise_hint, fr_story_rtk_comment, fr_components3, compo_wani, fr_word, stroke_order, fr_notes, fr_voc_notes, en_heisigcomment, chmn_simple, chmn_lookalike, chmn_ref, kd_used_in_kanjis, primitive_of, usually_kana, version, \`order\`, voc_mp3, voc_sentence_audio FROM Quezako WHERE key = "${intRow}"`);
    const result = stmt.getAsObject({});

    let strTable = '';

    for (let [key, val] of Object.entries(result)) {
        if (val != null) {
            let arrVal = '';
            if (key == 'key' || key == 'voc_furi' || key == 'voc_sentence_ja' || key == 'kanji_only') {
                arrVal = val.split(' ');
                val = '';
                arrVal.forEach(subVal =>
                    val += `<ruby>${subVal.toString().replace(/\[/g, '<rt>').replace(/\]/g, '</rt>')}</ruby>`
                );
            } else if (key == 'voc_image' || key == 'voc_sentence_img') {
                arrVal = val.split('src="');
                val = `${arrVal[0]}src="../assets/img/${arrVal[1]}`;
            }

            strTable += `<tr><td><b>${key} :<br></b>${val}</td></tr>`;
        }
    }

    document.querySelector('.dynamicText').innerHTML = `<table>${strTable}</table>`;
    document.getElementById('myModal').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function (event) {

    let searchtimer;
    window.addEventListener('DOMContentLoaded', () => {
        document.querySelector('#search').addEventListener('input', (e) => {
            clearTimeout(searchtimer);
            searchtimer = setTimeout(() => {
                console.log(e.target.value);
                if (e.target.value != '' && e.target.value != null) {
                    document.getElementById('tbody').innerHTML = 'loading...';
                    dbSearch(e.target.value);
                } else {
                    document.getElementById('tbody').innerHTML = '';
                }
            }, 500);
        });
    });

    let modal = document.getElementById('myModal');

    document.querySelector('.close').onclick = function () {
        modal.style.display = 'none';
    }

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    document.getElementById('search').focus();
});