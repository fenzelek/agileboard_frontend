const gulp = require('gulp');
const filter = require('gulp-filter');
const minifyHTML = require('gulp-minify-html');
const angularTemplatecache = require('gulp-angular-templatecache');
const path = require('path');
const fs = require('fs-extra');
const replace = require('gulp-replace');
const rename = require('gulp-rename');

function version(done) {
  const dir = path.join('dist', 'app/data/version');

  fs.ensureDir(dir)
    .then(() => {
      const data = {
        data: {
          timestamp: new Date().getTime()
        }
      };

      return fs.writeJson(path.join(dir, 'index.json'), data);
    })
    .then(() => done())
    .catch((err) => console.error(err));
}

function env() {
  return gulp.src([
    path.join('src', '/env/env.js')
  ], { base: 'src' })
    .pipe(gulp.dest('dist'));
}

function partials() {
  return gulp
    .src([
      path.join("src", '/app/**/*.html'),
      path.join(".tmp", '/serve/app/**/*.html')
    ])
    .pipe(minifyHTML({
      empty: true,
      spare: true,
      quotes: true
    }))
    .pipe(angularTemplatecache('templateCacheHtml.js', {
      module: 'CEP',
      root: 'app'
    }))
    .pipe(replace('app/src/', ''))
    .pipe(gulp.dest("src/app"));
}

function returnPreviousTemplateCacheFile() {
  return gulp.src('src/app/templateCacheWebPackHTML.js')
    .pipe(rename('templateCacheHtml.js'))
    .pipe(gulp.dest('src/app/'), { overwrite: true });
}

function other() {
  const fileFilter = filter((file) => {
    return file.stat.isFile();
  });

  return gulp.src([
      path.join('src', '/**/*'),
      path.join('src', '/**/.htaccess'),
      `!${path.join('src', '/**/*.{html,css,js,scss,ts,ejs}')}`,
      `!${path.join('src', '/bower_components/**/*')}`,
      `!${path.join('src', '/external/**/*')}`,
    ], { base: 'src' })
    .pipe(fileFilter)
    .pipe(gulp.dest('dist'));
}

const build = gulp.parallel(version, partials, other, env);
const clean = gulp.series(returnPreviousTemplateCacheFile);

exports.build = build;
exports.other = other;
exports.clean = clean;
