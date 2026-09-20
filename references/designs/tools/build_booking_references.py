"""Generate static, deliberately fixed-data booking storyboard references."""
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parents[1]
base = (ROOT/'empty_bookings/code.html').read_text()
head = base.split('</head>')[0].replace('dnata | Bookings — no bookings', 'dnata | New booking') + '<link rel="stylesheet" href="../shared/booking.css"></head>'
shell = base.split('<body>')[1].split('<div class="reference-content">')[0]
steps = ['journey','travellers','services','review','payment','confirmation']

def icon(name): return f'<span class="material-symbols-outlined" aria-hidden="true">{name}</span>'
def link(mode,step): return f'../booking_{mode}_{step}/code.html'
def button(text,href,secondary=False): return f'<a class="flow-button {"secondary" if secondary else ""}" href="{href}">{text}</a>'
def field(label,value): return f'<label class="flow-field"><span>{label}</span><input value="{value}" readonly></label>'
def card(title,body,extra=''): return f'<section class="flow-card {extra}"><h2>{title}</h2>{body}</section>'
def note(text): return f'<div class="flow-note">{icon("info")}<span>{text}</span></div>'
def route(mode): return 'DXB → CAI → LHR' if mode=='multi' else 'DXB → CAI'
CREDIT_LIMIT = 100000
CREDIT_USED = 32500
AVAILABLE = CREDIT_LIMIT - CREDIT_USED
DISCOUNT_PERCENT = 10  # Illustrative corporate agreement, not a live rate.
def subtotal(mode): return 1040 if mode=='multi' else 640
def discount(mode): return subtotal(mode) * DISCOUNT_PERCENT // 100
def total(mode): return subtotal(mode) - discount(mode)
def step_label(step): return 'Credit facility' if step == 'payment' else step.title()
def pricing(mode):
    return f'<div class="summary-line"><span>Service subtotal</span><b>AED {subtotal(mode):,}</b></div><div class="summary-line"><span>Corporate discount · {DISCOUNT_PERCENT}%<small>Illustrative contracted rate</small></span><b>− AED {discount(mode):,}</b></div>'

legs = [('DXB','Dubai','CAI','Cairo','12 Nov 2026','09:00','11:15','EK 927'),('CAI','Cairo','LHR','London Heathrow','15 Nov 2026','10:00','13:20','MS 777')]
services = [('DXB','Departure','Meet & greet','Guided check-in, assistance through departure formalities and an escort to your gate.',180),('CAI','Arrival','Arrival assistance','A welcome on arrival, assistance through formalities and an escort to the arrivals hall.',140),('CAI','Departure','Meet & greet','Departure assistance from the terminal meeting point to your gate.',110),('LHR','Arrival','Arrival assistance','A welcome on arrival and an escort through the terminal to your onward transport.',90)]

def summary(mode,stage):
    n=2 if mode=='multi' else 1
    selected=stage>=2
    rows=''.join(f'<div class="summary-line"><span>{airport} · {phase.lower()}<small>{name} · 2 adults × AED {price}</small></span><b>{price*2:,}</b></div>' for airport,phase,name,desc,price in services[:n*2]) if selected else '<p class="flow-muted">Choose airport services in step 3 to see your total.</p>'
    plural = 's' if n>1 else ''
    dates = '12–15 Nov' if n>1 else '12 Nov'
    amount = f'{total(mode):,}' if selected else '—'
    label = 'Charge to credit · AED' if selected else 'Estimated credit charge'
    caption = 'Includes sample fees and taxes. Deducted from your available credit when confirmed.' if selected else 'Corporate discount · 10% sample rate. Applied when services are selected.'
    people = '<p class="flow-fine">James Sterling · Lead traveller<br>Amelia Sterling</p>' if stage>=1 else ''
    breakdown = pricing(mode) if selected else ''
    balance = f'<hr><p class="flow-muted">Available credit: <b>AED {AVAILABLE:,}</b></p>' + (f'<p class="flow-fine">After this booking: AED {AVAILABLE-total(mode):,}</p>' if selected else '')
    inner = f'<span class="flow-tag">{n} flight leg{plural} · 2 adults</span><h3 class="summary-route">{route(mode)}</h3><p class="flow-muted">{dates} 2026 · All times local</p>{people}<hr>{rows}<hr>{breakdown}<div class="summary-total"><span>{label}</span><strong>{amount}</strong></div><p class="flow-fine">{caption}</p>{balance}'
    return '<aside class="flow-summary">'+card('Booking summary',inner)+'<p class="flow-fine summary-foot">'+icon('support_agent')+' Need help? Your agent support team is here.</p></aside>'

