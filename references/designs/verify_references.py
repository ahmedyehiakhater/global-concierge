"""Read-only checks for static dnata references. Python standard library only."""
from pathlib import Path
from html.parser import HTMLParser
import json, re, zipfile

ROOT = Path(__file__).resolve().parent

class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.in_main = False
        self.words = []
        self.links = []
        self.main_count = 0
        self.feed(source)
    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == 'main':
            self.in_main = True
            self.main_count += 1
        for key in ('src', 'href', 'action'):
            if attrs.get(key):
                self.links.append(attrs[key])
    def handle_endtag(self, tag):
        if tag == 'main':
            self.in_main = False
    def handle_data(self, text):
        if self.in_main and text.strip():
            self.words.append(text.strip())
    @property
    def content(self):
        return re.sub(r'\s+', ' ', ' '.join(self.words))

def shell(source, tag, name):
    return re.search(r'<' + tag + r'\b(?=[^>]*class="' + name + r'")[^>]*>.*?</' + tag + r'>', source, re.S).group()

class Canonical(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.parts = []
        self.feed(source)
    def handle_starttag(self, tag, attrs):
        self.parts.append((tag, tuple(sorted(attrs))))
    def handle_endtag(self, tag):
        self.parts.append(('/', tag))
    def handle_data(self, data):
        if data.strip():
            self.parts.append(data.strip())

def canonical(source):
    return repr(Canonical(source).parts)

pages = sorted(ROOT.glob('*/code.html'))
assert len(pages) == 24
headers, sidebars = set(), set()
for page in pages:
    source = page.read_text()
    doc = Document(source)
    assert doc.main_count == 1, page
    assert not re.search(r'#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d', source), f'Raw colour: {page}'
    assert 'marhaba' not in source.lower(), f'Old branding: {page}'
    assert not re.search(r'text-(secondary-container|secondary-fixed(?:-dim)?|action)\b', source), f'Lime text: {page}'
    for link in doc.links:
        if link.startswith(('https:', 'http:', '#', 'data:', 'mailto:')):
            continue
        assert (page.parent / link.split('#')[0]).exists(), f'Broken local link: {link} in {page}'
    if page.parent.name == 'login':
        assert 'portal-sidebar' not in source
        continue
    headers.add(canonical(shell(source, 'header', 'portal-header')))
    sidebar = shell(source, 'aside', 'portal-sidebar')
    if page.parent.name == 'empty_shell':
        assert sidebar.count('data-nav=') == 1
        assert 'aria-disabled="true"' in sidebar and 'aria-current' not in sidebar
    else:
        assert sidebar.count('aria-current="page"') == 1, page
        expected = 'financials' if 'financials' in page.parent.name else 'dashboard' if 'dashboard' in page.parent.name else 'bookings'
        assert re.search(r'<a\b(?=[^>]*data-nav="' + expected + r'")(?=[^>]*aria-current="page")[^>]*>', sidebar), page
        sidebars.add(canonical(re.sub(r' aria-current="page"', '', sidebar)))
assert len(headers) == 1, 'Header mismatch'
assert len(sidebars) == 1, 'Sidebar mismatch'

with zipfile.ZipFile(ROOT.parent / 'stitch-original-html.zip') as archive:
    for entry in archive.namelist():
        folder = entry.split('/')[0]
        destination = 'agent_dashboard' if folder == 'marhaba_b2b_portal_desktop_dashboard' else folder
        original = Document(archive.read(entry).decode()).content
        expected = re.sub('marhaba', 'dnata', original, flags=re.I)
        actual = Document((ROOT / destination / 'code.html').read_text()).content
        for before, after in json.loads((ROOT / 'shared/credit-copy-migration.json').read_text()).get(destination, {}).items():
            expected = expected.replace(before, after)
        if destination == 'financials_insights_dashboard_optimized':
            assert 'Corporate credit facility' in actual and 'AED 67,500' in actual
            continue  # Financial content intentionally revised for the approved B2B model.
        assert actual == expected, f'Original main content changed: {destination}'

palette = (ROOT / 'shared/tokens.css').read_text()
assert palette.count(':root') == 1
required = ['brand-primary','brand-action','surface','surface-raised','text-primary','text-muted','border','success','warning','error']
for token in required:
    assert '--' + token + ':' in palette
for path in list(ROOT.rglob('*.html')) + list(ROOT.rglob('*.css')) + list(ROOT.rglob('*.js')):
    if path.name == 'tokens.css':
        continue
    assert not re.search(r'#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d', path.read_text()), f'Raw colour outside palette: {path}'

financial = (ROOT / 'empty_financials/code.html').read_text()
assert financial.count('<strong>AED 0</strong>') == 3
assert '<strong>0</strong>' in financial
assert 'd="M60 230 H620"' in financial
assert len(re.findall('cy="230"', financial)) == 6
print('PASS: 23 consistent shells and login;  6 preserved-content checks and revised financials; semantic palette; valid local links; four empty states and zero chart.')

# The two storyboard paths must retain their mode and consistent example totals.
for mode, amount in [('single', 576), ('multi', 936)]:
    for step in ['journey', 'travellers', 'services', 'review', 'payment', 'confirmation']:
        page = ROOT / f'booking_{mode}_{step}/code.html'
        source = page.read_text()
        if step != 'journey':
            other = 'single' if mode == 'multi' else 'multi'
            assert f'../booking_{other}_' not in source.replace('../booking_single_journey/code.html', ''), page
        if step in ['services', 'review', 'payment']:
            assert f'<strong>{amount:,}</strong>' in source, page
    pay = (ROOT / f'booking_{mode}_payment/code.html').read_text()
    assert f'action="../booking_{mode}_confirmation/code.html"' in pay
    assert 'type="checkbox" required' in pay
    assert 'Card number' not in pay and 'Corporate credit facility' in pay
    assert f'AED {67500-amount:,}' in pay
    assert 'Corporate discount · 10%' in pay
print('PASS: both booking paths, example totals and local simulated credit confirmation actions.')
