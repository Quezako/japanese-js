async function dbSearch(strSearch) {
	const sqlPromise = await initSqlJs({
	  locateFile: file => 'sql-wasm.wasm'
	});

	const dataPromise = fetch('../assets/db/vocab.db').then(res => res.arrayBuffer());
	const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
	const db = new SQL.Database(new Uint8Array(buf));

	const stmt = db.prepare(`SELECT key, mean, \`order\` FROM Quezako WHERE key LIKE '%${strSearch}%' ORDER BY \`order\``);
	const result = stmt.getAsObject({});
	
	var tbody = document.getElementById('tbody');
	var strTable = '';
	var rowResult = Object.values(result);
	strRuby = `<ruby>${rowResult[0].replace(/\[/g, '<rt>').replace(/\]/g, '</rt>')}</ruby>`;
	strTable += `<tr><td onclick="javascript:openDiv('${rowResult[0]}')"><a>${strRuby}</a><br>${rowResult[1]}</td></tr>`;

	while(stmt.step()) {
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

	const stmt = db.prepare(`SELECT * FROM Quezako WHERE key = "${intRow}"`);
	const result = stmt.getAsObject({});
	
	var tbody = document.getElementById('tbody');
	var strTable = '';

	for (var [key, val] of Object.entries(result)) {
		if (val != null) {
			if (key == 'key' || key == 'voc_furi' || key == 'voc_sentence_ja') {
				arrVal = val.split(' ');
				val = '';
				arrVal.forEach(subVal => 
					val += `<ruby>${subVal.toString().replace(/\[/g, '<rt>').replace(/\]/g, '</rt>')}</ruby>`
				);
			}

			strTable += `<tr><td><b>${key} :<br></b>${val}</td></tr>`;
		}
	}
	
	document.querySelector('.dynamicText').innerHTML = `<table>${strTable}</table>`;
	document.getElementById('myModal').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function(event) { 
	var input = document.getElementById('search');
	wanakana.bind(input);

	var searchtimer;
	window.addEventListener('DOMContentLoaded', () => {
	  document.querySelector('#search').addEventListener('input', (e) => {
		clearTimeout(searchtimer);
		searchtimer = setTimeout(() => {
			console.log(e.target.value);
			dbSearch(e.target.value);
		}, 500);
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