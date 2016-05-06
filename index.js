var through = require('through2'),
    gutil = require('gulp-util'),
    Fontmin = require('fontmin');

// plugin level function (dealing with files)
// options:
// {
//   fontPath: '',
//   mustHaveGlyphs: '',
//   // which glyphs should be included in the font?
//   extractionAlgorithm: function (text) {
//     return text.replace(/[^\u4e00-\u9fa5]/g, '');
//   }
// }
function fontminWrapper(options) {
  // var options = options || {};

  if (!options.extractionAlgorithm) {
    options.extractionAlgorithm = function (text) {
      return text.replace(/[^\u4e00-\u9fa5]/g, '');
    };
  }

  if (!options.mustHaveGlyphs) {
    options.mustHaveGlyphs = '';
  }

  // if (!options.fontPath) {
  //   throw new Error('error, no font given!');
  // }

  // creating a stream through which each file will pass
  return through.obj(function(file, enc, cb) {
    var fontmin = null,
        _this = this;

    if (file.isNull()) {
      this.emit('error', new gutil.PluginError('empty file not supported!'));
      return cb();
    }

    if (file.isStream()) {
      this.emit('error', new gutil.PluginError('streaming not supported!'));
      return cb();
    }

    fontmin = new Fontmin()
      .src(options.fontPath)
      .use(Fontmin.glyph({
          text: options.extractionAlgorithm(file.contents.toString('utf8')) +
            options.mustHaveGlyphs
      }))
      .use(Fontmin.ttf2eot())
      .use(Fontmin.ttf2woff())
      .use(Fontmin.ttf2svg());
      // .use(Fontmin.css());

    fontmin.run(function (err, files) {
      if (err) {
        _this.emit('error', gutil.PluginError(err));
        return cb();
      }

      for (var i=0; i<files.length; i++) {
        _this.push(files[i]);
      }

      cb();
    });
  });
}

// exporting the plugin main function
module.exports = fontminWrapper;