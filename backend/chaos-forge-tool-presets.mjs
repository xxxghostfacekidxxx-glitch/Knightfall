// Catalog of original task specifications with independent expected outputs.
import {buildWebProject} from "./chaos-forge-web-project.mjs";
import {buildProject} from "./chaos-forge-project.mjs";
const presets={
 "price calculator":{name:"price-calculator",title:"Price Calculator",source:"input price: number; input quantity: number; let total = mul(price, quantity); return total;",labels:{price:"Unit price",quantity:"Quantity"},examples:[{values:[10,3],expected:30},{values:[2.5,4],expected:10},{values:[0,1],expected:0}],description:"Multiply unit price by quantity, without tax."},
 "temperature converter":{name:"temperature-converter",title:"Fahrenheit to Celsius",source:"input fahrenheit: number; let shifted = sub(fahrenheit, 32); let scaled = mul(shifted, 5); let celsius = div(scaled, 9); return celsius;",labels:{fahrenheit:"Temperature (°F)"},examples:[{values:[32],expected:0},{values:[212],expected:100},{values:[-40],expected:-40}],description:"Convert Fahrenheit to Celsius."},
 "word counter":{name:"word-counter",title:"Word Counter",source:"input text: text; let tokens = words(text); let count = countTexts(tokens); return count;",labels:{text:"Enter text"},examples:[{values:["one two"],expected:2},{values:[""],expected:0},{values:[" one  two three "],expected:3}],description:"Count whitespace-separated words."},
 "text cleaner":{name:"text-cleaner",title:"Text Cleaner",source:"input text: text; let clean = trim(text); let result = lower(clean); return result;",labels:{text:"Text to normalize"},examples:[{values:[" A "],expected:"a"},{values:["HELLO"],expected:"hello"},{values:[""],expected:""}],description:"Trim surrounding whitespace and lowercase text."},
 "array statistics":{name:"array-statistics",title:"Average Calculator",source:"input values: numbers; let result = mean(values); return result;",labels:{values:"Number array (JSON)"},examples:[{values:[[1,2,3]],expected:2},{values:[[10,20]],expected:15},{values:[[-3,3]],expected:0}],description:"Calculate the arithmetic mean of a nonempty numeric array."},
 "unique words":{name:"unique-words",title:"Unique Word List",source:"input text: text; let clean = lower(text); let tokens = words(clean); let unique = uniqueTexts(tokens); let result = join(unique, \", \"); return result;",labels:{text:"Enter text"},examples:[{values:["Hello hello world"],expected:"hello, world"},{values:[" A B a "],expected:"a, b"},{values:[""],expected:""}],description:"Lowercase, deduplicate and join whitespace-separated words."},
 "positive sum":{name:"positive-sum",title:"Positive Sum",source:"input values: numbers; let positive = filterPositive(values); let total = sum(positive); return total;",labels:{values:"Number array (JSON)"},examples:[{values:[[1,-2,3]],expected:4},{values:[[-1,-2]],expected:0},{values:[[]],expected:0}],description:"Sum positive values, excluding zero and negative numbers."},
 "discount calculator":{name:"discount-calculator",title:"Discount Calculator",source:"input price: number; input percent: number; let fraction = div(percent, 100); let discount = mul(price, fraction); let total = sub(price, discount); return total;",labels:{price:"Original price",percent:"Discount percentage"},examples:[{values:[100,25],expected:75},{values:[50,0],expected:50},{values:[20,100],expected:0}],description:"Calculate price after percentage discount; input range is not restricted."}
};
export function toolPresets(){return Object.entries(presets).map(([name,p])=>({name,description:p.description}));}
export function buildPresetTool(request){
 const text=typeof request==="string"?request.trim().toLowerCase():"";
 const match=text.match(/^(?:(?:an?|the)\s+)?([a-z ]+?)(?:\s+(?:as|in)\s+(browser|node))?(?:\s+with\s+(inferno|neon|obsidian|celestial)\s+theme)?$/);
 if(!match||!Object.hasOwn(presets,match[1].trim()))throw Error("Choose a documented tool preset. Use Tool presets: for the list. Arbitrary natural language generation is not supported.");
 const p=presets[match[1].trim()],spec={source:p.source,examples:p.examples},input={name:p.name,title:p.title,kind:"source",theme:match[3]||"inferno",labels:p.labels,spec};
 const a=match[2]==="node"?buildProject(input):buildWebProject(input);
 return {...a,report:{...a.report,preset:match[1].trim(),description:p.description}};
}
