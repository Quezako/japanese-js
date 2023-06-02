async function dbSearch(strSearch) {
	const sqlPromise = await initSqlJs({
	  locateFile: file => `sql-wasm.wasm`
	});

	const dataPromise = fetch("jp-grammar.db").then(res => res.arrayBuffer());
	const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
	const db = new SQL.Database(new Uint8Array(buf));

	const stmt = db.prepare("SELECT `order`, Grammar, GramMeaningFR FROM bunpro WHERE GramHira LIKE $search GROUP BY Grammar");
	const result = stmt.getAsObject({$search:'%'+strSearch+'%'});
	
	var tbody = document.getElementById('tbody');
	var strTable = '';
	rowResult = Object.values(result);
	strTable += `<tr><td onclick='javascript:openDiv("`+rowResult[0]+`")'><a>`+rowResult[1]+`</a><br>`+rowResult[2]+`</td></tr>`;

	while(stmt.step()) {
		const result = stmt.getAsObject();
		rowResult = Object.values(result);
		strTable += `<tr><td onclick='javascript:openDiv("`+rowResult[0]+`")'><a>`+rowResult[1]+`</a><br>`+rowResult[2]+`</td></tr>`;
	}
	
	document.getElementById('tbody').innerHTML = strTable;
}

async function openDiv(intRow) {
	const sqlPromise = await initSqlJs({
	  locateFile: file => `sql-wasm.wasm`
	});

	const dataPromise = fetch("jp-grammar.db").then(res => res.arrayBuffer());
	const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
	const db = new SQL.Database(new Uint8Array(buf));

	const stmt = db.prepare("SELECT tags, Grammar, GramMeaningFR, GrammarStructureFR, GrammarNuanceFR, Sentence, SentenceFR, SentenceNuanceFR, SupplementalLinksFR, OfflineResourcesFR, GramMeaning, GrammarStructure, GrammarNuance, SentenceEN, SentenceNuance, SupplementalLinks, OfflineResources, SentenceAudio FROM bunpro WHERE `order` = $intRow");
	const result = stmt.getAsObject({$intRow:intRow});
	
	var tbody = document.getElementById('tbody');
	var strTable = '';
	for (var [key, val] of Object.entries(result)) {
		if (val != null) {
			if (key == 'Sentence') {
				arrVal = val.split(" ");
				val = '';
				arrVal.forEach(subVal => 
					val += '<ruby>'+subVal.toString().replace(/\[/g, "<rt>").replace(/\]/g, "</rt>")+'</ruby>'
				);
				val = val.replace(/{{c1::/g, "<span style='color:red'>").replace(/}}/g, "</span>");
			}
			strTable += `<tr><td><b>${key} :<br></b>`+val+`</td></tr>`;
		}
	}
	
	document.querySelector(".dynamicText").innerHTML = '<table>'+strTable+'</table>';
	document.getElementById("myModal").style.display = "block";
}

document.addEventListener("DOMContentLoaded", function(event) { 
	var input = document.getElementById('search');
	wanakana.bind(input);

	var searchtimer;
	window.addEventListener("DOMContentLoaded", () => {
	  document.querySelector("#search").addEventListener("input", (e) => {
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

	var modal = document.getElementById("myModal");
	var span = document.getElementsByClassName("close")[0];

	document.querySelector(".close").onclick = function() {
	  modal.style.display = "none";
	}

	window.onclick = function(event) {
	  if (event.target == modal) {
		modal.style.display = "none";
	  }
	}
	
	document.getElementById("search").focus();
});