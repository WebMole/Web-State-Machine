module.exports = function(grunt) {
    'use strict';

    // Project configuration.
    grunt.initConfig({
        // Metadata.
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= pkg.license %> */\n',
        
        // Task configuration.
        concat: {
            options: {
                banner: '<%= banner %>',
                stripBanners: true
            },
            dist: {
                src: ['src/**/*.js'],
                dest: 'dist/<%= pkg.name %>.js'
            }
        },
        uglify: {
            options: {
                banner: '<%= banner %>'
            },
            dist: {
                src: '<%= concat.dist.dest %>',
                dest: 'dist/<%= pkg.name %>.min.js'
            }
        },
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                unused: true,
                boss: true,
                eqnull: true,
                browser: true,
                globals: {
                    jQuery: true,
                    module: true,
                    console: true
                }
            },
            gruntfile: {
                src: 'Gruntfile.js'
            }
            // lib_test: {
            //     src: [
            //     'lib/**/*.js',
            //     'test/**/*.js'
            //     ]
            // }
        },
        // For jasmine usage, see: http://pivotal.github.io/jasmine/
        // For grunt's jasmine, see: https://github.com/gruntjs/grunt-contrib-jasmine
        jasmine: {
            wsm: {
                src: 'src/**/*.js',
                options: {
                    specs: 'spec/*Spec.js',
                    helpers: 'spec/*Helper.js'
                    // template: 'custom.tmpl'
                }
            }
        },
        watch: {
            gruntfile: {
                files: '<%= jshint.gruntfile.src %>',
                tasks: ['jshint:gruntfile']
            },
            test: {
                files: ['<%= jasmine.wsm.src %>', '<%= jasmine.wsm.options.specs %>', '<%= jasmine.wsm.options.helpers%>'],
                tasks: ['test']
            }
            // lib_test: {
            //     files: '<%= jshint.libTest.src %>',
            //     tasks: ['jshint:libTest']
            // }
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jasmine');

    // Default task (grunt).
    grunt.registerTask('default', ['jasmine', 'jshint', 'concat', 'uglify']);

    grunt.registerTask('debug', function() {
        grunt.log.write(grunt.file.readJSON('package.json').name);
    });

    // (grunt dev)
    grunt.registerTask('dev', ['watch']);

    // (grunt test)
    grunt.registerTask('test', ['jasmine']);

};
