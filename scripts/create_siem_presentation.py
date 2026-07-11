from pathlib import Path
from xml.sax.saxutils import escape
import zipfile


OUT = Path("AI-Powered-SIEM-Presentation.pptx")

SLIDES = [
    {
        "title": "AI-Powered SIEM System",
        "subtitle": "Security monitoring with AI-assisted log analysis, anomaly detection, and alert tuning",
        "bullets": ["Final project presentation", "Short, clear, and demo-ready"],
    },
    {
        "title": "Problem",
        "bullets": [
            "Traditional SIEM tools generate too many noisy alerts",
            "Duplicate logs waste analyst time",
            "Static rules miss unusual behavior patterns",
            "Security teams need faster, clearer incident response",
        ],
    },
    {
        "title": "Proposed Solution",
        "bullets": [
            "Centralize security logs in one monitoring platform",
            "Remove duplicate logs to reduce false positives",
            "Use machine learning to detect suspicious behavior",
            "Give administrators dashboards, rules, and AI tuning controls",
        ],
    },
    {
        "title": "System Architecture",
        "bullets": [
            "Frontend: React dashboard for logs, analytics, rules, and admin views",
            "Backend: Django/API services for authentication, logs, alerts, and AI endpoints",
            "Database: Stores users, logs, rules, alerts, and model decisions",
            "AI Layer: Random Forest prediction and Isolation Forest anomaly detection",
        ],
    },
    {
        "title": "Core Features",
        "bullets": [
            "Log viewer with filtering, search, and detailed inspection",
            "Dashboard metrics for alerts, severity, sources, and system health",
            "Rule management for creating and adjusting detection logic",
            "Behavior analysis for anomaly discovery",
            "AI decision review with human override support",
        ],
    },
    {
        "title": "AI Workflow",
        "bullets": [
            "Train model using the UNSW-NB15 security dataset",
            "Predict whether incoming records are normal or threats",
            "Score anomalies and assign risk levels",
            "Use administrator feedback to improve future decisions",
        ],
    },
    {
        "title": "Demo Flow",
        "bullets": [
            "1. Login and open the security dashboard",
            "2. Review alerts and log details",
            "3. Detect duplicate or suspicious events",
            "4. Tune rules or thresholds",
            "5. Review AI decisions and override when needed",
        ],
    },
    {
        "title": "Benefits & Conclusion",
        "bullets": [
            "Reduces false positives and alert fatigue",
            "Improves visibility into threats and anomalies",
            "Supports faster investigation and response",
            "Combines AI automation with administrator control",
        ],
        "subtitle": "AI-powered SIEM makes security monitoring smarter, clearer, and more efficient.",
    },
]


def paragraph(text, size=2400, bold=False, color="F8FAFC"):
    b = "<a:b/>" if bold else ""
    return (
        "<a:p><a:r><a:rPr lang=\"en-US\" sz=\"{size}\">{bold}"
        "<a:solidFill><a:srgbClr val=\"{color}\"/></a:solidFill></a:rPr>"
        "<a:t>{text}</a:t></a:r></a:p>"
    ).format(size=size, bold=b, color=color, text=escape(text))


def textbox(shape_id, x, y, cx, cy, paras, fill=None):
    fill_xml = (
        f"<a:solidFill><a:srgbClr val=\"{fill}\"/></a:solidFill><a:ln><a:noFill/></a:ln>"
        if fill
        else "<a:noFill/><a:ln><a:noFill/></a:ln>"
    )
    return f"""
    <p:sp>
      <p:nvSpPr>
        <p:cNvPr id="{shape_id}" name="TextBox {shape_id}"/>
        <p:cNvSpPr txBox="1"/>
        <p:nvPr/>
      </p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>
        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        {fill_xml}
      </p:spPr>
      <p:txBody>
        <a:bodyPr wrap="square" anchor="t"/>
        <a:lstStyle/>
        {''.join(paras)}
      </p:txBody>
    </p:sp>
    """


def slide_xml(slide, idx):
    title = slide["title"]
    subtitle = slide.get("subtitle")
    bullets = slide.get("bullets", [])

    title_paras = [paragraph(title, size=3900, bold=True, color="FFFFFF")]
    subtitle_paras = [paragraph(subtitle, size=1800, color="C7D2FE")] if subtitle else []
    bullet_paras = [paragraph(f"• {b}", size=2100, color="E5E7EB") for b in bullets]

    accent = "22C55E" if idx % 2 else "38BDF8"
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Background"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="0" y="0"/><a:ext cx="12192000" cy="6858000"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:solidFill><a:srgbClr val="0F172A"/></a:solidFill>
          <a:ln><a:noFill/></a:ln>
        </p:spPr>
      </p:sp>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Accent"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="0" y="0"/><a:ext cx="12192000" cy="155000"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:solidFill><a:srgbClr val="{accent}"/></a:solidFill>
          <a:ln><a:noFill/></a:ln>
        </p:spPr>
      </p:sp>
      {textbox(4, 820000, 520000, 10600000, 760000, title_paras)}
      {textbox(5, 860000, 1350000, 10000000, 780000, subtitle_paras) if subtitle else ""}
      {textbox(6, 1080000, 2300000 if subtitle else 1800000, 10100000, 3800000, bullet_paras)}
      {textbox(7, 10400000, 6250000, 1100000, 250000, [paragraph(str(idx), size=1300, color="94A3B8")])}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>"""


def write(path, content):
    path = str(path)
    z.writestr(path, content)


content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
{slides}
</Types>""".format(
    slides="\n".join(
        f'  <Override PartName="/ppt/slides/slide{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        for i in range(1, len(SLIDES) + 1)
    )
)