def pager(mode,stage,label=None):
    prev=link(mode,steps[stage-1]) if stage else '../all_bookings_management/code.html'
    nxt=link(mode,steps[stage+1])
    return f'<div class="flow-pager">{button("Back",prev,True)}{button(label or "Continue to " + steps[stage+1],nxt)}</div>'

def journey(mode):
    body=f'<div class="trip-types"><a class="trip-type {"selected" if mode=="single" else ""}" href="{link("single","journey")}">{icon("flight_takeoff")}<strong>Single leg</strong><span>One flight, services at both ends</span></a><a class="trip-type {"selected" if mode=="multi" else ""}" href="{link("multi","journey")}">{icon("connecting_airports")}<strong>Multi-leg</strong><span>Two or more flights, one booking</span></a></div>'
    for i,(a,city,b,dest,date,depart,arrive,flight) in enumerate(legs[:2 if mode=='multi' else 1]):
        body+=card(f'<span class="flow-tag">Leg {i+1}</span> {a} → {b}',f'<div class="field-grid">{field("Departure airport",city+" ("+a+")")}{field("Arrival airport",dest+" ("+b+")")}{field("Departure date",date)}{field("Flight number",flight)}{field("Departure time · local",depart)}{field("Arrival time · local",arrive)}</div><p class="flow-fine">Sample flight details for layout review; not a live flight schedule.</p>')
    if mode=='single': body+=f'<a class="flow-add" href="{link("multi","journey")}">{icon("add")} Add another flight leg</a>'
    else: body+=note('This example includes a stay in Cairo between flights. Each leg has its own date and services; it is not assumed to be a connecting flight.')
    return body+card('Who is travelling?', '<div class="field-grid">'+field('Adults · age 12+','2')+field('Children · ages 2–11','0')+'</div><p class="flow-fine">This storyboard shows two adults travelling on every leg. Child pricing and traveller changes by leg are requirements to confirm.</p>')+pager(mode,0)

def travellers(mode):
    body=note('Enter each traveller once. These details apply to every flight in this booking. Names should match the travel documents.')
    for i,(first,last) in enumerate([('James','Sterling'),('Amelia','Sterling')]):
        body+=card(f'Traveller {i+1} <span class="flow-tag">Adult{ " · Lead traveller" if i==0 else ""}</span>', '<div class="field-grid">'+field('First name',first)+field('Last name',last)+'</div>')
    body+=card('Contact & assistance', '<div class="field-grid">'+field('Lead traveller email','james.sterling@example.com')+field('Mobile · with country code','+971 50 000 0000')+field('Booking contact','Sarah Jenkins · booking agent')+field('Assistance notes · optional','No additional assistance requested')+'</div><p class="flow-fine">Contact details shown here are fictional. Passport and other sensitive details are omitted until a service requires them.</p>')
    return body+pager(mode,1)

def service_screen(mode):
    body=note('Sample selections for both adults. Prices are illustrative, per adult and inclusive of sample fees and taxes. Airport availability has not been validated.')
    for i,leg in enumerate(legs[:2 if mode=='multi' else 1]):
        body+=f'<section class="flow-card"><div class="leg-heading"><span class="flow-tag">Leg {i+1}</span><h2>{leg[0]} → {leg[2]}</h2><span class="flow-muted">{leg[4]}</span></div>'
        for airport,phase,name,desc,price in services[i*2:i*2+2]:
            body+=f'<div class="airport-services"><h3>{icon("flight_takeoff" if phase=="Departure" else "flight_land")} {airport} · {phase}</h3><div class="service-choice selected"><div>{icon("check_circle")}</div><div><strong>{name}</strong><p>{desc}</p><span class="flow-tag">Selected · both travellers</span></div><div class="service-price"><strong>AED {price}</strong><small>per adult</small><b>AED {price*2} total</b></div></div><div class="service-alternative"><span>{icon("add_circle_outline")} {"Lounge access" if phase=="Departure" else "Porter service"}</span><span>Not selected in this example</span></div></div>'
        body+='</section>'
    return body+pager(mode,2,'Review booking')

