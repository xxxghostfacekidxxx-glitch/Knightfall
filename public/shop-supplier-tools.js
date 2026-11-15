(() => {
"use strict";
const API = "https://api.ash-fall.com";
const q = selector => document.querySelector(selector);
const money = cents => (cents / 100).toLocaleString("en-US", {style:"currency",currency:"USD"});
const getNumber = name => {
  const el = q('[name="' + name + '"]');
  return el && el.value.trim() !== "" ? Number(el.value) : NaN;
};
function calculate() {
  const sale = getNumber("calc_sale");
  const item = getNumber("calc_item");
  const shipping = getNumber("calc_shipping");
  const variable = getNumber("calc_processing_percent");
  const fixed = getNumber("calc_processing_fixed");
  const platform = getNumber("calc_platform_percent");
  const reserve = getNumber("calc_refund_percent");
  const output = q("#profit-output");
  const margin = q("#profit-margin");
  const note = q("#profit-note");
  if (![sale,item,shipping,variable,fixed,platform,reserve].every(Number.isFinite) ||
      [sale,item,shipping,variable,fixed,platform,reserve].some(n => n < 0) ||
      sale > 1000000 || item > 1000000 || shipping > 1000000 ||
      [variable,platform,reserve].some(n => n > 100)) {
    output.textContent = "Enter valid nonnegative amounts";
    margin.textContent = "—";
    note.textContent = "Percentages must be between 0 and 100.";
    return;
  }
  const expenses = item + shipping + sale * (variable + platform + reserve) / 100 + fixed;
  const profit = sale - expenses;
  output.textContent = money(Math.round(profit * 100));
  margin.textContent = sale > 0 ? (profit / sale * 100).toFixed(1) + "%" : "—";
  output.classList.toggle("negative-profit", profit < 0);
  note.textContent = "Estimated cost " + money(Math.round(expenses * 100)) +
    ". Excludes tax, ads, subscriptions, unexpected returns and supplier price changes.";
}
q("#fulfillment-calc")?.addEventListener("input", calculate);
q("#fulfillment-calc")?.addEventListener("change", calculate);
q("#use-product-price")?.addEventListener("click", () => {
  const productPrice = q('#product-form [name="price"]');
  const saleInput = q('[name="calc_sale"]');
  if (!productPrice || !saleInput || productPrice.value.trim() === "") return;
  saleInput.value = productPrice.value;
  calculate();
  q("#fulfillment-calc").scrollIntoView({behavior:"smooth", block:"center"});
});
calculate();
const checkboxes = [...document.querySelectorAll('#launch-checklist input[type="checkbox"]')];
function checklist() {
  const completed = checkboxes.filter(box => box.checked).length;
  q("#launch-progress").textContent = completed + " of " + checkboxes.length +
    " preparation checks reviewed. This is a planning checklist; it cannot enable payments.";
}
checkboxes.forEach(box => box.addEventListener("change", checklist));
checklist();

function parseCSV(source) {
  const text = source.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i=0; i<text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i+1] === '"') { cell += '"'; i++; }
        else quoted = false;
      } else cell += ch;
    } else if (ch === '"') {
      if (cell.length) throw Error("Malformed quote in CSV.");
      quoted = true;
    } else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") {
      row.push(cell); rows.push(row); row = []; cell = "";
    } else if (ch !== "\r") cell += ch;
  }
  if (quoted) throw Error("Unclosed quoted field in CSV.");
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ""));
}
function readImportRows(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) throw Error("CSV must have headers and at least one product.");
  const headers = rows.shift().map(h => h.trim().toLowerCase());
  const nameIndex = headers.indexOf("name");
  const priceCentsIndex = headers.indexOf("price_cents");
  const priceIndex = headers.indexOf("price");
  if (nameIndex < 0 || (priceCentsIndex < 0 && priceIndex < 0))
    throw Error('CSV needs "name" and either "price_cents" or "price" headers.');
  if (rows.length > 10) throw Error("Import at most 10 products per batch. Split the CSV into smaller files.");
  const index = col => headers.indexOf(col);
  const get = (row,col) => index(col)<0 ? "" : String(row[index(col)]||"").trim();
  return rows.map((row,i) => {
    const name = String(row[nameIndex]||"").trim();
    const centsText = priceCentsIndex >= 0 ? String(row[priceCentsIndex]||"").trim() : "";
    const dollarsText = priceIndex >= 0 ? String(row[priceIndex]||"").trim() : "";
    const priceCents = priceCentsIndex >= 0 ? Number(centsText) : Math.round(Number(dollarsText)*100);
    const imageURL = get(row,"image_url"), supplierURL = get(row,"supplier_url");
    const validURL = value => { try { const u = new URL(value); return u.protocol==="https:" || u.protocol==="http:"; } catch {return false;} };
    if (!name || name.length>100 || !Number.isSafeInteger(priceCents) ||
        priceCents<0 || priceCents>100000000 || (!centsText && !dollarsText) ||
        get(row,"description").length>2000 || imageURL.length>2000 || supplierURL.length>2000 ||
        (imageURL && !validURL(imageURL)) || (supplierURL && !validURL(supplierURL)))
      throw Error("Invalid name, price, description, or URL on CSV product row " + (i+2) + ".");
    return {name,description:get(row,"description"),price_cents:priceCents,
      image_url:imageURL,supplier_url:supplierURL};
  });
}
const showImport = (message,error=false) => {
  const output = q("#import-status");
  if (output) { output.textContent = message; output.classList.toggle("import-error", error); }
};
q("#download-csv-template")?.addEventListener("click", () => {
  const blob = new Blob(["name,description,price_cents,image_url,supplier_url\r\n"],{type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob), anchor = document.createElement("a");
  anchor.href = url; anchor.download = "knightfall-product-import-template.csv";
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
q("#import-catalog")?.addEventListener("click", async () => {
  const file = q("#catalog-file")?.files?.[0];
  if (!file) {showImport("Choose a CSV file to import.",true);return;}
  if (file.size>100000) {showImport("CSV exceeds the 100 KB import limit.",true);return;}
  let items;
  try {items=readImportRows(await file.text());}
  catch (error) {showImport(error.message,true);return;}
  const button=q("#import-catalog");
  button.disabled=true;
  let added=0;
  try {
    for (const item of items) {
      showImport("Importing product " + (added+1) + " of " + items.length + "…");
      const response=await fetch(API+"/api/my-shop/products",{
        method:"POST",credentials:"include",cache:"no-store",
        headers:{"content-type":"application/json"},body:JSON.stringify(item)
      });
      const data=await response.json().catch(()=>({}));
      if (!response.ok) throw Error(data.error||"Import stopped (HTTP "+response.status+").");
      added++;
    }
    showImport(added+" products imported. Reload the page to see them in your inventory.");
    q("#catalog-file").value="";
  } catch(error) {
    showImport(added+" of "+items.length+" imported; remaining products were not submitted. "+error.message,true);
  } finally {button.disabled=false;}
});
})();