const { $fetch } = require('ofetch');
async function test() {
  try {
    const res = await $fetch('http://localhost:3000/api/ipl?period=2026-05');
    console.log("Total records:", res.records.length);
    if(res.records.length > 0) {
      console.log("First record:", res.records[0]);
    }
    console.log("isGenerated:", res.isGenerated);
  } catch(e) {
    console.error("Error:", e.message);
  }
}
test();