def review(mode):
    body=note('Review all airport services and traveller details before charging your corporate credit facility. This is a fixed example: fields and service choices are not saved between screens.')
    body+=card('Journey & travellers', f'<div class="review-heading"><strong>{route(mode)}</strong><a href="{link(mode,"journey")}">Review journey →</a></div><p class="flow-muted">{ "12–15" if mode=="multi" else "12"} November 2026 · 2 adults</p><hr><div class="review-heading"><span>James Sterling · Lead traveller<br>Amelia Sterling</span><a href="{link(mode,"travellers")}">Review travellers →</a></div>')
    for i,leg in enumerate(legs[:2 if mode=='multi' else 1]):
        rows=''.join(f'<div class="summary-line"><span><b>{airport} · {phase}</b><small>{name} · 2 adults × AED {price}</small></span><strong>AED {price*2}</strong></div>' for airport,phase,name,desc,price in services[i*2:i*2+2])
        body+=card(f'Leg {i+1} · {leg[0]} → {leg[2]}',f'<p class="flow-muted">{leg[4]} · {leg[7]} · {leg[5]}–{leg[6]} local</p>{rows}<a class="flow-inline" href="{link(mode,"services")}">Review airport services →</a>')
    body+=card('Before you confirm','<p class="flow-muted">Flight tickets and ground transfers are not included. Service availability, cancellation deadlines, refund rules and credit terms will need business approval before a live launch.</p>')
    return body+pager(mode,3,'Continue to credit facility')

def payment(mode):
    facility = f'<div class="payment-method">{icon("account_balance_wallet")}<div><strong>Global Travel Partners</strong><p class="flow-muted">Corporate credit facility · All amounts in AED</p></div><span class="flow-tag">Active · sample</span></div><div class="summary-line"><span>Credit limit</span><b>AED {CREDIT_LIMIT:,}</b></div><div class="summary-line"><span>Credit used</span><b>AED {CREDIT_USED:,}</b></div><div class="summary-line"><span>Available before booking</span><b>AED {AVAILABLE:,}</b></div><hr>{pricing(mode)}<div class="payment-total"><span>Deduction for this booking</span><strong>AED {total(mode):,}</strong></div><div class="summary-line"><span>Available after booking</span><b>AED {AVAILABLE-total(mode):,}</b></div><p class="flow-fine">Sufficient credit in this example. A live booking must check available credit again before confirming.</p>'
    consent = f'<form class="flow-card" action="{link(mode,"confirmation")}" method="get"><h2>Confirm against your credit facility</h2><p class="flow-muted">The discounted booking amount reduces your organisation’s available credit. No card payment is required.</p><label class="consent"><input type="checkbox" required> <span>I approve the sample deduction of AED {total(mode):,} from Global Travel Partners’ credit facility.</span></label><div class="flow-pager">{button("Back to review",link(mode,"review"),True)}<button class="flow-button" type="submit">Confirm booking · AED {total(mode):,}</button></div><p class="flow-fine">Design simulation only. No booking or credit balance is changed.</p></form>'
    return note('This booking uses your corporate credit facility. The figures and 10% corporate discount below are illustrative.') + card('Credit facility',facility) + consent

