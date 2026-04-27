let sqlJsPromise;
let grammarDbPromise;
let dbBackendPromise;

const HTTPVFS_WORKER_URL = new URL('../assets/vendor/sql.js-httpvfs/sqlite.worker.js', location.href).href;
const HTTPVFS_WASM_URL   = new URL('../assets/vendor/sql.js-httpvfs/sql-wasm.wasm',    location.href).href;
const GRAMMAR_DB_URL     = new URL('../assets/db/grammar.sqlite',                       location.href).href;
const SQLITE_PAGE_SIZE = 4096;
const ALLOW_FULL_DB_FALLBACK = false;

function toRubyText(value) {
    return `<ruby>${value.replace(/\[/g, '<rt>').replace(/\]/g, '</rt>')}</ruby>`;
}

function getSqlJs() {
    if (!sqlJsPromise) {
        sqlJsPromise = initSqlJs({
            locateFile: file => 'sql-wasm.wasm'
        });
    }
    return sqlJsPromise;
}

function getGrammarDb() {
    if (!grammarDbPromise) {
        grammarDbPromise = (async () => {
            const SQL = await getSqlJs();
            const response = await fetch(GRAMMAR_DB_URL, { cache: 'force-cache' });
            const buffer = await response.arrayBuffer();
            return new SQL.Database(new Uint8Array(buffer));
        })().catch((error) => {
            grammarDbPromise = null;
            throw error;
        });
    }
    return grammarDbPromise;
}

async function hasHttpRangeSupport(url) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { Range: 'bytes=0-0' },
            cache: 'no-store'
        });

        const contentRange = response.headers.get('Content-Range') || '';
        return response.status === 206 && contentRange.toLowerCase().startsWith('bytes 0-0/');
    } catch (error) {
        console.warn('Range probe failed', error);
        return false;
    }
}

async function getDbBackend() {
    if (!dbBackendPromise) {
        dbBackendPromise = (async () => {
            const hasRangeSupport = await hasHttpRangeSupport(GRAMMAR_DB_URL);

            if (typeof createDbWorker === 'function') {
                try {
                    if (!hasRangeSupport) {
                        throw new Error('Server does not support HTTP Range requests (status 206 + Content-Range expected).');
                    }

                    const workerResult = await createDbWorker(
                        [{
                            from: 'inline',
                            config: {
                                serverMode: 'full',
                                requestChunkSize: SQLITE_PAGE_SIZE,
                                url: GRAMMAR_DB_URL
                            }
                        }],
                        HTTPVFS_WORKER_URL,
                        HTTPVFS_WASM_URL
                    );

                    return {
                        mode: 'httpvfs',
                        worker: workerResult
                    };
                } catch (error) {
                    console.warn('HTTP VFS indisponible, fallback sql.js', error);
                }
            }

            if (!ALLOW_FULL_DB_FALLBACK) {
                throw new Error('Mode offline partiel impossible: serveur sans HTTP Range. Active Range (206) ou autorise temporairement ALLOW_FULL_DB_FALLBACK.');
            }

            const db = await getGrammarDb();
            return {
                mode: 'sqljs',
                db
            };
        })().catch((error) => {
            dbBackendPromise = null;
            throw error;
        });
    }

    return dbBackendPromise;
}

function mapExecRows(execResult) {
    if (!execResult || execResult.length === 0) {
        return [];
    }

    const firstResult = execResult[0];
    const columns = firstResult.columns || [];
    const values = firstResult.values || [];

    return values.map((row) => {
        const objectRow = {};
        columns.forEach((columnName, index) => {
            objectRow[columnName] = row[index];
        });
        return objectRow;
    });
}

async function queryRows(sql, params = []) {
    const backend = await getDbBackend();

    if (backend.mode === 'httpvfs') {
        const execResult = await backend.worker.db.exec(sql, params);
        return mapExecRows(execResult);
    }

    const stmt = backend.db.prepare(sql);
    stmt.bind(params);
    const rows = [];

    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }

    stmt.free();
    return rows;
}

async function dbSearch(strSearch) {
    let rows = [];
    try {
        rows = await queryRows(
            'SELECT b."order", b.Grammar, b.GramMeaningFR FROM bunpro_fts f JOIN Bunpro b ON b.rowid = f.rowid WHERE bunpro_fts MATCH ? GROUP BY b.Grammar ORDER BY b."order" LIMIT 30',
            [`${strSearch}*`]
        );
    } catch (error) {
        console.error(error);
        document.getElementById('tbody').innerHTML = 'Erreur: serveur non compatible HTTP Range (206). Impossible de requêter SQLite sans téléchargement complet.';
        return;
    }

    let strTable = '';
    rows.forEach((result) => {
        const strRuby = toRubyText(result.Grammar || '');
        strTable += `<tr><td onclick="javascript:openDiv('${result.order}')"><a>${strRuby}</a><br>${result.GramMeaningFR || ''}</td></tr>`;
    });

    document.getElementById('tbody').innerHTML = strTable;
}

async function openDiv(intRow) {
    let rows = [];
    try {
        rows = await queryRows(
            'SELECT tags, Grammar, GramMeaningFR, GrammarStructureFR, GrammarNuanceFR, Sentence, SentenceFR, SentenceNuanceFR, SupplementalLinksFR, OfflineResourcesFR, GramMeaning, GrammarStructure, GrammarNuance, SentenceEN, SentenceNuance, SupplementalLinks, OfflineResources, SentenceAudio FROM bunpro WHERE `order` = ?',
            [Number(intRow)]
        );
    } catch (error) {
        console.error(error);
        return;
    }

    if (rows.length === 0) {
        return;
    }

    const result = rows[0];

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