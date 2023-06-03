async function dbSearch(strSearch) {
	const sqlPromise = await initSqlJs({
	  locateFile: file => 'sql-wasm.wasm'
	});

	var dataPromise = fetch('../assets/db/grammar.db').then(res => res.arrayBuffer());
	var [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
	var db = new SQL.Database(new Uint8Array(buf));

	var stmt = db.prepare(`SELECT \`order\`, Grammar, GramMeaningFR FROM bunpro WHERE GramHira LIKE '%${strSearch}%' GROUP BY Grammar LIMIT 30`);
	var result = stmt.getAsObject({});
	
	// var tbody = document.getElementById('tbody');
	var strTable = '';
	var rowResult = Object.values(result);
	strRuby = `<ruby>${rowResult[1].replace(/\[/g, '<rt>').replace(/\]/g, '</rt>')}</ruby>`;
	strTable += `<tr class="gramm"><td onclick="javascript:openDiv('${rowResult[0]}')"><a>${strRuby}</a><br>${rowResult[2]}</td></tr>`;

	while(stmt.step()) {
		const result = stmt.getAsObject();
		rowResult = Object.values(result);
		strRuby = `<ruby>${rowResult[1].replace(/\[/g, '<rt>').replace(/\]/g, '</rt>')}</ruby>`;
		strTable += `<tr class="gramm"><td onclick="javascript:openDiv('${rowResult[0]}')"><a>${strRuby}</a><br>${rowResult[2]}</td></tr>`;
	}
	
	// document.getElementById('tbody').innerHTML = strTable;


	dataPromise = fetch('../assets/db/vocab.db').then(res => res.arrayBuffer());
	[SQL, buf] = await Promise.all([sqlPromise, dataPromise])
	db = new SQL.Database(new Uint8Array(buf));

	stmt = db.prepare(`SELECT key, mean, \`order\` FROM Quezako WHERE version LIKE '%${strSearch}%' ORDER BY \`order\` LIMIT 30`);
	result = stmt.getAsObject({});
	
	// var tbody = document.getElementById('tbody');
	// var strTable = '';
	var rowResult = Object.values(result);
	strRuby = `<ruby>${rowResult[0].replace(/\[/g, '<rt>').replace(/\]/g, '</rt>')}</ruby>`;
	strTable += `<tr class="voc"><td onclick="javascript:openDiv('${rowResult[0]}')"><a>${strRuby}</a><br>${rowResult[1]}</td></tr>`;

	while(stmt.step()) {
		const result = stmt.getAsObject();
		rowResult = Object.values(result);
		strRuby = `<ruby>${rowResult[0].replace(/\[/g, '<rt>').replace(/\]/g, '</rt>')}</ruby>`;
		strTable += `<tr class="voc"><td onclick="javascript:openDiv('${rowResult[0]}')"><a>${strRuby}</a><br>${rowResult[1]}</td></tr>`;
	}
	
	document.getElementById('tbody').innerHTML = strTable;
}

async function openDiv(varKey) {
	const sqlPromise = await initSqlJs({
	  locateFile: file => 'sql-wasm.wasm'
	});

	if (Number.isInteger(varKey*1)) {
		const dataPromise = fetch('../assets/db/grammar.db').then(res => res.arrayBuffer());
		const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
		const db = new SQL.Database(new Uint8Array(buf));
	
		const stmt = db.prepare(`SELECT tags, Grammar, GramMeaningFR, GrammarStructureFR, GrammarNuanceFR, Sentence, SentenceFR, SentenceNuanceFR, SupplementalLinksFR, OfflineResourcesFR, GramMeaning, GrammarStructure, GrammarNuance, SentenceEN, SentenceNuance, SupplementalLinks, OfflineResources, SentenceAudio FROM bunpro WHERE \`order\` = ${varKey}`);
		const result = stmt.getAsObject({});
		var strTable = '';

		for (var [key, val] of Object.entries(result)) {
			if (val != null) {
				if (key == 'Sentence' || key == 'Grammar') {
					arrVal = val.split(' ');
					val = '';
					arrVal.forEach(subVal => 
						val += `<ruby>${subVal.toString().replace(/\[/g, '<rt>').replace(/\]/g, '</rt>')}</ruby>`
					);
					val = val.replace(/{{c1::/g, '<span style="color:red">').replace(/}}/g, '</span>');
				}
				strTable += `<tr class="gramm"><td><b>${key} :<br></b>${val}</td></tr>`;
			}
		}
	} else {
		const dataPromise = fetch('../assets/db/vocab.db').then(res => res.arrayBuffer());
		const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
		const db = new SQL.Database(new Uint8Array(buf));
	
		const stmt = db.prepare(`SELECT Tags, key, yomi, mean, voc_image, en_mean, voc_notes_personal, kanji_mnemo_personal, read_mnemo_personal, voc_sentence_ja, voc_sentence_fr, voc_sentence_img, chmn_mean, fr_components2, voc_alts, fr_mean_mnemo_wani, fr_compo_wani_name, fr_story_wani_mean, fr_mean_mnemo_wani2, fr_mean_mnemo_wani3, en_reading_info, en_reading_mnemonic, en_reading_mnemonic2, fr_chmn_mnemo, en_chmn_mnemo, kun_pre, kun_post, voc_furi, kanji_only, onyomi, kunyomi, kb_img, fr_kb_desc, jkm, en_jkm_headline, en_jkm_subtitle, fr_story, fr_component, fr_koohii_story_1, fr_koohii_story_2, fr_koohii_3, fr_story_rtk, fr_memrise_hint, fr_story_rtk_comment, fr_components3, compo_wani, fr_word, stroke_order, fr_notes, fr_voc_notes, en_heisigcomment, chmn_simple, chmn_lookalike, chmn_ref, kd_used_in_kanjis, primitive_of, usually_kana, version, \`order\`, voc_mp3, voc_sentence_audio FROM Quezako WHERE key = "${varKey}"`);
		const result = stmt.getAsObject({});
		var strTable = '';
	
		for (var [key, val] of Object.entries(result)) {
			if (val != null) {
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
	
				strTable += `<tr class="voc"><td><b>${key} :<br></b>${val}</td></tr>`;
			}
		}
	}
	
	document.querySelector('.dynamicText').innerHTML = `<table>${strTable}</table>`;
	document.getElementById('myModal').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function(event) { 
	var input = document.getElementById('search');

	var searchtimer;
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

	var modal = document.getElementById('myModal');
	var span = document.getElementsByClassName('close')[0];

	document.querySelector('.close').onclick = function() {
	  modal.style.display = 'none';
	}

	window.onclick = function(event) {
	  if (event.target == modal) {
		modal.style.display = 'none';
	  }
	}
	
	document.getElementById('search').focus();
});

window.onkeydown = function( event ) {
    if ( event.keyCode == 27 ) {
        document.getElementById('myModal').style.display = 'none';
    }
};
