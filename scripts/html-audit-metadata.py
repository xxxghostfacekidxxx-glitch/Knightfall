"""Read actual HTML tags, keeping comments and script contents out of markup checks."""
import json
import sys
from html.parser import HTMLParser

class Metadata(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids, self.refs, self.scripts = [], [], []
        self.script = None
        self.title = ''
        self.in_title = False
        self.viewport = False
    def handle_starttag(self, tag, pairs):
        attrs = dict(pairs)
        if attrs.get('id'): self.ids.append(attrs['id'])
        for key in ('src', 'href'):
            if attrs.get(key): self.refs.append(attrs[key])
        if tag == 'meta' and attrs.get('name', '').lower() == 'viewport': self.viewport = True
        if tag == 'title': self.in_title = True
        if tag == 'script':
            self.script = {'src': attrs.get('src'), 'type': attrs.get('type', '').lower(), 'code': ''}
            self.scripts.append(self.script)
    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
        if tag == 'script': self.script = None
    def handle_data(self, data):
        if self.in_title: self.title += data
        if self.script is not None: self.script['code'] += data

result = {}
for filename in json.load(sys.stdin):
    parser = Metadata()
    with open(filename, encoding='utf-8') as source: parser.feed(source.read())
    result[filename] = {key: getattr(parser, key) for key in ('ids', 'refs', 'scripts', 'title', 'viewport')}
json.dump(result, sys.stdout)
