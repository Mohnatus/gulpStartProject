const { src, dest, parallel, watch } = require('gulp');
const concat = require('gulp-concat');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const filesize = require('gulp-filesize');
const rename = require('gulp-rename');
const gulpif = require('gulp-if');
const eslint = require('gulp-eslint');
const plumber = require("gulp-plumber");

const needWatch = process.argv.indexOf("--watch") !== -1;

const groupTask = group => (cb) => {
    src(group.files)
        .pipe(plumber())
        .pipe(gulpif(group.lint, eslint()))
        .pipe(gulpif(group.lint, eslint.format()))
        .pipe(gulpif(group.lint, eslint.failAfterError()))
        .pipe(concat(group.name))
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(dest(group.dest))
        .pipe(filesize())
        .pipe(gulpif(group.uglify, uglify()))
        .pipe(gulpif(group.uglify, rename({ extname: '.min.js' })))
        .pipe(gulpif(group.uglify, dest(group.dest)))
        .pipe(gulpif(group.uglify, filesize()));
    cb();
}

const taskWrapper = (config, sync) => {
    const jsSrc = config.src + '/' + config.js.src;
    const groups = config.js.groups.map(group => {
        group.files = group.files.map(file => jsSrc + '/' + file);  
        group.dest = config.dest + '/' + config.js.dest;
        return groupTask(group);
    });

    const task = parallel(groups);

    if (needWatch) {
        watch(config.js.watch.map(file => config.src + '/' + file), { events: 'change'}, (cb) => {
            task(cb);
            sync.reload(cb);
        });
    }
        
    return task;
};

module.exports = taskWrapper;