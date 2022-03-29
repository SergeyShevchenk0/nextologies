"use strict";
const gulp = require("gulp"),
  htmlmin = require("gulp-htmlmin"),
  sass = require("gulp-sass"),
  cssnano = require("gulp-cssnano"),
  bulkSass = require("gulp-sass-bulk-import"),
  sourcemaps = require("gulp-sourcemaps"),
  autoprefixer = require("gulp-autoprefixer"),
  webp = require("gulp-webp"),
  browserSync = require("browser-sync").create(),
  svgmin = require("gulp-svgmin"),
  svgSprite = require("gulp-svg-sprite"),
  del = require("del"),
  concat = require("gulp-concat"),
  uglify = require("gulp-uglify-es").default,
  babel = require("gulp-babel"),
  gulpif = require("gulp-if"),
  argv = require("yargs").argv,
  newer = require("gulp-newer"),
  imgSrc = "dev/images/*.*",
  imgWebpSrc = "dev/images/*.{jpg,png}",
  imgDest = "build/images",
  imgWebpDest = "build/images/webp",
  fileinclude = require("gulp-file-include");

gulp.task("sass", () =>
  gulp
    .src("dev/**/*.scss")
    .pipe(gulpif(!argv.prod, sourcemaps.init()))
    .pipe(bulkSass())
    .pipe(
      sass({
        outputStyle: "compact",
        includePaths: ["./sass"],
      }).on("error", sass.logError)
    )
    .pipe(
      autoprefixer({
        browsers: ["last 7 versions"],
        cascade: false,
      })
    )
    .pipe(gulpif(argv.prod, cssnano(), sourcemaps.write("../maps")))
    .pipe(gulp.dest("build"))
    .on("end", browserSync.reload)
);

gulp.task("imagemin", () =>
  gulp
    .src(imgSrc)
    .pipe(newer(imgDest))
    .pipe(gulp.dest(imgDest))
    .on("end", browserSync.reload)
);

gulp.task("html", () =>
  gulp
    .src("dev/**/*.html")
    .pipe(
      fileinclude({
        prefix: "@@",
        basepath: "@file",
      })
    )
    .pipe(gulpif(argv.prod, htmlmin({ collapseWhitespace: true })))
    .pipe(gulp.dest("build"))
    .on("end", browserSync.reload)
);

gulp.task("webP", () =>
  gulp
    .src(imgWebpSrc)
    .pipe(newer(imgWebpDest))
    .pipe(webp({ quality: 80 }))
    .pipe(gulp.dest(imgWebpDest))
    .on("end", browserSync.reload)
);

gulp.task("scripts", () =>
  gulp
    .src(["dev/js/lib/*.js", "dev/js/blocks/*.js"])
    // .pipe(gulpif(!argv.prod, sourcemaps.init()))
    .pipe(newer("build/js/all.min.js"))
    .pipe(concat("all.min.js"))
    .pipe(
      gulpif(
        argv.prod,
        babel({
          presets: ["@babel/env"],
        })
      )
    )
    // .pipe(gulpif(argv.prod, uglify(), sourcemaps.write("../maps")))
    .pipe(gulp.dest("build/js"))
    .on("end", browserSync.reload)
);

gulp.task("svg", () =>
  gulp
    .src("dev/images/svgSprite/*.svg")
    .pipe(
      svgmin({
        js2svg: {
          pretty: true,
        },
      })
    )
    // .pipe(
    //   svgSprite({
    //     mode: {
    //       symbol: {
    //         sprite: "sprite.svg",
    //       },
    //     },
    //   })
    // )
    .pipe(gulp.dest("build/images/icons/"))
);

gulp.task("serve", function () {
  browserSync.init({
    server: {
      baseDir: "build",
    },
  });
});

gulp.task("watch", function () {
  gulp.watch("dev/**/*.scss", gulp.series("sass"));
  gulp.watch("dev/images/svgSprite/*.svg", gulp.series("svg"));
  gulp.watch("dev/images/*.*", gulp.parallel("imagemin", "webP"));
  gulp.watch("dev/**/*.html", gulp.series("html"));
  gulp.watch("dev/js/**/*.*", gulp.series("scripts"));
});

gulp.task("copy", () =>
  gulp
    .src(["dev/fonts/*.*", "dev/js/json/*.*"], {
      base: "dev",
    })
    .pipe(gulp.dest("build/"))
);

gulp.task("clean", () => del(["build"], { force: true }));

gulp.task(
  "build",
  gulp.series(
    "clean",
    gulp.parallel("copy", "html", "sass", "scripts", "imagemin", "svg", "webP")
  )
);

gulp.task(
  "default",
  gulp.series(
    //'clean',
    gulp.parallel("watch", "serve")
  )
);
