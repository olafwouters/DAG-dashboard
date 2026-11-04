"""Prevent delayed background reads from reverting colours or falsely locking dialogs."""
from pathlib import Path

path = Path("_site/shared-planner.js")
code = path.read_text(encoding="utf-8")


def replace_once(old, new):
    global code
    if code.count(old) != 1:
        raise ValueError("Shared planner changed; cannot safely patch: " + old)
    code = code.replace(old, new, 1)


replace_once(
    "if(!user||!allowed||reading||busy)return;reading=true;const version=authVersion;",
    "if(!user||!allowed||reading||busy)return;reading=true;const version=authVersion,requestPayload=canonical(snapshot()),requestForm=canonical(readForm());"
)
old = "const {data:row,error}=await client.from('dag_documents').select('payload,revision,updated_at').eq('id','shared').single();if(error)throw error;if(version!==authVersion)return;"
new = old + r"""
  // A request can finish after a newer write. Never move the client revision backwards.
  if(busy){if(force)say('Opslaan is nog bezig. Probeer daarna de gedeelde versie opnieuw te laden.');return;}
  const receivedRevision=Number(row.revision);
  if(!Number.isSafeInteger(receivedRevision)||receivedRevision<0)throw Error('Ongeldige gedeelde revisie.');
  if(revision!==null&&receivedRevision<revision)return;
  if(force&&(canonical(snapshot())!==requestPayload||canonical(readForm())!==requestForm)){
   say('Je hebt tijdens het laden wijzigingen gemaakt. Deze zijn behouden; rond het opslaan af voordat je opnieuw laadt.');return;
  }
"""
replace_once(old, new)
replace_once("if(Number(row.revision)===revision)return;", "if(receivedRevision===revision)return;")
replace_once("await loadRemote(true);};", "clearTimeout(timer);await loadRemote(true);};")
path.write_text(code, encoding="utf-8")
print("Protected shared refreshes against stale responses, in-flight saves and new local edits")
