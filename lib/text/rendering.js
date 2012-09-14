var rendering = module.exports;

var vg = require('openvg');

// textwidth returns the width of a text string at the specified font and size.
// derived from http://web.archive.org/web/20070808195131/http://developer.hybrid.fi/font2openvg/renderFont.cpp.txt
var textWidth = rendering.textWidth = function(text, font, size) {
  var tw = 0.0;
  for (var i = 0; i < text.length; i++) {
    var character = text.charCodeAt(i);
    var glyph = font.characterMap[character];
    if (glyph < 0 || glyph === undefined) {
      continue; //glyph is undefined
    }
    tw += size * font.glyphAdvances[glyph] / 65536.0;
  }
  return tw;
}

var measureText = rendering.measureText = function(text, font, pointSize) {
  // TODO Make these values read-only
  var metrics = {
    // x-direction
    width: 0, // advance width
    actualBoundingBoxLeft: 0,
    actualBoundingBoxRight: 0,

    // y-direction
    fontBoundingBoxAscent: 0,
    fontBoundingBoxDescent: 0,
    actualBoundingBoxAscent: 0,
    actualBoundingBoxDescent: 0,
    emHeightAscent: font.ascender * pointSize / 65536.0,
    emHeightDescent: -font.descender * pointSize / 65536.0,
    hangingBaseline: 0,
    alphabeticBaseline: 0,
    ideographicBaseline: 0
  };

  if (text.length === 0) {
    return metrics;
  }

  var xx = 0, yy = 0;
  for (var i = 0; i < text.length; i++) {
    var character = text.charCodeAt(i);
    var glyph = font.characterMap[character];
    if (glyph < 0 || glyph === undefined) {
      continue; //glyph is undefined
    }

    var bbox = font.glyphBBoxes[glyph];
    if(xx + bbox.minX < metrics.actualBoundingBoxLeft) {
      metrics.actualBoundingBoxLeft = xx + bbox.minX;
    }
    if(xx + bbox.maxX > metrics.actualBoundingBoxRight) {
      metrics.actualBoundingBoxRight = xx + bbox.maxX;
    }

    if(yy + bbox.minY < metrics.actualBoundingBoxDescent) {
      metrics.actualBoundingBoxDescent = yy + bbox.minY;
    }
    if(yy + bbox.maxY > metrics.actualBoundingBoxAscent) {
      metrics.actualBoundingBoxAscent = yy + bbox.maxY;
    }

    xx += font.glyphAdvances[glyph];
    yy += 0;
  }

  metrics.width = xx * pointSize / 65536.0;
  metrics.actualBoundingBoxLeft    *= -pointSize / 65536.0;
  metrics.actualBoundingBoxRight   *=  pointSize / 65536.0;

  metrics.actualBoundingBoxAscent  *=  pointSize / 65536.0;
  metrics.actualBoundingBoxDescent *= -pointSize / 65536.0;
  metrics.fontBoundingBoxAscent  = metrics.actualBoundingBoxAscent;
  metrics.fontBoundingBoxDescent = metrics.actualBoundingBoxDescent;

  //
  // These don't seem implemented by freetype
  //
  // metrics.hangingBaseline *= pointSize / 65536.0;
  // metrics.alphabeticBaseline *= pointSize / 65536.0;
  // metrics.ideographicBaseline *= pointSize / 65536.0;

  return metrics;
}

// Text renders a string of text at a specified location, size, using the specified font glyphs
// derived from http://web.archive.org/web/20070808195131/http://developer.hybrid.fi/font2openvg/renderFont.cpp.txt
var renderText = rendering.renderText = function(x, y, text, font, lineWidth, pointSize, paintMode) {
  var size = pointSize, xx = x, mm = new Float32Array(9);

  vg.getMatrix(mm);
  var saveLineWidth = vg.getF(vg.VGParamType.VG_STROKE_LINE_WIDTH);

  // Temporary fix to scaling problem below
  vg.setF(vg.VGParamType.VG_STROKE_LINE_WIDTH, lineWidth / pointSize);
  for (var i = 0; i < text.length; i++) {
    var character = text.charCodeAt(i);
    var glyph = font.characterMap[character];
    if (glyph < 0 || glyph === undefined) {
      continue;  //glyph is undefined
    }

    // Scaling the font like this breaks lineWidth
    var mat = new Float32Array([
      size,    0.0, 0.0,
       0.0,  -size, 0.0,
        xx, y+size, 1.0
    ]);
    vg.loadMatrix(mm);
    vg.multMatrix(mat);
    vg.drawPath(font.glyphs[glyph], paintMode);
    // vg.drawGlyph(font.font, glyph, paintMode, false /* VG_FALSE */ /* allowAutoHinting */);
    xx += size * font.glyphAdvances[glyph] / 65536.0;
  }

  vg.setF(vg.VGParamType.VG_STROKE_LINE_WIDTH, saveLineWidth);
  vg.loadMatrix(mm);
}