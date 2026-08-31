import { readFile, readdir, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { validateSafari } from './safari.mjs';
const config = JSON.parse(await readFile('apple/configuration.json'));
const release = process.argv.includes('--release');
const argument = process.argv.find(arg => arg.startsWith('--app='));
const app = argument?.slice(6) ?? `build/apple-${release ? 'release' : 'debug'}-signed/Build/Products/${release ? 'Release' : 'Debug'}/YouTube UI Cleaner.app`;
function command(name, args) {
  const result = spawnSync(name,args,{encoding:'utf8'});
  if (result.status !== 0) throw new Error(`${name}: ${result.stderr}`);
  return result.stdout;
}
const plist = file => JSON.parse(command('plutil',['-convert','json','-o','-',file]));
const failures=[];
const check=(condition,message)=>{if(!condition) failures.push(message);};
if (release) {
  check(/^\d+$/.test(config.appStoreID),'Numeric App Store ID is missing');
  for (const key of ['supportURL','privacyURL']) check(/^https:\/\//.test(config[key]),`${key} is unresolved`);
}
await validateSafari('dist/safari');
for (const [bundle,id] of [[app,config.bundleID],[path.join(app,'Contents/PlugIns/YouTube UI Cleaner Extension.appex'),config.extensionBundleID]]) {
  const info=plist(path.join(bundle,'Contents/Info.plist'));
  check(info.CFBundleIdentifier===id,`Incorrect bundle ID: ${id}`);
  check(info.CFBundleShortVersionString===config.version && info.CFBundleVersion===config.build,`Version/build mismatch: ${id}`);
  check(info.LSMinimumSystemVersion===config.minimumMacOS,`Deployment mismatch: ${id}`);
  const arches=command('lipo',['-archs',path.join(bundle,'Contents/MacOS',info.CFBundleExecutable)]).trim().split(/\s+/).sort();
  check(JSON.stringify(arches)===JSON.stringify(['arm64','x86_64']),`Missing architecture: ${id}`);
  if(!process.argv.includes('--unsigned')) {
    command('codesign',['--verify','--strict',bundle]);
    const result=spawnSync('codesign',['-d','--entitlements',':-',bundle],{encoding:'utf8'});
    check(result.status===0 && /<key>com.apple.security.app-sandbox<\/key>\s*<true\/>/.test(result.stdout),`Sandbox missing: ${id}`);
    const signing=spawnSync('codesign',['-dv',bundle],{encoding:'utf8'});
    check(signing.stderr.includes(`TeamIdentifier=${config.teamID}`),`Wrong signing team: ${id}`);
  }
  if(id===config.bundleID) {
    check(info.LSApplicationCategoryType===config.category,'App category mismatch');
    check(info.CFBundleURLTypes?.[0]?.CFBundleURLSchemes?.[0]===config.urlScheme,'Support URL scheme mismatch');
    const bundled=JSON.parse(await readFile(path.join(bundle,'Contents/Resources/configuration.json')));
    check(JSON.stringify(bundled)===JSON.stringify(config),'Bundled configuration is stale');
  } else {
    const resources=path.join(bundle,'Contents/Resources');
    const manifest=JSON.parse(await readFile(path.join(resources,'manifest.json')));
    for(const file of [...Object.values(manifest.icons),manifest.action.default_popup,...manifest.content_scripts.flatMap(script=>[...script.js,...script.css])]) await access(path.join(resources,file));
    for(const locale of await readdir(path.join(resources,'_locales'))) {
      const messages=JSON.parse(await readFile(path.join(resources,'_locales',locale,'messages.json')));
      check(Array.from(messages.extensionName.message).length<=40,`Safari name too long: ${locale}`);
    }
    await validateSafari(resources);
  }
}
if(failures.length) throw new Error(failures.join('\n'));
console.log(`Apple artifact validation passed (${release ? 'release metadata' : 'development'}, ${process.argv.includes('--unsigned')?'unsigned':'signed'}). This is not runtime or App Review approval.`);
