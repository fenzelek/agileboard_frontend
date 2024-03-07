(function ()
{
    'use strict';

    angular
        .module('app.core')
        .factory('dialogService', dialogService);

    /** @ngInject */
    function dialogService($mdDialog, transService)
    {
        var service = {
            alert: alert,
            confirm: confirm,
            customDialog: customDialog
        };

        return service;

        /**
         *  show alert dialog
         *
         * @param e
         * @param message
         */
        function alert(e, message) {
            $mdDialog.show(
                $mdDialog.alert()
                    .clickOutsideToClose(true)
                    .title(transService.translate(message))
                    .ariaLabel('Alert dialog')
                    .ok('OK')
                    // .targetEvent(e)
            );
        }

        /**
         * show confirm dialog
         *
         * @param e
         * @param question
         * @param ok
         * @param cancel
         * @param translate_yes
         * @param translate_no
         */
        function confirm(e, question, ok, cancel, translate_yes, translate_no) {

            var yes = translate_yes == undefined ? 'OTHER.OK' : translate_yes;
            var no = translate_no == undefined ? 'OTHER.CANCEL' : translate_no;

            var confirm = $mdDialog.confirm()
                .title(transService.translate(question))
                .ariaLabel('Confirm dialog')
                .ok(transService.translate(yes))
                .cancel(transService.translate(no));

            if (e != null) {
                confirm.targetEvent(e)
            }

            $mdDialog.show(confirm).then(
                function() {
                    if (ok != undefined && ok != null)
                        ok()
                },
                function() {
                    if (cancel != undefined && cancel != null)
                        cancel()
                }
            );
        }

        /**
         * show custom dialog
         *
         * @param e
         * @param name_controller
         * @param html_file
         * @param items
         * @param closure_with_response
         * @param closure_without_response
         * @param closure_finally
         * @param clickOutsideToClose
         */
        function customDialog(e, name_controller, html_file, items, closure_with_response, closure_without_response, closure_finally, clickOutsideToClose, escapeToClose) {

            if (items == undefined) {
                items = null;
            }

            $mdDialog.show({
                controller: name_controller,
                controllerAs: 'vm',
                templateUrl: html_file,
                parent: angular.element(document.body),
                targetEvent: e,
                clickOutsideToClose: typeof clickOutsideToClose == 'undefined' ? true : clickOutsideToClose,
                fullscreen: true,
                locals: items,
                escapeToClose: escapeToClose
            }).then(
                function(response) {
                    if (closure_with_response != undefined && closure_with_response != null)
                        closure_with_response(response);
                },
                function() {
                    if (closure_without_response != undefined && closure_without_response != null)
                        closure_without_response()
                }
            ).finally(function() {
                if (closure_finally != undefined && closure_finally != null)
                    closure_finally();
            });
        }
    }
})();
