var gulp   = require('gulp');
var tsc    = require('gulp-tsc');
var shell  = require('gulp-shell');
var runseq = require('run-sequence');
var tslint = require('gulp-tslint');
var browserify = require('gulp-browserify')
var rimraf = require('rimraf');
var paths = {
  tscripts : { src : ['app/src/**/*.ts'],
    dest : 'app/build/tmp'
  },
  nodescripts: {
    src : ['app/build/tmp/*.js'],
    dest: 'app/build'
  }
};

gulp.task('default', ['lint', 'build']);

// ** Watching ** //

gulp.task('watch', function () {
  gulp.watch(paths.tscripts.src, ['compile:typescript']);
});

gulp.task('watchrun', function () {
  gulp.watch(paths.tscripts.src, runseq('compile:typescript', 'run'));
});

// ** Compilation ** //

gulp.task('build', ['compile:typescript']);

var exec_tsc = function () {
  return gulp
  .src(paths.tscripts.src)
  .pipe(tsc({
    module: "commonjs",    
    emitError: false
  }))
  .pipe(gulp.dest(paths.tscripts.dest));
};

gulp.task('compile:typescript', exec_tsc);

var exec_clean = function (cb) {
  rimraf(paths.nodescripts.dest, cb);
};

gulp.task('clean', exec_clean);


var exec_browserify = function(){
  return gulp
  .src(paths.nodescripts.src)
  .pipe(browserify())
  .pipe(gulp.dest(paths.nodescripts.dest));
};

gulp.task('browserify', exec_browserify);

// ** Linting ** //

gulp.task('lint', ['lint:default']);
gulp.task('lint:default', function(){
      return gulp.src(paths.tscripts.src)
        .pipe(tslint())
        .pipe(tslint.report('prose', {
          emitError: false
        }));
});
