let preprocessor = 'sass'
const gulp = require('gulp')
const { src, dest, parallel, series, watch } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const autoprefixer = require('gulp-autoprefixer');
const cleancss = require('gulp-cleaner-css');
const imagecomp = require('compress-images');
const clean = require('gulp-clean');
const purgecss = require('gulp-purgecss')

function browsersync() {//сервер с автообновлением
	browserSync.init({ 
		server: { baseDir: 'app/' }, // путь до файлов
		notify: false, // уведомления
		online: true // Режим работы
	})
}

function scripts() {
	return src([ 
		'node_modules/jquery/dist/jquery.min.js', // Пример подключения библиотеки
		'app/js/main.js', // родные скрипты, идут после библиотек!!!!
		])
	.pipe(concat('main.min.js')) // Сборка в 1 файл
	.pipe(uglify()) // Сжатие
	.pipe(dest('dist/js/')) // Куда выгружать собранные скрипты
	.pipe(browserSync.stream()) // Запускаем обновление страницы
}
function styles() {
	return src('app/' + preprocessor + '/main.scss') // Выбираем источник: "app/sass/main.sass" или "app/less/main.less"
	.pipe(eval(preprocessor)()) // Преобразуем значение переменной "preprocessor" в функцию
	.pipe(concat('app.min.css')) // Конкатенируем в файл app.min.js
	.pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true })) // Создадим префиксы с помощью Autoprefixer
	.pipe(cleancss( { level: { 1: { specialComments: 0 } }/* , format: 'beautify' */ } )) // Минифицируем стили
	.pipe(dest('dist/css/')) // Выгрузим результат в папку "app/css/"
	.pipe(browserSync.stream()) // Сделаем инъекцию в браузер
}

async function images() {
	imagecomp(
		"app/img/src/**/*", // Берём все изображения из папки источника
		"app/img/dest/", // Выгружаем оптимизированные изображения в папку назначения
		{ compress_force: false, statistic: true, autoupdate: true }, false, // Настраиваем основные параметры
		{ jpg: { engine: "mozjpeg", command: ["-quality", "75"] } }, // Сжимаем и оптимизируем изображеня
		{ png: { engine: "pngquant", command: ["--quality=75-100", "-o"] } },
		{ svg: { engine: "svgo", command: "--multipass" } },
		{ gif: { engine: "gifsicle", command: ["--colors", "64", "--use-col=web"] } },
		function (err, completed) { // Обновляем страницу по завершению
			if (completed === true) {
				browserSync.reload()
			}
		}
	)
}
function cleanimg() {
	return src('app/img/dest/', {allowEmpty: true}).pipe(clean()) // Удаляет папку "app/images/dest/"
}

function startwatch() {
	watch(['app/**/*.js', '!app/**/*.min.js'], scripts);
    watch('app/**/' + preprocessor + '/**/*', styles);
    watch('app/**/*.html').on('change', browserSync.reload);
    watch('app/img/src/**/*', images);
}
function buildcopy() {
	return src([ // Выбираем нужные файлы
		'app/img/dest/**/*',
		'app/**/*.html',
		], { base: 'app' }) // Параметр "base" сохраняет структуру проекта при копировании
	.pipe(dest('dist')) // Выгружаем в папку с финальной сборкой
}
function cleandist() {
	return src('dist', {allowEmpty: true}).pipe(clean()) // Удаляем папку "dist/"
}
function purgeCss() { //чистка неиспользуемого css
    return src('dist/**/*.min.css')
        .pipe(purgecss({
            content: ['dist/**/*.html']
        }))
        .pipe(gulp.dest('dist/'))
}

//задачи
    exports.purgecss = purgeCss;
    exports.cleanimg = cleanimg;
    exports.images = images;
    exports.styles = styles;
    exports.browsersync = browsersync;
    exports.scripts = scripts;
    exports.default = parallel(styles, scripts, browsersync, startwatch, purgeCss);
    exports.build = series(cleandist, styles, scripts, images, buildcopy);
  