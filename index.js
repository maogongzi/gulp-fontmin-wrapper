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
  // here we cache  all the extracted Chinese glyphs, once all extraction 
  // tasks are done it will be used in the stream flush function to generate
  // the required fonts.
  var glyphListCacheStr = '';

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
    if (file.isNull()) {
      this.emit('error', new gutil.PluginError('empty file not supported!'));
      return cb();
    }

    if (file.isStream()) {
      this.emit('error', new gutil.PluginError('streaming not supported!'));
      return cb();
    }

    glyphListCacheStr += options.extractionAlgorithm(file.contents.toString('utf8'));

    cb();
  }, function(flushCb){
    var fontmin = null,
        _this = this;

    // remove duplication
    glyphListCacheStr = (function(str){
      var o = {},
          list=str.split(''),
          i;

      for (i=0; i<list.length; i++) {
        o[list[i]]=1;
      }

      return Object.keys(o).join('');
    }(glyphListCacheStr + options.mustHaveGlyphs));

    fontmin = new Fontmin()
      .src(options.fontPath)
      .use(Fontmin.glyph({
          text: glyphListCacheStr
      }))
      .use(Fontmin.ttf2eot())
      .use(Fontmin.ttf2woff())
      .use(Fontmin.ttf2svg());
      // .use(Fontmin.css());

    fontmin.run(function (err, files) {
      if (err) {
        _this.emit('error', new gutil.PluginError(err));
        return flushCb();
      }

      for (var i=0; i<files.length; i++) {
        _this.push(files[i]);
      }

      flushCb();
    });
  });
}

// exporting the plugin main function
module.exports = fontminWrapper;