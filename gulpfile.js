const { src, dest, watch, parallel, series } = require("gulp");
const scss = require("gulp-sass")(require("sass"));
const autoprefixer = require("gulp-autoprefixer");
const group_media = require("gulp-group-css-media-queries");
const sourcemaps = require("gulp-sourcemaps");
const uglify = require("gulp-uglify-es").default;
const imagemin = require("gulp-imagemin");
const rename = require("gulp-rename");
const del = require("del");
const browserSync = require("browser-sync").create();

const sourceFolder = "app/gallery";
const projectFolder = "dist/gallery";

const path = {
   app: {
      html: sourceFolder + "/html/*.html",
      scss: [sourceFolder + "/scss/*.scss", "!" + sourceFolder + "/scss/_*.scss"],
      js: sourceFolder + "/*.js",
      img: sourceFolder + "/img/*",
   },
   dest: {
      html: projectFolder + "/html/",
      css: projectFolder + "/css/",
      js: projectFolder,
      img: projectFolder + "/img/",
   },
   watch: {
      html: sourceFolder + "/html/*.html",
      css: sourceFolder + "/scss/**/*.scss",
      js: sourceFolder + "/**/*.js",
      img: sourceFolder + "/img/*",
   },
   cleanAll: "./" + projectFolder + "/",
};

function depend() {
   return src("app/*.*").pipe(dest("dist")).pipe(browserSync.stream());
}

// Работа с файлами html
function html() {
   return src(path.app.html).pipe(dest(path.dest.html)).pipe(browserSync.stream());
}

// Работа с файлами стилей
function styles() {
   return src(path.app.scss)
      .pipe(
         rename(function (path) {
            path.basename += ".min";
         })
      )
      .pipe(sourcemaps.init())
      .pipe(
         scss({
            outputStyle: "compressed",
         }).on("error", scss.logError)
      )
      .pipe(group_media())
      .pipe(
         autoprefixer({
            grid: true,
            overrideBrowserslist: ["last 5 versions"],
            cascade: true,
         })
      )
      .pipe(sourcemaps.write("./maps"))
      .pipe(dest(path.dest.css))
      .pipe(browserSync.stream({ match: "**/*.css" }));
}

// Работа с фалами js
function scripts() {
   return src(path.app.js)
      .pipe(
         rename(function (path) {
            path.basename += ".min";
         })
      )
      .pipe(sourcemaps.init())
      .pipe(uglify())
      .pipe(sourcemaps.write())
      .pipe(dest(path.dest.js))
      .pipe(browserSync.stream());
}

// Работа с изображениями
function images() {
   return src(path.app.img)
      .pipe(
         imagemin([
            imagemin.gifsicle({ interlaced: true }),
            imagemin.mozjpeg({ quality: 75, progressive: true }),
            imagemin.optipng({ optimizationLevel: 5 }),
            imagemin.svgo({
               plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
            }),
         ])
      )
      .pipe(dest(path.dest.img))
      .pipe(browserSync.stream());
}

// Отслеживание изменений в файле
function watching() {
   watch([path.watch.html], html);
   watch([path.watch.css], styles);
   watch([path.watch.js], scripts);
   watch([path.watch.img], images);
   watch(["app/*.*"], depend);
}

function browsersync() {
   browserSync.init({
      server: "./dist",
   });
}

function clean() {
   return del(path.cleanAll);
}

const server = series(clean, parallel(html, styles, scripts, images, depend), parallel(watching, browsersync));
const build = series(clean, parallel(html, styles, scripts, images, depend));

exports.server = server;
exports.build = build;

exports.default = server;