def confirmation(mode):
    return f'<section class="flow-card confirmation"><div class="confirmation-icon">{icon("check_circle")}</div><span class="flow-tag">Simulation complete</span><h2>Your sample booking is ready</h2><p class="flow-muted">The journey from selection to confirmation is complete.<br>No services were reserved and no actual credit was deducted.</p><div class="confirmation-facts"><div><span>Sample reference</span><strong>DEMO-{ "ML" if mode=="multi" else "SL"}-001</strong></div><div><span>Journey</span><strong>{route(mode)}</strong></div><div><span>Sample credit deduction</span><strong>AED {total(mode):,}</strong></div></div><div class="summary-line"><span>Corporate discount · 10%</span><strong>− AED {discount(mode):,}</strong></div><div class="summary-line"><span>Available credit after sample deduction</span><strong>AED {AVAILABLE-total(mode):,}</strong></div><div class="flow-note">{icon("mail")}<span>In the live flow, the agent receives the itinerary, service meeting points, provider contacts and the credit-facility charge record.</span></div><div class="flow-pager">{button("View all references","../index.html",True)}{button("Start another booking",link(mode,"journey"))}</div></section>'

builders=[journey,travellers,service_screen,review,payment,confirmation]
for mode in ['single','multi']:
    for stage,step in enumerate(steps):
        progress='<nav class="flow-steps" aria-label="Booking steps">'
        for i,s in enumerate(steps[:5]):
            current='aria-current="step"' if i==stage else ''
            cls='completed' if i<stage else ''
            num=icon('check') if i<stage else i+1
            progress+=f'<a href="{link(mode,s)}" {current} class="{cls}"><span>{num}</span>{step_label(s)}</a>'
        progress+='</nav>'
        title='Booking complete' if stage==5 else 'New booking'
        intro=f'<a class="flow-back" href="../all_bookings_management/code.html">← Bookings</a><div class="flow-heading"><div><h1>{title}</h1><p>{"Multi-leg journey" if mode=="multi" else "Single-leg journey"} · Airport services, organised in one place</p></div><span class="flow-tag">Static design preview</span></div>{progress}'
        content=builders[stage](mode)
        main=content if stage==5 else f'<div class="flow-layout"><div class="flow-stack">{content}</div>{summary(mode,stage)}</div>'
        folder=ROOT/f'booking_{mode}_{step}';folder.mkdir(exist_ok=True)
        (folder/'code.html').write_text(head.replace('dnata | New booking', f'dnata | {mode.title()} leg · {step_label(step)}')+'<body>'+shell+'<div class="reference-content"><main class="reference-main booking-main">'+intro+main+'</main></div></body></html>')

login=f'''<div class="login-layout"><section class="login-intro"><a href="../index.html" class="dnata-wordmark"><img class="dnata-logo" src="../shared/dnata-logo.svg" alt="dnata" width="120" height="33"></a><span class="empty-kicker">Agent portal</span><h1>A smoother journey.<br>At every airport.</h1><p>Bring your travellers, airport services and bookings together in one workspace.</p><div class="login-route"><span>DXB</span>{icon('flight_takeoff')}<span>CAI</span>{icon('flight_takeoff')}<span>LHR</span></div><div class="login-benefits"><p>{icon('connecting_airports')} One flight or a multi-leg journey</p><p>{icon('groups')} Every traveller, one clear itinerary</p><p>{icon('check_circle')} Services and totals in one place</p></div><p class="flow-fine">dnata · Agent booking experience</p></section><section class="login-form"><div><span class="flow-tag">Welcome back</span><h2>Sign in to your workspace</h2><p class="flow-muted">Manage bookings for Global Travel Partners.</p><div class="flow-stack">{field('Work email','sarah.jenkins@example.com')}<label class="flow-field"><span>Password</span><input type="password" value="demo-password" readonly aria-describedby="demo-note"></label></div><p class="flow-fine" id="demo-note">Design preview — these are sample credentials. The button opens the demo without signing in.</p>{button('Enter demo workspace','../agent_dashboard/code.html')}<p class="login-help">Need access? Contact your organisation’s administrator.</p><a class="flow-inline" href="../index.html">Explore the design references →</a></div></section></div>'''
folder=ROOT/'login';folder.mkdir(exist_ok=True)
(folder/'code.html').write_text(head.replace('dnata | New booking','dnata | Sign in')+'<body><main>'+login+'</main></body></html>')