rels_root = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>"""

presentation_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
{slides}
</Relationships>""".format(
    slides="\n".join(
        f'  <Relationship Id="rId{i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{i}.xml"/>'
        for i in range(1, len(SLIDES) + 1)
    )
)

presentation = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>
{slide_ids}
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="wide"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>""".format(
    slide_ids="\n".join(
        f'    <p:sldId id="{256+i}" r:id="rId{i+1}"/>' for i in range(1, len(SLIDES) + 1)
    )
)

slide_master = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
  <p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>
</p:sldMaster>"""

slide_master_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>"""

slide_layout = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
             xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
             xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>"""

theme = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="SIEM Theme">
  <a:themeElements>
    <a:clrScheme name="SIEM"><a:dk1><a:srgbClr val="0F172A"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1E293B"/></a:dk2><a:lt2><a:srgbClr val="E5E7EB"/></a:lt2><a:accent1><a:srgbClr val="38BDF8"/></a:accent1><a:accent2><a:srgbClr val="22C55E"/></a:accent2><a:accent3><a:srgbClr val="F97316"/></a:accent3><a:accent4><a:srgbClr val="EF4444"/></a:accent4><a:accent5><a:srgbClr val="A78BFA"/></a:accent5><a:accent6><a:srgbClr val="FACC15"/></a:accent6><a:hlink><a:srgbClr val="38BDF8"/></a:hlink><a:folHlink><a:srgbClr val="A78BFA"/></a:folHlink></a:clrScheme>
    <a:fontScheme name="Aptos"><a:majorFont><a:latin typeface="Aptos Display"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/></a:minorFont></a:fontScheme>
    <a:fmtScheme name="SIEM">
      <a:fillStyleLst><a:solidFill><a:schemeClr val="accent1"/></a:solidFill><a:solidFill><a:schemeClr val="accent2"/></a:solidFill><a:solidFill><a:schemeClr val="accent3"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="accent1"/></a:solidFill></a:ln><a:ln w="25400"><a:solidFill><a:schemeClr val="accent2"/></a:solidFill></a:ln><a:ln w="38100"><a:solidFill><a:schemeClr val="accent3"/></a:solidFill></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:schemeClr val="dk1"/></a:solidFill><a:solidFill><a:schemeClr val="dk2"/></a:solidFill><a:solidFill><a:schemeClr val="lt1"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
  <a:objectDefaults/><a:extraClrSchemeLst/>
</a:theme>"""

core = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
                   xmlns:dc="http://purl.org/dc/elements/1.1/"
                   xmlns:dcterms="http://purl.org/dc/terms/"
                   xmlns:dcmitype="http://purl.org/dc/dcmitype/"
                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>AI-Powered SIEM System Presentation</dc:title>
  <dc:creator>Codex</dc:creator>
  <cp:lastModifiedBy>Codex</cp:lastModifiedBy>
</cp:coreProperties>"""

app = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
            xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Codex</Application>
  <PresentationFormat>On-screen Show (16:9)</PresentationFormat>
  <Slides>{count}</Slides>
</Properties>""".format(count=len(SLIDES))

slide_layout_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>"""

slide_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>"""


with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    write("[Content_Types].xml", content_types)
    write("_rels/.rels", rels_root)
    write("ppt/presentation.xml", presentation)
    write("ppt/_rels/presentation.xml.rels", presentation_rels)
    write("ppt/slideMasters/slideMaster1.xml", slide_master)
    write("ppt/slideMasters/_rels/slideMaster1.xml.rels", slide_master_rels)
    write("ppt/slideLayouts/slideLayout1.xml", slide_layout)
    write("ppt/slideLayouts/_rels/slideLayout1.xml.rels", slide_layout_rels)
    write("ppt/theme/theme1.xml", theme)
    write("docProps/core.xml", core)
    write("docProps/app.xml", app)
    for i, slide in enumerate(SLIDES, start=1):
        write(f"ppt/slides/slide{i}.xml", slide_xml(slide, i))
        write(f"ppt/slides/_rels/slide{i}.xml.rels", slide_rels)

print(OUT.resolve())
