// Auto-extracted from GlassBox.html. Marketing copy lives here.
export const LANDING_HTML = `<!-- ============================ NAV ============================ -->
<nav class="nav">
  <div class="wrap nav-inner">
    <a href="#top" class="brand"><b>glass</b>box<span class="dot">·</span>fin</a>
    <div class="nav-links">
      <a href="#how">How it works</a>
      <a href="#guardrails">Guardrails</a>
      <a href="#rules">Rules</a>
      <a href="#install">Install</a>
      <a href="https://github.com" target="_blank" rel="noopener">GitHub ↗</a>
    </div>
    <a href="#install" class="pill">
      <span>pip install glassbox-fin</span>
      <span class="arr">→</span>
    </a>
  </div>
</nav>

<!-- ============================ HERO ============================ -->
<header class="hero" id="top">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <div class="eyebrow">
        <span class="rule"></span>
        OPEN-SOURCE COMPLIANCE RUNTIME
        <span class="dim">v0.1.0-alpha</span>
      </div>
      <h1>Stop your financial<br />agents before they<br />break <span class="accent">the rules</span>.</h1>
      <p class="sub">A Python middleware library that intercepts every LLM call and tool invocation your agent makes — <strong>checking it against financial regulation in real time</strong>. Block violations before they execute. Generate audit trails your compliance team can actually use. <em>See straight into the box.</em></p>
      <div class="hero-cta">
        <a href="#install" class="btn btn-primary">Get started <span>→</span></a>
        <button class="btn btn-code" id="hero-copy"><span class="dollar">$</span> pip install glassbox-fin</button>
      </div>
    </div>

    <!-- hero visual: four switchable cursor-tracked scenes -->
    <div class="cube-stage" id="cubeStage">
      <div class="cube-glow"></div>

      <!-- A · GLASS CUBE -->
      <div class="viz viz-cube active" data-viz="cube">
        <div class="cube-scene">
          <div class="cube rotor" id="cube" data-mode="spin" data-basex="-18">
            <div class="face fr"></div>
            <div class="face bk"></div>
            <div class="face rt"></div>
            <div class="face lf"></div>
            <div class="face tp"></div>
            <div class="face bt"></div>
            <span class="vtx" style="transform: translate3d(-110px,-110px,-110px);"></span>
            <span class="vtx" style="transform: translate3d(110px,-110px,-110px);"></span>
            <span class="vtx" style="transform: translate3d(-110px,110px,-110px);"></span>
            <span class="vtx" style="transform: translate3d(110px,110px,-110px);"></span>
            <span class="vtx" style="transform: translate3d(-110px,-110px,110px);"></span>
            <span class="vtx" style="transform: translate3d(110px,-110px,110px);"></span>
            <span class="vtx" style="transform: translate3d(-110px,110px,110px);"></span>
            <span class="vtx" style="transform: translate3d(110px,110px,110px);"></span>
            <div class="cube-core"></div>
            <div class="plate p1"><i></i><i></i></div>
            <div class="plate p2"><i></i><i></i><i></i></div>
            <div class="plate p3"><i></i><i></i></div>
          </div>
        </div>
        <div class="cube-caustic"></div>
      </div>

      <!-- B · EXPLODED BOX -->
      <div class="viz viz-explode" data-viz="explode">
        <div class="explode rotor" data-mode="spin" data-basex="-16">
          <div class="ef fr"></div>
          <div class="ef bk"></div>
          <div class="ef rt"></div>
          <div class="ef lf"></div>
          <div class="ef tp"></div>
          <div class="ef bt"></div>
          <div class="layer l1"><span class="lt">Trace</span><span class="ld">every call · every tool</span></div>
          <div class="layer l2"><span class="lt">Rules</span><span class="ld">pii · dti · jurisdiction</span></div>
          <div class="layer l3"><span class="lt">Lineage</span><span class="ld">decision → narrative</span></div>
        </div>
      </div>

      <!-- C · TRACE IN BOX -->
      <div class="viz viz-trace" data-viz="trace">
        <div class="tracebox rotor" data-mode="tilt" data-basex="6" data-basey="0">
          <div class="frame boxed">
            <span class="bracket tl"></span><span class="bracket tr"></span>
            <span class="bracket bl"></span><span class="bracket br"></span>
          </div>
          <svg class="edges" viewBox="0 0 320 250" preserveAspectRatio="none">
            <line x1="58" y1="52" x2="150" y2="120"></line>
            <line x1="150" y1="120" x2="250" y2="64" class="flag"></line>
            <line x1="150" y1="120" x2="170" y2="196" class="flag"></line>
          </svg>
          <div class="tnode" style="left: 14px; top: 36px; transform: translateZ(26px);"><span class="nh">llm.call</span><span class="ns">assess #42</span></div>
          <div class="tnode" style="left: 108px; top: 104px; transform: translateZ(8px);"><span class="nh">get_credit_score</span><span class="ns">score 612</span></div>
          <div class="tnode flag" style="left: 206px; top: 44px; transform: translateZ(38px);"><span class="nh">send_email ⚠</span><span class="ns">PII · BSN leaked</span></div>
          <div class="tnode flag" style="left: 118px; top: 180px; transform: translateZ(30px);"><span class="nh">decision: APPROVE</span><span class="ns">DTI rationale missing</span></div>
        </div>
      </div>

      <!-- D · LAYERED PANES -->
      <div class="viz viz-panes" data-viz="panes">
        <div class="panes rotor" data-mode="tilt" data-basex="15" data-basey="-24">
          <div class="pane p1"><span class="pl">Session</span><div class="pbars"><i></i><i></i><i></i></div></div>
          <div class="pane p2"><span class="pl">Trace</span><div class="pbars"><i></i><i></i><i></i></div></div>
          <div class="pane p3"><span class="pl">Rules</span><div class="pbars"><i></i><i></i><i></i></div></div>
          <div class="pane p4"><span class="pl">Report</span><div class="pbars"><i></i><i></i><i></i></div></div>
        </div>
      </div>

      <!-- E · BLACK BOX → GLASS BOX -->
      <div class="viz viz-morph" data-viz="morph">
        <div class="morph rotor" data-mode="spin" data-basex="-18">
          <div class="mface fr"><div class="skin solid"></div><div class="skin glass"></div></div>
          <div class="mface bk"><div class="skin solid"></div><div class="skin glass"></div></div>
          <div class="mface rt"><div class="skin solid"></div><div class="skin glass"></div></div>
          <div class="mface lf"><div class="skin solid"></div><div class="skin glass"></div></div>
          <div class="mface tp"><div class="skin solid"></div><div class="skin glass"></div></div>
          <div class="mface bt"><div class="skin solid"></div><div class="skin glass"></div></div>
          <div class="mlayer l1"><span class="lt">Trace</span><span class="ld">every call · every tool</span></div>
          <div class="mlayer l2"><span class="lt">Rules</span><span class="ld">pii · dti · jurisdiction</span></div>
          <div class="mlayer l3"><span class="lt">Lineage</span><span class="ld">decision → narrative</span></div>
        </div>
      </div>

      <!-- F · BLACK BOX vs GLASS BOX -->
      <div class="viz viz-versus" data-viz="versus">
        <div class="versus rotor" data-mode="tilt" data-basex="4" data-basey="0">
          <div class="vbox left">
            <div class="vf fr"></div><div class="vf bk"></div><div class="vf rt"></div>
            <div class="vf lf"></div><div class="vf tp"></div><div class="vf bt"></div>
          </div>
          <div class="vbox right">
            <div class="vf fr"></div><div class="vf bk"></div><div class="vf rt"></div>
            <div class="vf lf"></div><div class="vf tp"></div><div class="vf bt"></div>
          </div>
          <span class="vlabel l">black box</span>
          <span class="vs">vs</span>
          <span class="vlabel r">glass box</span>
        </div>
      </div>

      <!-- G · RULE GATES -->
      <div class="viz viz-gates" data-viz="gates">
        <div class="gates rotor" data-mode="tilt" data-basex="8" data-basey="-4">
          <div class="grail"></div>
          <div class="gate g1"><span class="glab">PII</span></div>
          <div class="gate g2"><span class="glab">SOURCE</span></div>
          <div class="gate g3 fail"><span class="glab">DTI ✗</span></div>
          <div class="gate g4"><span class="glab">JURISDICTION</span></div>
          <div class="gtoken"></div>
        </div>
      </div>

      <!-- H · REGULATION SEALS -->
      <div class="viz viz-seals" data-viz="seals">
        <div class="seals rotor" data-mode="tilt" data-basex="15" data-basey="0">
          <div class="sbox"><span class="sk">✓</span><span class="st">decision</span></div>
          <div class="ring">
            <div class="slot" style="--a: 0deg;"><div class="unspin"><span class="seal">EU AI Act</span></div></div>
            <div class="slot" style="--a: 90deg;"><div class="unspin"><span class="seal flag">MiFID II</span></div></div>
            <div class="slot" style="--a: 180deg;"><div class="unspin"><span class="seal">GDPR</span></div></div>
            <div class="slot" style="--a: 270deg;"><div class="unspin"><span class="seal">Basel III</span></div></div>
          </div>
        </div>
      </div>

      <!-- I · CUBE OF CUBES (drag · inertia · explode) -->
      <div class="viz viz-voxel" data-viz="voxel">
        <div class="voxel rotor" id="voxel"></div>
        <div class="voxel-tip" id="voxelTip"></div>
        <div class="voxel-hint">drag to spin · hover a cell · <b>click to explode</b></div>
      </div>

      <div class="cube-tag t1">agent <b>·</b> transparent</div>
      <div class="cube-tag t2"><b>4</b> steps traced</div>
      <div class="cube-tag t3"><b>2</b> violations caught</div>
    </div>
  </div>
</header>

<!-- ===================== LIVE AUDIT TERMINAL ===================== -->
<section class="audit" id="trace" style="padding-top: 20px;">
  <div class="wrap">
    <div class="section-label">LIVE — agent_trace.audit() · loan_decision_42</div>
    <p class="lead">One loan decision, replayed. Four steps traced, two violations caught — <em>before the agent ever shipped its answer</em>.</p>
    <div class="boxed terminal-wrap reveal">
      <span class="bracket tl"></span><span class="bracket tr"></span>
      <span class="bracket bl"></span><span class="bracket br"></span>
      <div class="terminal">
        <div class="term-bar">
          <div class="dots"><i></i><i></i><i></i></div>
          <div class="term-title">glassbox ▸ audit session ▸ loan_decision_42</div>
          <div class="live-badge"><span class="blink"></span> Live</div>
        </div>
        <div class="term-body" id="termBody">
          <div class="trace-row" data-step>
            <span class="idx">01</span>
            <span class="ts">+0.00s</span>
            <span class="body"><span class="kw">llm.call</span> <span class="k">model</span>=<span class="str">"gpt-4o"</span> <span class="k">prompt</span>=<span class="str">"Assess loan application #42…"</span></span>
            <span class="status pass">✓ traced</span>
          </div>
          <div class="trace-row" data-step>
            <span class="idx">02</span>
            <span class="ts">+1.34s</span>
            <span class="body"><span class="kw">tool.call</span> <span class="k">name</span>=<span class="str">"get_credit_score"</span> <span class="k">args</span>={<span class="k">applicant</span>:<span class="str">"M. de Vries"</span>, <span class="k">score</span>:<span class="num">612</span>}</span>
            <span class="status pass">✓ traced</span>
          </div>
          <div class="trace-row flagged" data-step data-flag>
            <span class="idx">03</span>
            <span class="ts">+2.07s</span>
            <span class="body"><span class="kw">tool.call</span> <span class="k">name</span>=<span class="str">"send_email"</span> <span class="k">body</span>=<span class="str">"…BSN <span class="num">8412.95.302</span> approved…"</span> <span class="bool">⚠ pii</span></span>
            <span class="status fail">✗ flagged</span>
          </div>
          <div class="trace-row flagged" data-step data-flag>
            <span class="idx">04</span>
            <span class="ts">+2.51s</span>
            <span class="body"><span class="kw">decision</span> <span class="k">outcome</span>=<span class="str">"APPROVE"</span> <span class="k">rationale</span>=<span class="bool">null</span> <span class="k">dti</span>=<span class="bool">missing</span></span>
            <span class="status warn">! review</span>
          </div>
        </div>
        <div class="violation-bar" id="vio1" data-vio>
          <span class="vicon">▲</span>
          <b>PII_IN_TOOL_ARGS</b>
          <span class="vrule">— Dutch BSN national ID leaked into email body</span>
          <span class="sep">·</span>
          <span class="sev">CRITICAL · GDPR Art.9 · EU AI Act Art.10</span>
        </div>
        <div class="violation-bar" id="vio2" data-vio>
          <span class="vicon">▲</span>
          <b>MISSING_DTI_RATIONALE</b>
          <span class="vrule">— loan approved with no debt-to-income reasoning recorded</span>
          <span class="sep">·</span>
          <span class="sev">HIGH · EU AI Act Art.13 · EBA GL/2020/06</span>
        </div>
      </div>
    </div>
  </div>
</section>

<div class="wrap"><div class="divider"></div></div>

<!-- ===================== WHAT IT DOES ===================== -->
<section id="how">
  <div class="wrap">
    <div class="section-label reveal">WHAT'S IN THE BOX — four layers</div>
    <p class="lead reveal">Most agents are a black box: a decision comes out, the reasoning stays in. GlassBox opens it in <em>four moves</em>.</p>
    <div class="cards reveal" id="pipeline">
      <div class="card boxed step active" data-step="0" role="button" tabindex="0" aria-label="Step 1: Intercept">
        <span class="bracket tl"></span><span class="bracket br"></span>
        <span class="num">01 — INTERCEPT</span>
        <h3>Trace interception</h3>
        <p>Wraps every LLM call and tool invocation across LangChain, LlamaIndex, and raw API usage — with <strong>zero changes to your agent logic</strong>. If it runs, it's on the record.</p>
        <div class="tags">
          <span class="chip blue">LangChain</span>
          <span class="chip blue">LlamaIndex</span>
          <span class="chip">framework-agnostic</span>
        </div>
        <span class="stepbar"></span>
      </div>
      <div class="card boxed step" id="guardrails" data-step="1" role="button" tabindex="0" aria-label="Step 2: Enforce">
        <span class="bracket tl"></span><span class="bracket br"></span>
        <span class="num">02 — ENFORCE</span>
        <h3>Real-time guardrails</h3>
        <p>Violations are caught at the call boundary — <strong>before the tool executes, before the data leaves</strong>. Configure per-severity responses: block automatically, pause for human approval, or log and continue. The agent cannot proceed without your sign-off.</p>
        <div class="tags">
          <span class="chip">pre-call</span>
          <span class="chip">human approval</span>
          <span class="chip blue">Apache 2.0</span>
        </div>
        <span class="stepbar"></span>
      </div>
      <div class="card boxed step" data-step="2" role="button" tabindex="0" aria-label="Step 3: Check">
        <span class="bracket tl"></span><span class="bracket br"></span>
        <span class="num">03 — CHECK</span>
        <h3>Financial rule engine</h3>
        <p>Eight built-in rules covering GDPR, EU AI Act, MiFID II, and Basel III — <strong>each mapped to the exact article it answers</strong>. Write custom rules in plain Python and plug them in alongside the defaults.</p>
        <div class="tags">
          <span class="chip">PII</span>
          <span class="chip">thresholds</span>
          <span class="chip">jurisdiction</span>
        </div>
        <span class="stepbar"></span>
      </div>
      <div class="card boxed step" data-step="3" role="button" tabindex="0" aria-label="Step 4: Explain">
        <span class="bracket tl"></span><span class="bracket br"></span>
        <span class="num">04 — EXPLAIN</span>
        <h3>Decision lineage</h3>
        <p>Turns a tangled multi-step trace into a human-readable narrative of how the agent reached its decision — <strong>including every guardrail event and approval</strong>. Exportable as a compliance-ready PDF your auditors can sign off on.</p>
        <div class="tags">
          <span class="chip">narrative</span>
          <span class="chip">PDF export</span>
          <span class="chip blue">audit-ready</span>
        </div>
        <span class="stepbar"></span>
      </div>
    </div>

    <!-- interactive demo stage, driven by the active step -->
    <div class="how-demo reveal">
      <div class="demo-head">
        <span class="demo-dot"></span>
        <span id="demoTitle"><b>interception</b> · any framework, one wrapper</span>
      </div>
      <div class="demo-body">
        <!-- 0 · INTERCEPT -->
        <div class="demo-pane active" data-pane="0">
          <div class="pane-row">
            <div class="seg" id="fwSeg">
              <button class="seg-opt active" data-fw="langchain">LangChain</button>
              <button class="seg-opt" data-fw="llamaindex">LlamaIndex</button>
              <button class="seg-opt" data-fw="raw">Raw API</button>
            </div>
            <span class="cap-badge"><b>4</b> calls captured</span>
          </div>
          <pre class="demo-code" id="fwCode">audit.wrap(agent_executor)</pre>
          <div class="cap-list">
            <div class="cap"><span class="ci">→</span><span class="cn">llm.call</span><span class="cm">model=gpt-4o</span></div>
            <div class="cap"><span class="ci">→</span><span class="cn">tool.call</span><span class="cm">get_credit_score</span></div>
            <div class="cap"><span class="ci">→</span><span class="cn">tool.call</span><span class="cm">send_email</span></div>
            <div class="cap"><span class="ci">→</span><span class="cn">decision</span><span class="cm">APPROVE</span></div>
          </div>
          <p class="pane-note">Same trace, whatever the framework — GlassBox sits under the call, not inside your logic.</p>
        </div>

        <!-- 1 · ENFORCE -->
        <div class="demo-pane" data-pane="1">
          <div class="enforce-grid">
            <div>
              <div class="policy-head">guardrail policy · per severity</div>
              <div class="prow">
                <span class="psev critical">critical</span>
                <div class="seg sm" data-pol="critical">
                  <button class="seg-opt" data-act="block">Block</button>
                  <button class="seg-opt active" data-act="pause">Pause</button>
                  <button class="seg-opt" data-act="log">Log</button>
                </div>
              </div>
              <div class="prow">
                <span class="psev high">high</span>
                <div class="seg sm" data-pol="high">
                  <button class="seg-opt" data-act="block">Block</button>
                  <button class="seg-opt active" data-act="pause">Pause</button>
                  <button class="seg-opt" data-act="log">Log</button>
                </div>
              </div>
              <div class="prow">
                <span class="psev medium">medium</span>
                <div class="seg sm" data-pol="medium">
                  <button class="seg-opt" data-act="block">Block</button>
                  <button class="seg-opt" data-act="pause">Pause</button>
                  <button class="seg-opt active" data-act="log">Log</button>
                </div>
              </div>
            </div>
            <div class="boundary">
              <div class="bnd-call">
                <span class="bnd-tool">send_email(body="…BSN…")</span>
                <span class="bnd-sev critical">CRITICAL · PII</span>
              </div>
              <div class="bnd-divider">call boundary</div>
              <button class="run-btn" id="enfRun">▶ agent attempts the call</button>
              <div class="bnd-result" id="enfResult"></div>
            </div>
          </div>
          <p class="pane-note">The guardrail fires at the call boundary — the tool never runs until your policy says it can.</p>
        </div>

        <!-- 2 · CHECK -->
        <div class="demo-pane" data-pane="2">
          <div class="check-grid">
            <div>
              <div class="toggles" id="checkTogs">
                <div class="tog on" data-rule="pii" role="switch" tabindex="0" aria-checked="true"><span class="sw"></span><span class="tlab">PII exposure</span></div>
                <div class="tog on" data-rule="dti" role="switch" tabindex="0" aria-checked="true"><span class="sw"></span><span class="tlab">DTI rationale</span></div>
                <div class="tog on" data-rule="jur" role="switch" tabindex="0" aria-checked="true"><span class="sw"></span><span class="tlab">Jurisdiction</span></div>
                <div class="tog on" data-rule="thr" role="switch" tabindex="0" aria-checked="true"><span class="sw"></span><span class="tlab">Threshold</span></div>
              </div>
              <div class="verdict">
                <span class="vbig" id="vCount">4</span>
                <span class="vtxt"><b id="vClause">violations caught</b><br />in loan_decision_42</span>
              </div>
            </div>
            <div class="check-right" id="checkTrace">
              <div class="vrow" data-s="s1"><span class="vlabel">get_credit_score · ruleset=US · client=EU</span><span class="vs"></span></div>
              <div class="vrow" data-s="s2"><span class="vlabel">send_email · body="…BSN 8412.95.302…"</span><span class="vs"></span></div>
              <div class="vrow" data-s="s3"><span class="vlabel">approve · exposure=1.4M · limit=1.0M</span><span class="vs"></span></div>
              <div class="vrow" data-s="s4"><span class="vlabel">decision=APPROVE · rationale=null</span><span class="vs"></span></div>
            </div>
          </div>
          <p class="pane-note">Flip a rule off and the trace re-scores live — every check is independent and carries its own regulation.</p>
        </div>

        <!-- 3 · EXPLAIN -->
        <div class="demo-pane" data-pane="3">
          <div class="seg" id="exSeg">
            <button class="seg-opt active" data-view="raw">Raw trace</button>
            <button class="seg-opt" data-view="narr">Narrative</button>
          </div>
          <div class="explain-out">
            <pre class="explain-raw" id="exRaw"><span class="jk">{</span>
  <span class="jk">"session":</span> <span class="js">"loan_decision_42"</span>,
  <span class="jk">"steps":</span> <span class="jn">4</span>,
  <span class="jk">"violations":</span> [
    { <span class="jk">"rule":</span> <span class="jf">"PII_IN_TOOL_ARGS"</span>, <span class="jk">"step":</span> <span class="jn">3</span> },
    { <span class="jk">"rule":</span> <span class="jf">"MISSING_DTI_RATIONALE"</span>, <span class="jk">"step":</span> <span class="jn">4</span> }
  ]
<span class="jk">}</span></pre>
            <div class="explain-narr" id="exNarr" style="display: none;">At <b>14:02</b>, the agent pulled applicant M. de Vries's credit score (612), then attempted to send an approval email embedding the applicant's <span class="flag">Dutch BSN — a national identifier</span>. The guardrail <b>paused the send for approval, and it was denied</b> — the email never left. It also recorded an <b>APPROVE</b> decision with <span class="flag">no debt-to-income rationale attached</span>. Every event, block, and approval is on file.</div>
          </div>
          <button class="pdf-btn" id="pdfBtn"><span class="pi">↧</span> <span class="pt">Export compliance.pdf</span></button>
          <p class="pane-note">The same trace, two ways: a machine-readable record, and the story an auditor can actually read.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===================== RULES ===================== -->
<section id="rules" style="padding-top: 30px;">
  <div class="wrap">
    <div class="section-label reveal">BUILT-IN RULES — severity · regulation</div>
    <p class="lead reveal">Eight checks ship in the box. Write your own in a few lines of Python — <em>each carries the regulation it enforces</em>.</p>
    <div class="rules-toolbar reveal">
      <div class="filter-pills" id="sevFilters">
        <button class="filter-pill active" data-sev="all">All</button>
        <button class="filter-pill" data-sev="critical">Critical</button>
        <button class="filter-pill" data-sev="high">High</button>
        <button class="filter-pill" data-sev="medium">Medium</button>
      </div>
      <input type="text" class="rules-search" id="ruleSearch" placeholder="search rules…" aria-label="Search rules" />
      <span class="rules-count" id="ruleCount"><b>8</b> of 8 rules</span>
    </div>
    <div class="rules-grid reveal" id="rulesGrid">
      <div class="rule-row" data-sev="critical" data-name="PII_IN_TOOL_ARGS">
        <span class="sev-tag critical">critical</span>
        <span class="rule-name">PII_IN_TOOL_ARGS</span>
        <span class="rule-reg">GDPR Art.9
EU AI Act Art.10</span>
        <span class="rule-exp">+</span>
        <div class="rule-detail">
          <p class="rd-what">Personal identifiers — <strong>national IDs, account numbers, full names</strong> — passed into a tool argument or model prompt where they'll be logged or sent on.</p>
          <div class="rd-ex"><span class="rd-lbl">caught</span><code>send_email(body="…BSN 8412.95.302 approved…")</code></div>
        </div>
      </div>
      <div class="rule-row" data-sev="critical" data-name="DECISION_WITHOUT_TRACE">
        <span class="sev-tag critical">critical</span>
        <span class="rule-name">DECISION_WITHOUT_TRACE</span>
        <span class="rule-reg">EU AI Act Art.13</span>
        <span class="rule-exp">+</span>
        <div class="rule-detail">
          <p class="rd-what">A final decision emitted with <strong>no recorded chain of calls</strong> behind it. What you can't reconstruct, you can't defend.</p>
          <div class="rd-ex"><span class="rd-lbl">caught</span><code>decision="APPROVE"  trace=[]</code></div>
        </div>
      </div>
      <div class="rule-row" data-sev="high" data-name="MISSING_DTI_RATIONALE">
        <span class="sev-tag high">high</span>
        <span class="rule-name">MISSING_DTI_RATIONALE</span>
        <span class="rule-reg">EBA GL/2020/06</span>
        <span class="rule-exp">+</span>
        <div class="rule-detail">
          <p class="rd-what">A credit decision recorded with <strong>no debt-to-income reasoning</strong> attached — the single most-requested artifact in a lending audit.</p>
          <div class="rd-ex"><span class="rd-lbl">caught</span><code>decision="APPROVE"  rationale=null  dti=missing</code></div>
        </div>
      </div>
      <div class="rule-row" data-sev="high" data-name="JURISDICTION_MISMATCH">
        <span class="sev-tag high">high</span>
        <span class="rule-name">JURISDICTION_MISMATCH</span>
        <span class="rule-reg">MiFID II Art.24</span>
        <span class="rule-exp">+</span>
        <div class="rule-detail">
          <p class="rd-what">Rules or data from the <strong>wrong jurisdiction</strong> applied to the customer in front of the agent.</p>
          <div class="rd-ex"><span class="rd-lbl">caught</span><code>apply(ruleset="US")  client.region="EU"</code></div>
        </div>
      </div>
      <div class="rule-row" data-sev="high" data-name="THRESHOLD_BYPASS">
        <span class="sev-tag high">high</span>
        <span class="rule-name">THRESHOLD_BYPASS</span>
        <span class="rule-reg">Basel III · LCR</span>
        <span class="rule-exp">+</span>
        <div class="rule-detail">
          <p class="rd-what">A risk or liquidity limit crossed <strong>without the escalation</strong> the policy requires.</p>
          <div class="rd-ex"><span class="rd-lbl">caught</span><code>exposure=1.4M  limit=1.0M  review=none</code></div>
        </div>
      </div>
      <div class="rule-row" data-sev="medium" data-name="UNVERIFIED_DATA_SOURCE">
        <span class="sev-tag medium">medium</span>
        <span class="rule-name">UNVERIFIED_DATA_SOURCE</span>
        <span class="rule-reg">EU AI Act Art.10</span>
        <span class="rule-exp">+</span>
        <div class="rule-detail">
          <p class="rd-what">A decision that leaned on data from a source <strong>never added to the allowlist</strong>.</p>
          <div class="rd-ex"><span class="rd-lbl">caught</span><code>get_credit_score(src="3rd-party-api")  verified=false</code></div>
        </div>
      </div>
      <div class="rule-row" data-sev="medium" data-name="STALE_MARKET_CONTEXT">
        <span class="sev-tag medium">medium</span>
        <span class="rule-name">STALE_MARKET_CONTEXT</span>
        <span class="rule-reg">MiFID II Art.25</span>
        <span class="rule-exp">+</span>
        <div class="rule-detail">
          <p class="rd-what">Market data used in the decision is <strong>older than its freshness window</strong>.</p>
          <div class="rd-ex"><span class="rd-lbl">caught</span><code>quote.age=41m  window=15m</code></div>
        </div>
      </div>
      <div class="rule-row" data-sev="medium" data-name="RETENTION_WINDOW_EXCEEDED">
        <span class="sev-tag medium">medium</span>
        <span class="rule-name">RETENTION_WINDOW_EXCEEDED</span>
        <span class="rule-reg">GDPR Art.5(1)(e)</span>
        <span class="rule-exp">+</span>
        <div class="rule-detail">
          <p class="rd-what">Personal data still present in the trace <strong>past its permitted retention period</strong>.</p>
          <div class="rd-ex"><span class="rd-lbl">caught</span><code>pii.age=38d  retention=30d</code></div>
        </div>
      </div>
      <div class="rules-empty" id="rulesEmpty">No rules match — try a different filter or search.</div>
    </div>
  </div>
</section>

<!-- ===================== INTEGRATION ===================== -->
<section id="install" style="padding-top: 30px;">
  <div class="wrap">
    <div class="section-label reveal">INTEGRATION — two lines to wrap any agent</div>
    <p class="lead reveal">Wrap the agent in a context manager. A machine-readable trail and a human-readable report come out the <em>other side</em>.</p>
    <div class="boxed reveal">
      <span class="bracket tl"></span><span class="bracket tr"></span>
      <div class="code-card">
        <div class="code-bar">
          <span class="code-lang">python · agent.py</span>
          <button class="copy-btn" id="copyCode">
            <span class="ci">⧉</span> <span class="ct">Copy</span>
          </button>
        </div>
        <div class="code-body">
<pre id="codeBlock"><span class="c-com"># wrap any agent — pause on CRITICAL, log everything else</span>
<span class="c-kw">from</span> <span class="c-mod">glassbox</span> <span class="c-kw">import</span> <span class="c-fn">AuditSession</span>, <span class="c-fn">rules</span>, <span class="c-fn">GuardrailPolicy</span>

policy = <span class="c-fn">GuardrailPolicy</span>(on_critical=<span class="c-str">"pause"</span>, approver=your_approver)

<span class="c-kw">with</span> <span class="c-fn">AuditSession</span>(
    name=<span class="c-str">"loan_decision_42"</span>,
    rules=[rules.<span class="c-fn">PII</span>(), rules.<span class="c-fn">DTIRationale</span>(), rules.<span class="c-fn">Jurisdiction</span>(<span class="c-str">"EU"</span>)],
    jurisdiction=<span class="c-str">"EU"</span>,
    guardrails=policy,
) <span class="c-kw">as</span> audit:
    result = agent.<span class="c-fn">run</span>(application)

audit.<span class="c-fn">to_json</span>(<span class="c-str">"trace.json"</span>)      <span class="c-com"># full machine-readable trail</span>
audit.<span class="c-fn">report</span>(<span class="c-str">"compliance.pdf"</span>)   <span class="c-com"># human-readable lineage</span></pre>
        </div>
      </div>
      <div class="strip">
        <div>
          <div class="lbl">Output</div>
          <div class="val">JSON trail <span class="em">+</span> PDF report</div>
        </div>
        <div>
          <div class="lbl">Overhead</div>
          <div class="val"><span class="em">~0</span> lines of agent logic changed</div>
        </div>
        <div>
          <div class="lbl">Guardrails</div>
          <div class="val">pause <span class="em">·</span> raise <span class="em">·</span> log — per severity</div>
        </div>
        <div>
          <div class="lbl">License</div>
          <div class="val">Apache 2.0 <span class="em">·</span> open source</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ===================== CTA ===================== -->
<section class="cta-band">
  <div class="wrap reveal">
    <h2>Your agent is about to make<br />the decision. Are you <span class="accent">in control?</span></h2>
    <p>GlassBox intercepts every call, enforces every rule, and keeps the receipts — so when the regulator asks, the answer is already written, and the violation that never happened isn't in the file.</p>
    <div class="hero-cta">
      <a href="#install" class="btn btn-primary">pip install glassbox-fin <span>→</span></a>
      <a href="https://github.com" target="_blank" rel="noopener" class="btn">Read the docs ↗</a>
    </div>
  </div>
</section>

<!-- ===================== FOOTER ===================== -->
<footer class="footer">
  <div class="wrap footer-inner">
    <a href="#top" class="brand"><b>glass</b>box<span class="dot">·</span>fin</a>
    <div class="footer-links">
      <a href="#how">How it works</a>
      <a href="#rules">Rules</a>
      <a href="#install">Install</a>
      <a href="https://github.com" target="_blank" rel="noopener">GitHub</a>
    </div>
    <div class="meta">v0.1.0-alpha · Apache 2.0</div>
  </div>
</footer>`;
