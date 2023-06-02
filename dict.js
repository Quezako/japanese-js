async function start() {
	const sqlPromise = await initSqlJs({
	  locateFile: file => `sql-wasm.wasm`
	});

	const dataPromise = fetch("dict.db").then(res => res.arrayBuffer());
	const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
	const db = new SQL.Database(new Uint8Array(buf));

	const stmt = db.prepare("SELECT * FROM dict WHERE tags LIKE '%JLPT::5%' ORDER BY RANDOM() LIMIT 1");

	const result = stmt.getAsObject({':aval' : 1, ':bval' : 'world'});

	// console.log(result);
	var tbody = document.getElementById('tbody');
	// console.log(Object.keys(result).length);

	// for (const [key, value] of Object.entries(result)) {
	  // console.log(`${key}: ${value}`);
	  // document.getElementById('tbody').innerHTML += `<tr><td>${key}</td><td>${value}</td></tr>`;
	// }

	document.body.innerHTML += (result.desc.replace(/[A-z]/g, "").trim().split('\n').splice(1).join("<br />"));
	document.body.innerHTML += ('<br><br><details><summary>Answer:</summary>'+result.desc.split('\n')[0]+'</details>');
}