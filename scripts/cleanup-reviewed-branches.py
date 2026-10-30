"""Delete only the closed, unmerged Electron upgrade already rejected in PR 187.

The owner requested branch cleanup. An exact head lease and PR check prevent this
one-time cleanup from touching active or newly updated work. The main branch is
never a deletion candidate. GitHub retains the rejected proposal in the closed PR.
"""
import json
import os
import urllib.error
import urllib.parse
import urllib.request

repo = os.environ['GH_REPO']
branch = 'dependabot/npm_and_yarn/public/arcade/hosted/interstellar-armada/npm_and_yarn-db136f4ed7'
expected = 'dc0621dba8a408d8328ae3281007f99fa743039b'

def api(path, method='GET', allow_missing=False):
    req = urllib.request.Request('https://api.github.com/repos/' + repo + '/' + path, method=method,
        headers={'Authorization': 'Bearer ' + os.environ['GH_TOKEN'], 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'})
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            body = response.read()
            return json.loads(body) if body else None
    except urllib.error.HTTPError as error:
        if error.code == 404 and allow_missing: return None
        raise

refpath = 'git/refs/heads/' + urllib.parse.quote(branch, safe='')
ref = api(refpath, allow_missing=True)
if ref is None:
    print('Reviewed obsolete branch is already absent.')
else:
    if ref['object']['sha'] != expected: raise SystemExit('Branch changed after review; refusing deletion.')
    pr = api('pulls/187')
    if pr['state'] != 'closed' or pr['merged'] or pr['head']['ref'] != branch or pr['head']['sha'] != expected:
        raise SystemExit('PR 187 no longer matches the reviewed, rejected upgrade; refusing deletion.')
    if api(refpath)['object']['sha'] != expected: raise SystemExit('Branch changed during review; refusing deletion.')
    api(refpath, method='DELETE')
    if api(refpath, allow_missing=True) is not None: raise SystemExit('Branch deletion was not verified.')
    print('Deleted reviewed obsolete Electron upgrade branch; PR 187 preserves its proposal.')

branches = api('branches?per_page=100')
print('Remaining branches:', ', '.join(item['name'] for item in branches))
