const gulp = require('gulp');
const apply = require('postcss-apply');
const autoprefixer = require('autoprefixer');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const cssnano = require('cssnano');
const del = require("del");
const ghPages = require('gulp-gh-pages');
const imagemin = require('gulp-imagemin');
const panini = require('panini');
const plumber = require("gulp-plumber");
const postcss = require('gulp-postcss');
const rename = require('gulp-rename');
const atImport = require("postcss-import");
const sourcemaps = require('gulp-sourcemaps');
const tailwindcss = require('tailwindcss');

function resetPages(done) {
  panini.refresh();
  done();
}

function clean() {
  return del(["./dist/assets"]);
}

// Optimize Images
function images() {
  return gulp.src("./src/assets/img/**/*")
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.jpegtran({ progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [
            {
              removeViewBox: false,
              collapseGroups: true
            }
          ]
        }),
      ], { verbose: true })
    )
    .pipe(gulp.dest("./dist/assets"));
}

function html() {
  return gulp.src('./src/pages/**/*.html')
    .pipe(panini({
      root: './src/pages/',
      layouts: './src/layouts/',
      partials: './src/partials/',
      data: './src/data/'
    }))
    .pipe(gulp.dest('dist'));
}

function css() {
  var plugins = [
    autoprefixer({browsers: ['last 2 versions']}),
    atImport,
    apply,
    tailwindcss('./tailwind.config.js'),
    cssnano({
      preset: 'default'
    })
  ];
  return gulp
    .src('./src/css/main.css')
    .pipe(sourcemaps.init())
    .pipe(postcss(plugins))
    .pipe(plumber())
    .pipe(gulp.dest('./dist/css/'))
    .pipe(browserSync.stream());
}

function js() {
  return gulp.src('./src/js/*.js', { sourcemaps: true })
    .pipe(concat('app.min.js'))
    .pipe(gulp.dest('./dist/js/', { sourcemaps: true }));
}

function browser() {
  browserSync.init({
    port: 8585,
    server: { baseDir: './dist/'}
  });
  gulp.watch(['./src/css/*.css', 'tailwind.config.js'], css);
  gulp.watch('./src/js/*.js', js).on('change', browserSync.stream);
  gulp.watch(['./src/{layouts,partials,helpers,pages,data}/**/*']).on('change', gulp.series(resetPages, html));
};

function deploy() {
  return gulp
    .src('./dist/**/*')
    .pipe(ghPages());
}


const build = gulp.series(clean, gulp.parallel(css, images, html, js, deploy));
exports.build = build;
exports.html = html;
exports.css = css;
exports.js = js;
exports.default = browser;
