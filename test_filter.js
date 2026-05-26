const records = [
  { updated_at: "2026-05-26T03:33:47.182Z" },
  { updated_at: null },
  { updated_at: undefined }
];
console.log(records.filter(r => r.updated_at !== null));
