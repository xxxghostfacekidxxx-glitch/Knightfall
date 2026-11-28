// Local export of the existing software report, no network access.
const scalar=v=>v==null?"":typeof v==="object"?JSON.stringify(v):String(v);
const fields=r=>[["Project",r.project],["Source",r.source],["Description",r.description],["License",r.license],["Language",r.language],["Release",r.latestRelease],["Stars",r.stars],["Open issues",r.openIssues],["Last push",r.lastPush],["Checked",r.checkedAt],["Languages",r.languages],["License file",r.licenseFile],["Files",r.projectFiles],["Sections",r.sections],["Source endpoints",r.sourceEndpoints]];
const html=v=>scalar(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const csv=v=>{let s=scalar(v);if(/^[\s]*[=+\-@\t\r\n]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
const md=v=>html(v).replace(/\\/g,"\\\\").replace(/[|*_\[\]#]/g,"\\$&").replace(/\r?\n/g," ");
export function exportSoftwareReport(report,format="json"){
 if(!report||typeof report.project!=="string"||!report.project)throw Error("No report selected");
 const rows=fields(report),stem=report.project.replace(/[^a-z0-9._-]+/gi,"-").slice(0,100)||"project";
 let content,mime;
 switch(format){
 case "json":content=JSON.stringify(report,null,2);mime="application/json";break;
 case "csv":content=[["Field","Value"],...rows].map(row=>row.map(csv).join(",")).join("\r\n");mime="text/csv";break;
 case "md":content="# Alien Eyes software report\n\n| Field | Value |\n| --- | --- |\n"+rows.map(([k,v])=>"| "+md(k)+" | "+md(v)+" |").join("\n");mime="text/markdown";break;
 case "html":content='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src &apos;none&apos;"><title>Alien Eyes report</title></head><body><h1>Alien Eyes software report</h1><table><tbody>'+rows.map(([k,v])=>"<tr><th scope=\"row\">"+html(k)+"</th><td>"+html(v)+"</td></tr>").join("")+"</tbody></table></body></html>";mime="text/html";break;
 default:throw Error("Unsupported format");
 }
 return {content,mime,filename:"alien-eyes-"+stem+"."+format};
}
