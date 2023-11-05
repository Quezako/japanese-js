async function dbSearch(strSearch) {
    const sqlPromise = await initSqlJs({
        locateFile: file => 'sql-wasm.wasm'
    });

    const dataPromise = fetch('../assets/db/grammar.db').then(res => res.arrayBuffer());
    const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
    const db = new SQL.Database(new Uint8Array(buf));

    const stmt = db.prepare(`SELECT \`order\`, Grammar, GramMeaningFR FROM bunpro WHERE GramHira LIKE '%${strSearch}%' GROUP BY Grammar LIMIT 30`);
    const result = stmt.getAsObject({});

    let strTable = '';
    let rowResult = Object.values(result);
    let strRuby = `<ruby>${rowResult[1].replace(/\[/g, '<rt>').replace(/\]/g, '</rt>')}</ruby>`;
    strTable += `<tr><td onclick="javascript:openDiv('${rowResult[0]}')"><a>${strRuby}</a><br>${rowResult[2]}</td></tr>`;

    while (stmt.step()) {
        const result = stmt.getAsObject();
        rowResult = Object.values(result);
        strRuby = `<ruby>${rowResult[1].replace(/\[/g, '<rt>').replace(/\]/g, '</rt>')}</ruby>`;
        strTable += `<tr><td onclick="javascript:openDiv('${rowResult[0]}')"><a>${strRuby}</a><br>${rowResult[2]}</td></tr>`;
    }

    document.getElementById('tbody').innerHTML = strTable;
}

async function openDiv(intRow) {
    const sqlPromise = await initSqlJs({
        locateFile: file => 'sql-wasm.wasm'
    });

    const dataPromise = fetch('../assets/db/grammar.db').then(res => res.arrayBuffer());
    const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
    const db = new SQL.Database(new Uint8Array(buf));

    const stmt = db.prepare(`SELECT tags, Grammar, GramMeaningFR, GrammarStructureFR, GrammarNuanceFR, Sentence, SentenceFR, SentenceNuanceFR, SupplementalLinksFR, OfflineResourcesFR, GramMeaning, GrammarStructure, GrammarNuance, SentenceEN, SentenceNuance, SupplementalLinks, OfflineResources, SentenceAudio FROM bunpro WHERE \`order\` = ${intRow}`);
    const result = stmt.getAsObject({});

    let strTable = '';
    for (let [key, val] of Object.entries(result)) {
        if (val != null) {
            let arrVal = [];
            if (key == 'Sentence' || key == 'Grammar') {
                arrVal = val.split(' ');
                val = '';
                arrVal.forEach(subVal =>
                    val += `<ruby>${subVal.toString().replace(/\[/g, '<rt>').replace(/\]/g, '</rt>')}</ruby>`
                );
                val = val.replace(/{{c1::/g, '<span style="color:red">').replace(/}}/g, '</span>');
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
            }, 1000);
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