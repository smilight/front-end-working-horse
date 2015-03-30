process.stdin.setMaxListeners(0);
process.stdout.setMaxListeners(Infinity);
var gulp = require('gulp'),
    del = require('del'),
    path = require('path'),
    $ = require('gulp-load-plugins')(),
    config = {
        "dev_folder":'dev', // dir path end without "/"
        "dist_folder":'dist', // dir path end without "/"
        'env': 'development', // production or development
        'sass': './dev/**/*.scss', // with file extension
        'css': './dist/css', // without file extension
        'images': ['./dev/**/*.png', './dev/**/*.jpg', './dev/**/*.gif','!./dev/**/sprite/*','!./dev/**/sprites/*'],
        'images_dest': './dist/',
        'fonts': './dev/fonts/**',
        'js': './dev/js/**/*.js',
        'twig_data' :require('./locale/ru.json'),
        'twig_cache': false,
        'twig_files':['./dev/templates/**/*.twig','./dev/pages/**/*.twig','!./dev/templates/**/_*.twig','!./dev/pages/**/_*.twig'],
        'twig_watch':['./dev/templates/**/*.twig','./dev/pages/**/*.twig']
    },
    AUTOPREFIXER_BROWSERS = [
        'ie >= 9',
        'ie_mob >= 10',
        'ff >= 30',
        'chrome >= 34',
        'safari >= 5',
        'opera >= 23',
        'ios >= 5',
        'android >= 4.1',
        'bb >= 10'
    ];

gulp.task('images:copy', function () {
    gulp.src(config.images)
        .pipe($.copy(config.images_dest, {prefix: 1}))
});

gulp.task('fonts', function () {
    gulp.src(config.fonts)
        .pipe($.copy(config.dist_folder, {prefix: 1}))
});

gulp.task('js', function () {
    gulp.src(config.js)
        .pipe($.copy(config.dist_folder, {prefix: 1}))
});

gulp.task('images:copy', function () {
    gulp.src(config.images)
        .pipe($.copy(config.images_dest, {prefix: 1}))
});

gulp.task('images:optimize', function () {
    return gulp.src(config.images)
        .pipe($.cache($.imagemin({
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest(config.images_dest))
        .pipe($.size({title: 'images'}));
});

gulp.task('styles:compile', function () {
    return gulp.src(config.sass)
        .pipe($.plumber({
            errorHandler: function (error) {
                console.log(error.message);
                this.emit('end');
            }
        }))
        .pipe($.tap(function (file, t) {
            if (path.basename(file.path).substring(0, 1) != "_") {
                return gulp.src(file.path)
                    .pipe($.compass({
                        css: path.dirname(file.path).replace(config.dev_folder, config.dist_folder).replace('sass', 'css'),
                        sass: path.dirname(file.path),
                        image: path.dirname(file.path).replace('sass', 'images'),
                        http_path: path.dirname(file.path).replace('sass', ''),
                        generated_images_path: path.dirname(file.path).replace(config.dev_folder, config.dist_folder).replace('sass', 'images'),
                        require: ['sass-globbing', 'sass-media_query_combiner'],
                        relative: true,
                        sourcemap: config.env != 'production',
                        comments: config.env != 'production'
                    }))
                    .on('error', console.error.bind(console))
                    .pipe($.csslint())
                    .pipe($.csslint.reporter())
                    .pipe($.if(config.env == 'production', $.autoprefixer({browsers: AUTOPREFIXER_BROWSERS})))
                    .pipe($.if(config.env == 'production', $.uncss({
                        html: [config.dist_folder+'/*.html']
                    })))
                    .pipe($.if(config.env == 'production', $.csso()))
                    .pipe(gulp.dest(path.dirname(file.path).replace(config.dev_folder, config.dist_folder).replace('sass', 'css')))
                    .pipe($.size({title: 'styles'}));
            }
        }));
});
gulp.task('styles:watch', function () {
    return gulp.src(config.sass)
        .pipe($.plumber({
            errorHandler: function (error) {
                console.log(error.message);
                this.emit('end');
            }
        }))
        .pipe($.tap(function (file, t) {
            if (path.basename(file.path).substring(0, 1) != "_") {
                return gulp.src(file.path)
                    .pipe($.compass({
                        css: path.dirname(file.path).replace(config.dev_folder, config.dist_folder).replace('sass', 'css'),
                        sass: path.dirname(file.path),
                        image: path.dirname(file.path).replace('sass', 'images'),
                        http_path: path.dirname(file.path).replace('sass', ''),
                        generated_images_path: path.dirname(file.path).replace(config.dev_folder, config.dist_folder).replace('sass', 'images'),
                        require: ['sass-globbing', 'sass-media_query_combiner'],
                        relative: true,
                        sourcemap: true,
                        comments: true
                    }))
                    .on('error', console.error.bind(console))
                    .pipe($.csslint())
                    .pipe($.csslint.reporter())
                    .pipe(gulp.dest(path.dirname(file.path).replace(config.dev_folder, config.dist_folder).replace('sass', 'css')))
                    .pipe($.size({title: 'styles'}));
            }
        }));
});

gulp.task('clean:all', del.bind(null, config.dist_folder));

gulp.task('clean:cache', function(done){return $.cache.clearAll(done);});

gulp.task('twig:compile', function () {
    return gulp.src(config.twig_files)
        .pipe($.plumber({
            errorHandler: function (error) {
                console.log(error.message);
                this.emit('end');
            }
        }))
        .pipe($.twig({
            "base": config.dev_folder+'/templates/',
            "errorLogToConsole": true,
            "cache": config.twig_cache,
            "data": config.twig_data ? config.twig_data : false
        }))
        .pipe($.htmlhint({
            "tag-pair": true,
            "img-alt-require": true,
            "doctype-html5": true,
            "id-unique": true
        }))
        .pipe($.htmlhint.reporter())
        .pipe($.if(config.env == 'production', $.htmlmin({collapseWhitespace: true})))
        .pipe($.if(config.env == 'production', $.minifyInline({})))
        .pipe(gulp.dest(config.dist_folder))
        .pipe($.size({title: 'html'}));
});
gulp.task('twig:watch', function () {
    return gulp.src(config.twig_files)
        .pipe($.plumber({
            errorHandler: function (error) {
                console.log(error.message);
                this.emit('end');
            }
        }))
        .pipe($.twig({
            "base": config.dev_folder+'/templates/',
            "errorLogToConsole": true,
            "cache": config.twig_cache,
            "data": config.twig_data ? config.twig_data : false
        }))
        .pipe($.htmlhint({
            "tag-pair": true,
            "img-alt-require": true,
            "doctype-html5": true,
            "id-unique": true
        }))
        .pipe($.htmlhint.reporter())
        .pipe(gulp.dest(config.dist_folder))
        .pipe($.size({title: 'html'}));
});

gulp.task('watch', function () {
    gulp.watch(config.sass, ['styles:watch']);
    gulp.watch(config.twig_watch, ['twig:watch']);
    gulp.watch(config.images, ['images:copy']);
});
gulp.task('default', ['watch']);
gulp.task('build:loc', ['clean:all','twig:compile','styles:compile','images:optimize','fonts','js']);
gulp.task('build:prod',function(cb){
    config.env = 'production';
    $.runSequence('clean:all', ['clean:cache','twig:compile','styles:compile','images:optimize','fonts','js'], cb);
});