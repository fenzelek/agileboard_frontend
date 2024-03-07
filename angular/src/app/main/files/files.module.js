(function ()
{
    'use strict';

    angular
        .module('app.files', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider.state('app.files', {
            url      : '/projects/:project_id/files',
            views    : {
                'content@app': {
                    templateUrl: 'app/main/files/files.html',
                    controller : 'FilesController as vm'
                }
            },
            bodyClass: 'files'
        });
    }

})();
