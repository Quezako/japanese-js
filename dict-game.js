async function start() {
	const sqlPromise = await initSqlJs({
	  locateFile: file => `sql-wasm.wasm`
	});

	const dataPromise = fetch("../assets/db/dict.db").then(res => res.arrayBuffer());
	const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
	const db = new SQL.Database(new Uint8Array(buf));
	const stmt = db.prepare("SELECT * FROM dict WHERE tags LIKE '%JLPT::5%' ORDER BY RANDOM() LIMIT 1");
	const result = stmt.getAsObject({':aval' : 1, ':bval' : 'world'});

	document.body.innerHTML += (result.desc.replace(/[A-z]/g, "").trim().split('\n').splice(1).join("<br />"));
	document.body.innerHTML += (`<br><br><details><summary>Answer:</summary>${result.desc.split('\n')[0]}</details>`);
}